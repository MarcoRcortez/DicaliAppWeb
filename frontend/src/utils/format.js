// Utilidades de formato de texto para presentación (no alteran los datos guardados).

/**
 * Convierte un texto a "Tipo Título": primera letra de cada palabra en mayúscula.
 * Uso: títulos de puesto, áreas y nombres al mostrarlos en pantalla.
 * No se aplica a habilidades técnicas (nombres como "iOS"/"HTML" podrían romperse).
 */
export const titleCase = (str) => {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
};
