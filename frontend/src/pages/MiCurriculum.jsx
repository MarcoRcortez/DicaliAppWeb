import { useState, useEffect, useRef } from "react";
import useAuthStore from "../store/authStore";
import { getCandidateProfile, saveCandidateProfile, deleteCandidateProfile } from "../api/api";
import ImageCropper from "../components/ImageCropper";
import { calcAge, exportCvToPdf } from "../utils/cvPdf";

const SOFT_SKILLS_OPTIONS = [
  "Trabajo en equipo", "Liderazgo", "Comunicación", "Resolución de problemas",
  "Adaptabilidad", "Creatividad", "Puntualidad", "Organización",
  "Pensamiento crítico", "Empatía", "Proactividad", "Negociación",
];

const SKILL_LEVELS = ["BASICO", "INTERMEDIO", "AVANZADO", "EXPERTO"];
const LANGUAGE_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "Nativo"];

const today = new Date().toISOString().split("T")[0];


const emptyForm = {
  fullName: "", email: "", phone: "", location: "La Paz", birthDate: "",
  photoBase64: "", workExperience: [], educations: [], technicalSkills: [],
  softSkills: [], languages: [], certifications: [], expectedSalary: { min: 0, max: 0 },
  availability: "tiempo completo", workSchedule: "tiempo completo",
  workType: "presencial La Paz", profileComplete: false,
};

