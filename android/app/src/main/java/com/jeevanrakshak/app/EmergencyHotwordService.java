package com.jeevanrakshak.app;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.media.AudioManager;
import android.media.ToneGenerator;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.telephony.SmsManager;
import android.util.Base64;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class EmergencyHotwordService extends Service implements RecognitionListener, SensorEventListener {

    public static final String EXTRA_EMERGENCY_NUMBER = "extra_emergency_number";
    public static final String EXTRA_CONTACT_NUMBERS_CSV = "extra_contact_numbers_csv";

    private static final String CHANNEL_ID = "jr_hotword_guard_channel";
    private static final int NOTIFICATION_ID = 2026;
    private static final long EMERGENCY_COOLDOWN_MS = 25000;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final List<Long> detections = new ArrayList<>();
    private final List<Long> shakeDetections = new ArrayList<>();
    private final Pattern hotwordPattern = Pattern.compile("\\b(sos|help|bachao|बचाओ)\\b", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    private SpeechRecognizer speechRecognizer;
    private Intent speechIntent;
    private boolean isListening = false;
    private SensorManager sensorManager;
    private Sensor accelerometer;
    private ToneGenerator toneGenerator;
    private long lastShakeSampleAt = 0L;
    private long lastEmergencyTriggerAt = 0L;

    private final Runnable restartListening = this::startListeningSafely;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        startForeground(NOTIFICATION_ID, buildNotification("Background protection active"));
        initializeSpeechRecognizer();
        initializeShakeDetector();
        try {
            toneGenerator = new ToneGenerator(AudioManager.STREAM_ALARM, 100);
        } catch (Exception ignored) {
            toneGenerator = null;
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String emergencyNumber = intent.getStringExtra(EXTRA_EMERGENCY_NUMBER);
            String contactNumbersCsv = intent.getStringExtra(EXTRA_CONTACT_NUMBERS_CSV);
            EmergencyConfigStore.saveConfig(this, emergencyNumber, contactNumbersCsv);
        }

        updateNotification("Listening for SOS / help / bachao and repeated shakes");
        startListeningSafely();
        return START_STICKY;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        handler.removeCallbacksAndMessages(null);
        if (sensorManager != null) {
            sensorManager.unregisterListener(this);
        }
        if (speechRecognizer != null) {
            speechRecognizer.setRecognitionListener(null);
            speechRecognizer.destroy();
            speechRecognizer = null;
        }
        if (toneGenerator != null) {
            toneGenerator.release();
            toneGenerator = null;
        }
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        Intent restartServiceIntent = new Intent(getApplicationContext(), EmergencyHotwordService.class);
        ContextCompat.startForegroundService(getApplicationContext(), restartServiceIntent);
        super.onTaskRemoved(rootIntent);
    }

    private void initializeSpeechRecognizer() {
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            updateNotification("Speech recognition unavailable on this device");
            return;
        }

        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this);
        speechRecognizer.setRecognitionListener(this);

        speechIntent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        speechIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        speechIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault());
        speechIntent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        speechIntent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);
        speechIntent.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getPackageName());
    }

    private void initializeShakeDetector() {
        sensorManager = (SensorManager) getSystemService(SENSOR_SERVICE);
        if (sensorManager == null) {
            updateNotification("Sensor manager unavailable for shake detection");
            return;
        }

        accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        if (accelerometer == null) {
            updateNotification("Accelerometer not available for shake detection");
            return;
        }

        sensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_NORMAL);
    }

    private void startListeningSafely() {
        if (speechRecognizer == null || speechIntent == null) return;

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            updateNotification("Audio permission missing for hotword detection");
            return;
        }

        if (isListening) return;

        try {
            speechRecognizer.startListening(speechIntent);
            isListening = true;
        } catch (Exception ignored) {
            scheduleRestart(1500);
        }
    }

    private void scheduleRestart(long delayMs) {
        handler.removeCallbacks(restartListening);
        handler.postDelayed(restartListening, delayMs);
    }

    private Notification buildNotification(String text) {
        Intent openIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            0,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Jeevan Rakshak Guard")
            .setContentText(text)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .build();
    }

    private void updateNotification(String text) {
        NotificationManagerCompat.from(this).notify(NOTIFICATION_ID, buildNotification(text));
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Jeevan Rakshak Background Guard",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Always-on hotword safety service");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private void processBundle(Bundle results) {
        if (results == null) return;

        ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        if (matches == null || matches.isEmpty()) return;

        long now = System.currentTimeMillis();
        int hits = 0;

        for (String transcript : matches) {
            if (transcript == null) continue;
            Matcher matcher = hotwordPattern.matcher(transcript.toLowerCase(Locale.ROOT));
            while (matcher.find()) {
                hits++;
            }
        }

        for (int i = 0; i < hits; i++) {
            detections.add(now);
        }

        detections.removeIf(t -> now - t > 7000);

        if (detections.size() >= 3) {
            detections.clear();
            triggerEmergencySequence("Hotword");
        }
    }

    private synchronized void triggerEmergencySequence(String reason) {
        long now = System.currentTimeMillis();
        if (now - lastEmergencyTriggerAt < EMERGENCY_COOLDOWN_MS) {
            updateNotification("Emergency already triggered. Cooldown active.");
            return;
        }

        lastEmergencyTriggerAt = now;
        playSiren();
        updateNotification(reason + " detected. Triggering emergency call and SMS.");

        List<String> numbers = EmergencyConfigStore.getAllNumbers(this);
        if (numbers.isEmpty()) {
            numbers.add(EmergencyConfigStore.DEFAULT_NUMBER);
        }

        String message = buildEmergencyMessage(reason);
        boolean localSmsSent = sendSmsWithDevice(numbers, message);
        if (!localSmsSent) {
            sendSmsWithTwilio(numbers, message);
        }

        startCallCascade(numbers, 0);
    }

    private String buildEmergencyMessage(String reason) {
        String timestamp = new SimpleDateFormat("dd MMM yyyy HH:mm:ss", Locale.getDefault()).format(new Date());
        return "SOS ALERT from Jeevan Rakshak. " + reason + " emergency triggered at " + timestamp + ". Please call immediately.";
    }

    private void playSiren() {
        try {
            if (toneGenerator == null) {
                toneGenerator = new ToneGenerator(AudioManager.STREAM_ALARM, 100);
            }
            toneGenerator.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 9000);
        } catch (Exception ignored) {
            // Keep emergency sequence running even if siren playback fails.
        }
    }

    private boolean sendSmsWithDevice(List<String> numbers, String message) {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
            return false;
        }

        try {
            SmsManager smsManager = SmsManager.getDefault();
            for (String number : numbers) {
                smsManager.sendTextMessage(number, null, message, null, null);
            }
            return true;
        } catch (Exception ignored) {
            return false;
        }
    }

    private void sendSmsWithTwilio(List<String> numbers, String message) {
        if (!hasTwilioConfig()) {
            return;
        }

        new Thread(() -> {
            for (String number : numbers) {
                sendTwilioMessage(number, message);
            }
        }).start();
    }

    private boolean hasTwilioConfig() {
        return !AppSecrets.TWILIO_ACCOUNT_SID.isEmpty()
            && !AppSecrets.TWILIO_API_KEY_SID.isEmpty()
            && !AppSecrets.TWILIO_API_SECRET.isEmpty()
            && !AppSecrets.TWILIO_FROM_NUMBER.isEmpty();
    }

    private void sendTwilioMessage(String to, String body) {
        HttpURLConnection connection = null;
        try {
            String endpoint = "https://api.twilio.com/2010-04-01/Accounts/" + AppSecrets.TWILIO_ACCOUNT_SID + "/Messages.json";
            URL url = new URL(endpoint);
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(10000);
            connection.setDoOutput(true);

            String auth = AppSecrets.TWILIO_API_KEY_SID + ":" + AppSecrets.TWILIO_API_SECRET;
            String basic = Base64.encodeToString(auth.getBytes(StandardCharsets.UTF_8), Base64.NO_WRAP);
            connection.setRequestProperty("Authorization", "Basic " + basic);
            connection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");

            String payload = "To=" + URLEncoder.encode(to, "UTF-8")
                + "&From=" + URLEncoder.encode(AppSecrets.TWILIO_FROM_NUMBER, "UTF-8")
                + "&Body=" + URLEncoder.encode(body, "UTF-8");

            try (OutputStream os = connection.getOutputStream()) {
                os.write(payload.getBytes(StandardCharsets.UTF_8));
            }

            connection.getResponseCode();
        } catch (Exception ignored) {
            // Ignore Twilio fallback errors to keep service resilient.
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    private void startCallCascade(List<String> numbers, int index) {
        if (index >= numbers.size()) {
            updateNotification("Emergency sequence completed.");
            return;
        }

        placeCall(numbers.get(index));

        if (index + 1 < numbers.size()) {
            handler.postDelayed(() -> startCallCascade(numbers, index + 1), 30000);
        }
    }

    private void placeCall(String number) {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CALL_PHONE) != PackageManager.PERMISSION_GRANTED) {
            return;
        }

        Intent callIntent = new Intent(Intent.ACTION_CALL, Uri.parse("tel:" + Uri.encode(number)));
        callIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            startActivity(callIntent);
        } catch (Exception ignored) {
            // Background activity launch restrictions may block direct calls on some devices.
        }
    }

    @Override
    public void onReadyForSpeech(Bundle params) {}

    @Override
    public void onBeginningOfSpeech() {}

    @Override
    public void onRmsChanged(float rmsdB) {}

    @Override
    public void onBufferReceived(byte[] buffer) {}

    @Override
    public void onEndOfSpeech() {
        isListening = false;
        scheduleRestart(900);
    }

    @Override
    public void onError(int error) {
        isListening = false;
        scheduleRestart(1200);
    }

    @Override
    public void onResults(Bundle results) {
        isListening = false;
        processBundle(results);
        scheduleRestart(700);
    }

    @Override
    public void onPartialResults(Bundle partialResults) {
        processBundle(partialResults);
    }

    @Override
    public void onEvent(int eventType, Bundle params) {}

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event == null || event.sensor == null || event.sensor.getType() != Sensor.TYPE_ACCELEROMETER) {
            return;
        }

        long now = System.currentTimeMillis();
        if (now - lastShakeSampleAt < 350) {
            return;
        }

        float gX = event.values[0] / SensorManager.GRAVITY_EARTH;
        float gY = event.values[1] / SensorManager.GRAVITY_EARTH;
        float gZ = event.values[2] / SensorManager.GRAVITY_EARTH;
        double gForce = Math.sqrt(gX * gX + gY * gY + gZ * gZ);

        if (gForce < 2.7) {
            return;
        }

        lastShakeSampleAt = now;
        shakeDetections.add(now);
        shakeDetections.removeIf(t -> now - t > 4500);

        if (shakeDetections.size() >= 4) {
            shakeDetections.clear();
            triggerEmergencySequence("Shake");
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}
}
