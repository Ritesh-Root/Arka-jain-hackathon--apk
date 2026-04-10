package com.jeevanrakshak.app;

import android.content.Context;
import android.content.SharedPreferences;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public final class EmergencyConfigStore {
    private EmergencyConfigStore() {}

    private static final String PREFS = "jr_hotword_config";
    private static final String KEY_EMERGENCY_NUMBER = "emergency_number";
    private static final String KEY_CONTACTS_CSV = "contact_numbers_csv";
    public static final String DEFAULT_NUMBER = "8210950528";
    public static final String SECONDARY_DEFAULT_NUMBER = "9304673802";

    public static void saveConfig(Context context, String emergencyNumber, String contactsCsv) {
        SharedPreferences preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        preferences.edit()
            .putString(KEY_EMERGENCY_NUMBER, sanitizePhone(emergencyNumber))
            .putString(KEY_CONTACTS_CSV, contactsCsv == null ? "" : contactsCsv)
            .apply();
    }

    public static String getPrimaryNumber(Context context) {
        SharedPreferences preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String value = preferences.getString(KEY_EMERGENCY_NUMBER, DEFAULT_NUMBER);
        if (value == null || value.isEmpty()) {
            return DEFAULT_NUMBER;
        }
        return sanitizePhone(value);
    }

    public static String getContactsCsv(Context context) {
        SharedPreferences preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        return preferences.getString(KEY_CONTACTS_CSV, "");
    }

    public static List<String> getAllNumbers(Context context) {
        String primary = getPrimaryNumber(context);
        String contactsCsv = getContactsCsv(context);

        Set<String> dedup = new LinkedHashSet<>();
        dedup.add(DEFAULT_NUMBER);
        dedup.add(SECONDARY_DEFAULT_NUMBER);
        if (!primary.isEmpty()) {
            dedup.add(primary);
        }

        if (contactsCsv != null && !contactsCsv.isEmpty()) {
            String[] parts = contactsCsv.split(",");
            for (String part : parts) {
                String cleaned = sanitizePhone(part);
                if (!cleaned.isEmpty()) {
                    dedup.add(cleaned);
                }
            }
        }

        return new ArrayList<>(dedup);
    }

    private static String sanitizePhone(String raw) {
        if (raw == null) return "";
        return raw.replaceAll("[^0-9+]", "");
    }
}
