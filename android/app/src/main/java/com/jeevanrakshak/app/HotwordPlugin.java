package com.jeevanrakshak.app;

import android.Manifest;
import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;

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

        if (!permissionsGranted()) {
            requestAllPermissions(call, "permissionsCallback");
            return;
        }

        startHotwordService(emergencyNumber, contactsCsv, shakeEnabled);
        call.resolve();
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

    @PermissionCallback
    private void permissionsCallback(PluginCall call) {
        if (!permissionsGranted()) {
            call.reject("Required permissions were not granted.");
            return;
        }

        String emergencyNumber = call.getString("emergencyNumber", EmergencyConfigStore.DEFAULT_NUMBER);
        JSArray contacts = call.getArray("contactNumbers", new JSArray());
        boolean shakeEnabled = call.getBoolean("shakeEnabled", EmergencyConfigStore.DEFAULT_SHAKE_ENABLED);
        String contactsCsv = contactsToCsv(contacts);
        startHotwordService(emergencyNumber, contactsCsv, shakeEnabled);
        call.resolve();
    }

    private boolean permissionsGranted() {
        return getPermissionState("audio") == PermissionState.GRANTED
            && getPermissionState("call") == PermissionState.GRANTED
            && getPermissionState("sms") == PermissionState.GRANTED;
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
