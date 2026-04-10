package com.jeevanrakshak.app;

import android.Manifest;
import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "HotwordService",
    permissions = {
        @Permission(alias = "audio", strings = { Manifest.permission.RECORD_AUDIO }),
        @Permission(alias = "camera", strings = { Manifest.permission.CAMERA }),
        @Permission(alias = "call", strings = { Manifest.permission.CALL_PHONE }),
        @Permission(alias = "sms", strings = { Manifest.permission.SEND_SMS }),
        @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS })
    }
)
public class HotwordPlugin extends Plugin {

    @PluginMethod
    public void start(PluginCall call) {
        String emergencyNumber = call.getString("emergencyNumber", EmergencyConfigStore.DEFAULT_NUMBER);
        JSArray contacts = call.getArray("contactNumbers", new JSArray());
        boolean shakeEnabled = call.getBoolean("shakeEnabled", EmergencyConfigStore.DEFAULT_SHAKE_ENABLED);
        String contactsCsv = contactsToCsv(contacts);

        EmergencyConfigStore.saveConfig(getContext(), emergencyNumber, contactsCsv, shakeEnabled);
        ensurePermissionsThenStart(call);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Intent intent = new Intent(getContext(), EmergencyHotwordService.class);
        getContext().stopService(intent);
        call.resolve();
    }

    @PluginMethod
    public void syncConfig(PluginCall call) {
        String emergencyNumber = call.getString("emergencyNumber", EmergencyConfigStore.DEFAULT_NUMBER);
        JSArray contacts = call.getArray("contactNumbers", new JSArray());
        boolean shakeEnabled = call.getBoolean("shakeEnabled", EmergencyConfigStore.DEFAULT_SHAKE_ENABLED);
        String contactsCsv = contactsToCsv(contacts);

        EmergencyConfigStore.saveConfig(getContext(), emergencyNumber, contactsCsv, shakeEnabled);
        call.resolve();
    }

    @PluginMethod
    public void status(PluginCall call) {
        JSObject result = new JSObject();
        result.put("running", isServiceRunning());
        call.resolve(result);
    }

    @PluginMethod
    public void permissionsStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("audio", getPermissionState("audio") == PermissionState.GRANTED);
        result.put("camera", getPermissionState("camera") == PermissionState.GRANTED);
        result.put("call", getPermissionState("call") == PermissionState.GRANTED);
        result.put("sms", getPermissionState("sms") == PermissionState.GRANTED);
        result.put("notifications", getPermissionState("notifications") == PermissionState.GRANTED);
        call.resolve(result);
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.fromParts("package", getContext().getPackageName(), null));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Unable to open app settings.", e);
        }
    }

    private void ensurePermissionsThenStart(PluginCall call) {
        if (getPermissionState("audio") != PermissionState.GRANTED) {
            requestPermissionForAlias("audio", call, "audioPermissionCallback");
            return;
        }

        if (getPermissionState("camera") != PermissionState.GRANTED) {
            requestPermissionForAlias("camera", call, "cameraPermissionCallback");
            return;
        }

        if (getPermissionState("call") != PermissionState.GRANTED) {
            requestPermissionForAlias("call", call, "callPermissionCallback");
            return;
        }

        if (getPermissionState("sms") != PermissionState.GRANTED) {
            requestPermissionForAlias("sms", call, "smsPermissionCallback");
            return;
        }

        if (getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "notificationsPermissionCallback");
            return;
        }

        String emergencyNumber = call.getString("emergencyNumber", EmergencyConfigStore.DEFAULT_NUMBER);
        JSArray contacts = call.getArray("contactNumbers", new JSArray());
        boolean shakeEnabled = call.getBoolean("shakeEnabled", EmergencyConfigStore.DEFAULT_SHAKE_ENABLED);
        String contactsCsv = contactsToCsv(contacts);
        startHotwordService(emergencyNumber, contactsCsv, shakeEnabled);
        call.resolve();
    }

    @PermissionCallback
    private void audioPermissionCallback(PluginCall call) {
        if (getPermissionState("audio") != PermissionState.GRANTED) {
            call.reject("Microphone permission is required for always-on SOS detection.");
            return;
        }

        ensurePermissionsThenStart(call);
    }

    @PermissionCallback
    private void cameraPermissionCallback(PluginCall call) {
        if (getPermissionState("camera") != PermissionState.GRANTED) {
            call.reject("Camera permission is required for patient scanning.");
            return;
        }

        ensurePermissionsThenStart(call);
    }

    @PermissionCallback
    private void callPermissionCallback(PluginCall call) {
        if (getPermissionState("call") != PermissionState.GRANTED) {
            call.reject("Call permission is required for automatic SOS calling.");
            return;
        }

        ensurePermissionsThenStart(call);
    }

    @PermissionCallback
    private void smsPermissionCallback(PluginCall call) {
        if (getPermissionState("sms") != PermissionState.GRANTED) {
            call.reject("SMS permission is required for emergency alerts.");
            return;
        }

        ensurePermissionsThenStart(call);
    }

    @PermissionCallback
    private void notificationsPermissionCallback(PluginCall call) {
        if (getPermissionState("notifications") != PermissionState.GRANTED) {
            call.reject("Notification permission is required to keep SOS service visible in background.");
            return;
        }

        ensurePermissionsThenStart(call);
    }

    private void startHotwordService(String emergencyNumber, String contactsCsv, boolean shakeEnabled) {
        Intent intent = new Intent(getContext(), EmergencyHotwordService.class);
        intent.putExtra(EmergencyHotwordService.EXTRA_EMERGENCY_NUMBER, emergencyNumber);
        intent.putExtra(EmergencyHotwordService.EXTRA_CONTACT_NUMBERS_CSV, contactsCsv);
        intent.putExtra(EmergencyHotwordService.EXTRA_SHAKE_ENABLED, shakeEnabled);
        ContextCompat.startForegroundService(getContext(), intent);
    }

    private String contactsToCsv(JSArray contacts) {
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < contacts.length(); i++) {
            String value = contacts.optString(i, "");
            if (value == null || value.isEmpty()) continue;
            if (builder.length() > 0) builder.append(',');
            builder.append(value.replaceAll("[^0-9+]", ""));
        }
        return builder.toString();
    }

    private boolean isServiceRunning() {
        ActivityManager manager = (ActivityManager) getContext().getSystemService(Context.ACTIVITY_SERVICE);
        if (manager == null) return false;

        for (ActivityManager.RunningServiceInfo service : manager.getRunningServices(Integer.MAX_VALUE)) {
            if (EmergencyHotwordService.class.getName().equals(service.service.getClassName())) {
                return true;
            }
        }
        return false;
    }
}
