/**
 * Datos de demostración para DICALI (para la defensa ante el tribunal).
 *
 * Crea una empresa demo con DOS vacantes ("Diseño Gráfico" y "Asistente Gerencial")
 * y CINCO candidatos que se postulan. Sirve para mostrar en vivo el flujo completo
 * (postulación → conexión) y el reporte de la empresa.
 *
 * Requisitos: el backend corriendo en http://localhost:8080 y MongoDB activo.
 * Uso:   node scripts/seed-demo.mjs
 *
 * Todas las cuentas usan el dominio @demo.dicali y la contraseña "demo123",
 * para que puedas identificarlas y borrarlas luego desde el Panel de Administración.
 */

const API = "http://localhost:8080/api";

const api = async (method, path, body, token) => {
  const r = await fetch(API + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  try { return t ? JSON.parse(t) : null; } catch { return null; }
};

const PASS = "demo123";

async function main() {
  console.log("Sembrando datos de demostración...\n");

  // ── Empresa ──
  const rec = await api("POST", "/auth/register", { email: "empresa@demo.dicali", password: PASS, role: "RECRUITER" })
    || (await api("POST", "/auth/login", { email: "empresa@demo.dicali", password: PASS }));
  if (!rec?.token) { console.error("No se pudo crear/entrar la empresa. ¿Está el backend corriendo?"); return; }
  await api("POST", "/company-profiles", {
    userId: rec.userId, companyName: "Estudio Creativo Andino", description: "Agencia de diseño y gestión.",
    phone1: "70011223", address: "La Paz", profileComplete: true,
  }, rec.token);

  // ── Dos vacantes ──
  const mkVac = (jobTitle, department, skills, langs) => api("POST", "/vacancies", {
    recruiterId: rec.userId, companyName: "Estudio Creativo Andino", jobTitle, department, status: "Abierta",
    requiredTechnicalSkills: skills, desiredSoftSkills: ["Trabajo en equipo", "Comunicación"],
    requiredLanguages: langs, minExperienceYears: 2,
    salaryRange: { min: 4000, max: 7000 }, workAvailability: "tiempo completo",
  }, rec.token);

  const vDiseno = await mkVac("Diseño Gráfico", "Creatividad",
    [{ name: "Photoshop", level: "AVANZADO" }, { name: "Illustrator", level: "AVANZADO" }],
    [{ name: "Inglés", level: "B1" }]);
  const vAsist = await mkVac("Asistente Gerencial", "Administración",
    [{ name: "Excel", level: "AVANZADO" }, { name: "Redacción", level: "INTERMEDIO" }],
    [{ name: "Inglés", level: "B2" }]);
  console.log(`Vacantes creadas: "${vDiseno.jobTitle}" y "${vAsist.jobTitle}"`);

  // ── Cinco candidatos (con distinta afinidad a cada vacante) ──
  const candidatos = [
    { name: "María Fernanda López",  skills: [{ name: "Photoshop", level: "EXPERTO" }, { name: "Illustrator", level: "AVANZADO" }], lang: "B2", postulaA: vDiseno },
    { name: "Carlos Mamani Quispe",  skills: [{ name: "Photoshop", level: "INTERMEDIO" }],                                          lang: "B1", postulaA: vDiseno },
    { name: "Lucía Rojas Vargas",    skills: [{ name: "Excel", level: "EXPERTO" }, { name: "Redacción", level: "AVANZADO" }],       lang: "B2", postulaA: vAsist },
    { name: "Diego Fernández Soto",  skills: [{ name: "Excel", level: "INTERMEDIO" }],                                              lang: "A2", postulaA: vAsist },
    { name: "Ana Gutiérrez Flores",  skills: [{ name: "Illustrator", level: "BASICO" }, { name: "Excel", level: "INTERMEDIO" }],    lang: "B1", postulaA: vDiseno },
  ];

  let i = 0;
  for (const c of candidatos) {
    i++;
    const email = `candidato${i}@demo.dicali`;
    const can = await api("POST", "/auth/register", { email, password: PASS, role: "CANDIDATE" })
      || (await api("POST", "/auth/login", { email, password: PASS }));
    if (!can?.token) { console.error(`No se pudo crear el candidato ${c.name}`); continue; }

    await api("POST", "/candidate-profiles", {
      userId: can.userId, fullName: c.name, email, phone: `7100000${i}`, location: "La Paz",
      workExperience: [{ title: "Experiencia previa", company: "Empresa anterior", startDate: "2021-01-01", endDate: "2024-01-01", current: false }],
      technicalSkills: c.skills, softSkills: ["Trabajo en equipo", "Comunicación"],
      languages: [{ name: "Inglés", level: c.lang }],
      certifications: [], expectedSalary: { min: 3500, max: 6000 },
      workType: "presencial La Paz", profileComplete: true,
    }, can.token);

    // El candidato se postula a su vacante objetivo
    const perfil = await api("GET", `/candidate-profiles/user/${can.userId}`, null, can.token);
    await api("PUT", "/matches/apply", { candidateId: perfil.id, vacancyId: c.postulaA.id, applied: true }, can.token);
    console.log(`  • ${c.name} → se postuló a "${c.postulaA.jobTitle}"`);
  }

  console.log("\n✅ Listo. Ingresa como EMPRESA para ver Postulantes y Reportes:");
  console.log("   empresa@demo.dicali / demo123");
  console.log("   (Los candidatos son candidato1..5@demo.dicali / demo123)");
  console.log("\nPara borrar todo luego: Panel de Administración → filtra por \"demo.dicali\".");
}

main();
