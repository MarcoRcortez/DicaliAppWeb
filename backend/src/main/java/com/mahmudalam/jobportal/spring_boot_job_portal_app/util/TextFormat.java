package com.mahmudalam.jobportal.spring_boot_job_portal_app.util;

/**
 * Normalización de mayúsculas para presentación de datos.
 * Capitaliza la primera letra de cada palabra SOLO si la palabra está toda en
 * minúsculas; preserva acrónimos y siglas ("DICALI", "S.R.L.", "iOS").
 */
public final class TextFormat {

    private TextFormat() {}

    public static String smartTitleCase(String str) {
        if (str == null || str.isBlank()) return str;
        String[] tokens = str.split("(?<=\\s)|(?=\\s)"); // conserva los espacios
        StringBuilder sb = new StringBuilder();
        for (String w : tokens) {
            if (w.isBlank()) {
                sb.append(w);
            } else if (w.equals(w.toLowerCase()) && w.matches(".*[a-záéíóúüñ].*")) {
                sb.append(Character.toUpperCase(w.charAt(0))).append(w.substring(1));
            } else {
                sb.append(w);
            }
        }
        return sb.toString();
    }
}
