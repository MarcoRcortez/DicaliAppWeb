package com.mahmudalam.jobportal.spring_boot_job_portal_app.util;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.Comparator;

/**
 * Utilidades de texto: presentación (mayúsculas) y una normalización morfológica
 * ligera del español usada por el filtro de afinidad vocacional.
 */
public final class TextFormat {

    private TextFormat() {}

    // ---- Presentación ----

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

    // ---- Normalización morfológica (afinidad vocacional) ----

    /** Sufijos frecuentes del español, ordenados por longitud descendente (se recorta el más largo). */
    private static final String[] SUFFIXES = ordenarPorLongitud(new String[]{
            "abilidad", "ibilidad", "aciones", "iciones", "amiento", "imiento", "bilidad",
            "acion", "icion", "arias", "erias", "aria", "eria", "dores", "doras", "tivos", "tivas",
            "cion", "sion", "dora", "dor", "tivo", "tiva", "istas", "ista", "eros", "eras", "ero", "era",
            "ados", "adas", "ado", "ada", "ivo", "iva", "idad", "oso", "osa", "ico", "ica", "ias", "ia",
            "es", "s"
    });

    private static String[] ordenarPorLongitud(String[] arr) {
        Arrays.sort(arr, Comparator.comparingInt(String::length).reversed());
        return arr;
    }

    private static String stripAccents(String s) {
        return Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
    }

    /**
     * Raíz morfológica ligera para emparejar variantes de una misma familia léxica del
     * español (p. ej. "diseño"/"diseñador", "contador"/"contabilidad", "enfermería"/
     * "enfermero", "administración"/"administrativo"). Quita acentos, recorta iterativamente
     * sufijos derivativos/flexivos y luego una vocal final.
     *
     * <p><b>No es un stemmer lingüístico completo</b> (no es Snowball); es una heurística
     * acotada. <b>Limitación conocida:</b> no unifica todas las familias (p. ej.
     * "médico"/"medicina") y, al recortar a raíces cortas, dos rubros no relacionados podrían
     * colisionar si comparten raíz. Para mitigarlo:
     * <ul>
     *   <li>cada recorte respeta un <b>piso de 4 caracteres</b> de raíz;</li>
     *   <li>el emparejamiento exige <b>igualdad de raíz</b> (no prefijo), de modo que
     *       "contador"→"cont" y "contaminación"→"contamin" NO se unen (a diferencia del
     *       enfoque por prefijo, que sí los uniría por compartir "conta").</li>
     * </ul>
     */
    public static String morphStem(String token) {
        if (token == null || token.isBlank()) return "";
        String w = stripAccents(token.toLowerCase());
        boolean cambio = true;
        while (cambio) {
            cambio = false;
            for (String suf : SUFFIXES) {
                if (w.endsWith(suf) && w.length() - suf.length() >= 4) {
                    w = w.substring(0, w.length() - suf.length());
                    cambio = true;
                    break;
                }
            }
        }
        // Vocal final (género/nominalización): "diseno"→"disen", "conta"→"cont".
        if (w.length() >= 5 && "aeiou".indexOf(w.charAt(w.length() - 1)) >= 0) {
            w = w.substring(0, w.length() - 1);
        }
        return w;
    }
}