const MiCurriculum = () => {
  const { userId, email: userEmail } = useAuthStore();
  const cvRef = useRef();

  const [form, setForm] = useState({ ...emptyForm, email: userEmail || "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [cropSrc, setCropSrc] = useState(null); // imagen en edición (modal de recorte)

  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState("INTERMEDIO");
  const [newLangName, setNewLangName] = useState("");
  const [newLangLevel, setNewLangLevel] = useState("B1");

  const [newExp, setNewExp] = useState({ title: "", company: "", startDate: "", endDate: "", current: false, achievements: [""] });
  const [newEdu, setNewEdu] = useState({ degree: "", institution: "", year: "" });
  const [newCert, setNewCert] = useState({ name: "", institution: "", year: "" });

  useEffect(() => { loadProfile(); }, [userId]);

  const loadProfile = async () => {
    try {
      const res = await getCandidateProfile(userId);
      setForm({ ...emptyForm, ...res.data });
    } catch { /* primer ingreso */ }
    setLoading(false);
  };

  const handleChange = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: null }));
  };

  // Al elegir un archivo, abre el editor de recorte (no se estira la imagen)
  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCropSrc(URL.createObjectURL(file));
    e.target.value = ""; // permite volver a elegir el mismo archivo
  };

  // ── SKILLS ──
  const addSkill = () => {
    if (!newSkillName.trim()) return;
    if (form.technicalSkills.some((s) => s.name.toLowerCase() === newSkillName.trim().toLowerCase())) {
      alert("Esta habilidad ya fue agregada.");
      return;
    }
    setForm((p) => ({ ...p, technicalSkills: [...p.technicalSkills, { name: newSkillName.trim(), level: newSkillLevel }] }));
    setNewSkillName("");
  };
  const removeSkill = (i) => setForm((p) => ({ ...p, technicalSkills: p.technicalSkills.filter((_, idx) => idx !== i) }));

  const toggleSoftSkill = (s) =>
    setForm((p) => ({
      ...p,
      softSkills: p.softSkills.includes(s) ? p.softSkills.filter((x) => x !== s) : [...p.softSkills, s],
    }));

  // ── LANGUAGES ──
  const addLanguage = () => {
    if (!newLangName.trim()) return;
    if (form.languages.some((l) => l.name.toLowerCase() === newLangName.trim().toLowerCase())) {
      alert("Este idioma ya fue agregado.");
      return;
    }
    setForm((p) => ({ ...p, languages: [...p.languages, { name: newLangName.trim(), level: newLangLevel }] }));
    setNewLangName("");
  };
  const removeLanguage = (i) => setForm((p) => ({ ...p, languages: p.languages.filter((_, idx) => idx !== i) }));

  // ── EXPERIENCE (con validación de fechas) ──
  const addExperience = () => {
    if (!newExp.title.trim() || !newExp.company.trim()) {
      alert("Completa el cargo y la empresa.");
      return;
    }
    if (!newExp.startDate) {
      alert("Selecciona la fecha de inicio.");
      return;
    }
    if (newExp.startDate > today) {
      alert("La fecha de inicio no puede ser en el futuro.");
      return;
    }
    if (!newExp.current) {
      if (!newExp.endDate) {
        alert("Selecciona la fecha de fin o marca 'Trabajo actual'.");
        return;
      }
      if (newExp.endDate > today) {
        alert("La fecha de fin no puede ser en el futuro.");
        return;
      }
      if (newExp.endDate <= newExp.startDate) {
        alert("La fecha de fin debe ser posterior a la fecha de inicio.");
        return;
      }
    }
    setForm((p) => ({ ...p, workExperience: [...p.workExperience, { ...newExp, achievements: newExp.achievements.filter(Boolean) }] }));
    setNewExp({ title: "", company: "", startDate: "", endDate: "", current: false, achievements: [""] });
  };
  const removeExperience = (i) => setForm((p) => ({ ...p, workExperience: p.workExperience.filter((_, idx) => idx !== i) }));

  // ── EDUCATION ──
  const addEducation = () => {
    if (!newEdu.degree.trim() || !newEdu.institution.trim()) {
      alert("Completa el título y la institución.");
      return;
    }
    const yearNum = parseInt(newEdu.year);
    const currentYear = new Date().getFullYear();
    if (!newEdu.year || isNaN(yearNum) || yearNum < 1970 || yearNum > currentYear) {
      alert(`El año debe ser entre 1970 y ${currentYear}.`);
      return;
    }
    setForm((p) => ({ ...p, educations: [...p.educations, newEdu] }));
    setNewEdu({ degree: "", institution: "", year: "" });
  };
  const removeEducation = (i) => setForm((p) => ({ ...p, educations: p.educations.filter((_, idx) => idx !== i) }));

  // ── CERTIFICACIONES ──
  const addCertification = () => {
    if (!newCert.name.trim() || !newCert.institution.trim()) {
      alert("Completa el nombre y la institución de la certificación.");
      return;
    }
    setForm((p) => ({ ...p, certifications: [...p.certifications, newCert] }));
    setNewCert({ name: "", institution: "", year: "" });
  };
  const removeCertification = (i) => setForm((p) => ({ ...p, certifications: p.certifications.filter((_, idx) => idx !== i) }));

  // ── VALIDAR ANTES DE GUARDAR ──
  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = "El nombre es obligatorio.";
    if (!form.email.trim()) errs.email = "El correo es obligatorio.";
    if (!form.phone.trim()) errs.phone = "El teléfono es obligatorio.";

    // Validar fecha de nacimiento
    if (!form.birthDate) {
      errs.birthDate = "La fecha de nacimiento es obligatoria.";
    } else {
      const age = calcAge(form.birthDate);
      if (age < 18) errs.birthDate = "Debes ser mayor de 18 años.";
      else if (age > 54) errs.birthDate = "La edad máxima permitida es 54 años.";
    }

    if (form.expectedSalary.max <= 0) {
      errs.salary = "Ingresa tu expectativa salarial.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── GUARDAR ──
  const handleSave = async (postular = false) => {
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSaving(true);
    try {
      await saveCandidateProfile({ ...form, userId, profileComplete: postular });
      alert(postular ? "CV guardado y postulado correctamente." : "Datos guardados correctamente.");
    } catch (err) {
      alert(err.response?.data?.error || "Error al guardar.");
    }
    setSaving(false);
  };

  const handleClear = () => { setForm({ ...emptyForm, email: userEmail || "" }); setErrors({}); };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de borrar todos tus datos guardados?")) return;
    try {
      await deleteCandidateProfile(userId);
      setForm({ ...emptyForm, email: userEmail || "" });
      setErrors({});
      alert("Datos eliminados.");
    } catch { alert("Error al eliminar."); }
  };

  const handleExportPdf = () => exportCvToPdf(form);

  // Calcular límites de fecha de nacimiento (18 a 54 años)
  const maxBirthDate = new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0];
  const minBirthDate = new Date(new Date().setFullYear(new Date().getFullYear() - 54)).toISOString().split("T")[0];
  const birthAge = calcAge(form.birthDate);

  const FieldError = ({ msg }) => msg ? <p className="text-red-500 text-xs mt-1">{msg}</p> : null;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          shape="circle"
          onCancel={() => setCropSrc(null)}
          onConfirm={(base64) => { handleChange("photoBase64", base64); setCropSrc(null); }}
        />
      )}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-blue-950">Mi Curriculum</h1>
        </div>

        <div ref={cvRef} className="bg-white rounded-3xl shadow-xl p-8 space-y-8">
          {/* FOTO Y DATOS PERSONALES */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-gray-100 overflow-hidden mb-3 border-4 border-blue-100">
                {form.photoBase64 ? (
                  <img src={form.photoBase64} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">👤</div>
                )}
              </div>
              <label className="text-xs text-blue-600 hover:underline cursor-pointer">
                Subir foto
                <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
              </label>
            </div>
            <div className="md:col-span-2 space-y-3">
              <div>
                <input value={form.fullName} onChange={(e) => handleChange("fullName", e.target.value)} placeholder="Nombre completo" className={`w-full border rounded-xl px-4 py-3 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.fullName ? "border-red-400" : "border-gray-200"}`} />
                <FieldError msg={errors.fullName} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input value={form.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="Correo" type="email" className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? "border-red-400" : "border-gray-200"}`} />
                  <FieldError msg={errors.email} />
                </div>
                <div>
                  <input value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="Teléfono" className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? "border-red-400" : "border-gray-200"}`} />
                  <FieldError msg={errors.phone} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.location || "La Paz"} onChange={(e) => handleChange("location", e.target.value)} className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="La Paz">La Paz</option>
                  <option value="El Alto">El Alto</option>
                </select>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Fecha de nacimiento {birthAge !== null && <span className="text-blue-600">({birthAge} años)</span>}</label>
                  <input type="date" value={form.birthDate} onChange={(e) => handleChange("birthDate", e.target.value)} min={minBirthDate} max={maxBirthDate} className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.birthDate ? "border-red-400" : "border-gray-200"}`} />
                  <FieldError msg={errors.birthDate} />
                </div>
              </div>
            </div>
          </section>

          {/* EXPERIENCIA LABORAL */}
          <section>
            <h2 className="text-lg font-black text-blue-900 mb-3">Experiencia Laboral</h2>
            {form.workExperience.length > 0 && (
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm border border-gray-200 rounded-xl">
                  <thead className="bg-gray-50">
                    <tr><th className="p-2 text-left">Cargo</th><th className="p-2 text-left">Empresa</th><th className="p-2 text-left">Desde</th><th className="p-2 text-left">Hasta</th><th className="p-2"></th></tr>
                  </thead>
                  <tbody>
                    {form.workExperience.map((w, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="p-2 font-medium">{w.title}</td>
                        <td className="p-2">{w.company}</td>
                        <td className="p-2">{w.startDate}</td>
                        <td className="p-2">{w.current ? "Actual" : w.endDate}</td>
                        <td className="p-2"><button onClick={() => removeExperience(i)} className="text-red-400 hover:text-red-600 text-xs">Eliminar</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
              <input value={newExp.title} onChange={(e) => setNewExp((p) => ({ ...p, title: e.target.value }))} placeholder="Cargo" className="min-w-0 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={newExp.company} onChange={(e) => setNewExp((p) => ({ ...p, company: e.target.value }))} placeholder="Empresa" className="min-w-0 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div>
                <label className="block text-xs text-gray-400 mb-1">Fecha inicio</label>
                <input value={newExp.startDate} onChange={(e) => setNewExp((p) => ({ ...p, startDate: e.target.value }))} type="date" max={today} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Fecha fin</label>
                <input value={newExp.endDate} onChange={(e) => setNewExp((p) => ({ ...p, endDate: e.target.value }))} type="date" min={newExp.startDate || undefined} max={today} disabled={newExp.current} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm text-gray-600 flex items-center gap-1">
                <input type="checkbox" checked={newExp.current} onChange={(e) => setNewExp((p) => ({ ...p, current: e.target.checked, endDate: "" }))} /> Trabajo actual
              </label>
              <button onClick={addExperience} className="text-sm bg-blue-50 text-blue-600 px-4 py-1 rounded-lg font-bold hover:bg-blue-100">+ Agregar</button>
            </div>
          </section>

          {/* EDUCACIÓN */}
          <section>
            <h2 className="text-lg font-black text-blue-900 mb-3">Educación</h2>
            {form.educations.map((e, i) => (
              <div key={i} className="flex items-center gap-3 mb-2 bg-gray-50 p-3 rounded-xl">
                <span className="flex-1 text-sm"><strong>{e.degree}</strong> — {e.institution} ({e.year})</span>
                <button onClick={() => removeEducation(i)} className="text-red-400 hover:text-red-600 text-xs">Eliminar</button>
              </div>
            ))}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input value={newEdu.degree} onChange={(e) => setNewEdu((p) => ({ ...p, degree: e.target.value }))} placeholder="Título" className="min-w-0 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={newEdu.institution} onChange={(e) => setNewEdu((p) => ({ ...p, institution: e.target.value }))} placeholder="Institución" className="min-w-0 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex gap-2">
                <input value={newEdu.year} onChange={(e) => setNewEdu((p) => ({ ...p, year: e.target.value }))} type="number" min="1970" max={new Date().getFullYear()} placeholder="Año" className="min-w-0 border border-gray-200 rounded-xl px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={addEducation} className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-bold hover:bg-blue-100 whitespace-nowrap">+ Agregar</button>
              </div>
            </div>
          </section>

          {/* CERTIFICACIONES */}
          <section>
            <h2 className="text-lg font-black text-blue-900 mb-3">Certificaciones</h2>
            {form.certifications.map((c, i) => (
              <div key={i} className="flex items-center gap-3 mb-2 bg-gray-50 p-3 rounded-xl">
                <span className="flex-1 text-sm"><strong>{c.name}</strong> — {c.institution}{c.year ? ` (${c.year})` : ""}</span>
                <button onClick={() => removeCertification(i)} className="text-red-400 hover:text-red-600 text-xs">Eliminar</button>
              </div>
            ))}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input value={newCert.name} onChange={(e) => setNewCert((p) => ({ ...p, name: e.target.value }))} placeholder="Certificación" className="min-w-0 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={newCert.institution} onChange={(e) => setNewCert((p) => ({ ...p, institution: e.target.value }))} placeholder="Institución" className="min-w-0 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex gap-2">
                <input value={newCert.year} onChange={(e) => setNewCert((p) => ({ ...p, year: e.target.value }))} type="number" min="1970" max={new Date().getFullYear()} placeholder="Año (opcional)" className="min-w-0 border border-gray-200 rounded-xl px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={addCertification} className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-bold hover:bg-blue-100 whitespace-nowrap">+ Agregar</button>
              </div>
            </div>
          </section>

          {/* HABILIDADES TÉCNICAS */}
          <section>
            <h2 className="text-lg font-black text-blue-900 mb-3">Habilidades Técnicas</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {form.technicalSkills.map((s, i) => (
                <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  {s.name} <span className="text-xs opacity-60">({s.level})</span>
                  <button onClick={() => removeSkill(i)} className="ml-1 text-red-400 hover:text-red-600">&times;</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} placeholder="Ej: React, Excel, Python" className="min-w-0 border border-gray-200 rounded-xl px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <select value={newSkillLevel} onChange={(e) => setNewSkillLevel(e.target.value)} className="flex-shrink-0 border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {SKILL_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <button onClick={addSkill} className="flex-shrink-0 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-100">+</button>
            </div>
          </section>

          {/* HABILIDADES BLANDAS */}
          <section>
            <h2 className="text-lg font-black text-blue-900 mb-3">Habilidades Blandas</h2>
            <div className="flex flex-wrap gap-2">
              {SOFT_SKILLS_OPTIONS.map((s) => (
                <button key={s} onClick={() => toggleSoftSkill(s)} className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${form.softSkills.includes(s) ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {s}
                </button>
              ))}
            </div>
          </section>

          {/* IDIOMAS */}
          <section>
            <h2 className="text-lg font-black text-blue-900 mb-3">Idiomas</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {form.languages.map((l, i) => (
                <span key={i} className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  {l.name} ({l.level}) <button onClick={() => removeLanguage(i)} className="text-red-400">&times;</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newLangName} onChange={(e) => setNewLangName(e.target.value)} placeholder="Ej: Inglés" className="min-w-0 border border-gray-200 rounded-xl px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <select value={newLangLevel} onChange={(e) => setNewLangLevel(e.target.value)} className="flex-shrink-0 border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {LANGUAGE_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <button onClick={addLanguage} className="flex-shrink-0 bg-purple-50 text-purple-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-purple-100">+</button>
            </div>
          </section>

          {/* SALARIO Y DISPONIBILIDAD */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Expectativa salarial (Bs.)</label>
              <div className="flex gap-2 items-center">
                <input type="number" min="0" value={form.expectedSalary.max} onChange={(e) => handleChange("expectedSalary", { min: 0, max: Math.max(0, +e.target.value) })} placeholder="Monto" className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={() => handleChange("expectedSalary", { min: 0, max: 3350 })} className={`whitespace-nowrap text-xs px-3 py-2 rounded-xl font-bold transition-all ${form.expectedSalary.max === 3350 ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  Salario minimo nacional
                </button>
              </div>
              <FieldError msg={errors.salary} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Disponibilidad</label>
              <select value={form.workSchedule || "tiempo completo"} onChange={(e) => handleChange("workSchedule", e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="tiempo completo">Tiempo completo</option>
                <option value="tiempo parcial">Tiempo parcial</option>
                <option value="medio tiempo">Medio tiempo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de trabajo</label>
              <select value={form.workType || "presencial La Paz"} onChange={(e) => handleChange("workType", e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="presencial La Paz">Presencial La Paz</option>
                <option value="remoto">Remoto</option>
              </select>
            </div>
          </section>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-3">
          <button onClick={() => handleSave(true)} disabled={saving} className="bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 text-sm">
            {saving ? "..." : "GUARDAR Y POSTULAR"}
          </button>
          <button onClick={handleExportPdf} className="bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all text-sm">
            EXPORTAR PDF
          </button>
          <button onClick={loadProfile} className="bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-all text-sm">
            CARGAR CAMPO
          </button>
          <button onClick={handleClear} className="bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition-all text-sm">
            LIMPIAR CAMPOS
          </button>
          <button onClick={handleDelete} className="bg-red-100 text-red-600 py-3 rounded-xl font-bold hover:bg-red-200 transition-all text-sm">
            BORRAR
          </button>
        </div>
      </div>
    </div>
  );
};

export default MiCurriculum;
