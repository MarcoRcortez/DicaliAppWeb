import jsPDF from "jspdf";

/** Edad a partir de una fecha ISO (o null). */
export const calcAge = (dateStr) => {
  if (!dateStr) return null;
  const birth = new Date(dateStr);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
};

/**
 * Construye el PDF del CV a partir de un perfil de candidato (el mismo shape que
 * usan MiCurriculum y el modal de Postulantes). Devuelve el documento jsPDF.
 */
const buildCvPdf = (p) => {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageW = pdf.internal.pageSize.getWidth();
  const margin = 15;
  let y = 20;

  const addLine = (size, bold, text, color = [30, 58, 95]) => {
    if (y > 270) { pdf.addPage(); y = 20; }
    pdf.setFontSize(size);
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setTextColor(...color);
    const lines = pdf.splitTextToSize(text, pageW - margin * 2);
    pdf.text(lines, margin, y);
    y += lines.length * (size * 0.45) + 2;
  };

  const addSection = (title) => {
    y += 4;
    addLine(12, true, title);
    pdf.setDrawColor(59, 130, 246);
    pdf.line(margin, y - 1, pageW - margin, y - 1);
    y += 3;
  };

  // Cabecera
  addLine(22, true, p.fullName || "Sin nombre");
  addLine(10, false, [p.email, p.phone, p.location].filter(Boolean).join("  |  "), [100, 100, 100]);
  if (p.birthDate) {
    const age = calcAge(p.birthDate);
    addLine(10, false, `Fecha de nacimiento: ${p.birthDate} (${age} años)`, [100, 100, 100]);
  }

  if (p.workExperience?.length > 0) {
    addSection("EXPERIENCIA LABORAL");
    p.workExperience.forEach((w) => {
      addLine(11, true, `${w.title}  -  ${w.company}`);
      addLine(9, false, `${w.startDate || ""} a ${w.current ? "Actual" : w.endDate || ""}`, [120, 120, 120]);
    });
  }

  if (p.educations?.length > 0) {
    addSection("EDUCACIÓN");
    p.educations.forEach((e) => addLine(10, false, `${e.degree}  -  ${e.institution} (${e.year})`));
  }

  if (p.certifications?.length > 0) {
    addSection("CERTIFICACIONES");
    p.certifications.forEach((c) => addLine(10, false, `${c.name}  -  ${c.institution}${c.year ? ` (${c.year})` : ""}`));
  }

  if (p.technicalSkills?.length > 0) {
    addSection("HABILIDADES TÉCNICAS");
    addLine(10, false, p.technicalSkills.map((s) => `${s.name} (${s.level})`).join("  /  "));
  }

  if (p.softSkills?.length > 0) {
    addSection("HABILIDADES BLANDAS");
    addLine(10, false, p.softSkills.join("  /  "));
  }

  if (p.languages?.length > 0) {
    addSection("IDIOMAS");
    addLine(10, false, p.languages.map((l) => `${l.name} (${l.level})`).join("  /  "));
  }

  addSection("INFORMACIÓN ADICIONAL");
  if (p.expectedSalary?.max) {
    addLine(10, false, `Expectativa salarial: Bs. ${p.expectedSalary.max}${p.expectedSalary.max === 3350 ? " (Salario minimo nacional)" : ""}`);
  }
  addLine(10, false, `Disponibilidad: ${p.workSchedule || "-"}  |  Tipo: ${p.workType || "-"}`);

  return pdf;
};

/**
 * Genera el CV en PDF.
 * @param {object} profile  perfil del candidato
 * @param {{download?: boolean}} opts  download:true descarga el archivo; por
 *   defecto abre una previsualización en una pestaña nueva (para imprimir).
 */
export const exportCvToPdf = (profile, { download = false } = {}) => {
  const pdf = buildCvPdf(profile);
  if (download) {
    const name = (profile.fullName || "candidato").trim().replace(/\s+/g, "_");
    pdf.save(`CV_${name}.pdf`);
  } else {
    const url = URL.createObjectURL(pdf.output("blob"));
    window.open(url, "_blank");
  }
};
