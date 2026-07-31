// Utilidades de formato de texto para presentación (no alteran los datos guardados).

/**
 * Capitaliza la primera letra de cada palabra SOLO si la palabra está toda en
 * minúsculas. Las palabras que ya tienen alguna mayúscula, dígito o punto se
 * dejan intactas, para no romper acrónimos ni siglas ("DICALI", "S.R.L.", "iOS").
 * No corrige acentos (eso excede la capitalización).
 *
 * Ej: "diseñador gráfico"  -> "Diseñador Gráfico"
 *     "DICALI S.R.L."      -> "DICALI S.R.L." (intacto)
 *     "desarrollador iOS"  -> "Desarrollador iOS"
 */
export const titleCase = (str) => {
  if (!str) return "";
  return String(str)
    .split(/(\s+)/) // conserva los espacios
    .map((w) => {
      if (!w.trim()) return w;
      const esTodoMinuscula = w === w.toLowerCase() && /[a-záéíóúüñ]/.test(w);
      return esTodoMinuscula ? w.charAt(0).toUpperCase() + w.slice(1) : w;
    })
    .join("");
};
