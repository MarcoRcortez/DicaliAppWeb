import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "../store/authStore";
import { getCompanyProfile, createVacancy, checkCompanyRegistered, getMyVacancies, deleteVacancy, updateVacancy } from "../api/api";

const SKILL_LEVELS = ["BASICO", "INTERMEDIO", "AVANZADO", "EXPERTO"];
const LANGUAGE_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "Nativo"];

const emptyForm = {
  jobTitle: "", department: "", description: "",
  requiredTechnicalSkills: [], desiredSoftSkills: [],
  requiredLanguages: [], desiredCertifications: [],
  experienceLevel: "con experiencia",
  minExperienceYears: 0,
  salaryRange: { min: 0, max: 0 },
  workAvailability: "tiempo completo",
  closingDate: "", status: "Abierta",
};

const Reclutar = () => {
  const { userId } = useAuthStore();
  const navigate = useNavigate();

  const [companyRegistered, setCompanyRegistered] = useState(false);
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [myVacancies, setMyVacancies] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({ ...emptyForm });

  const [newSkill, setNewSkill] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState("INTERMEDIO");
  const [newSoftSkill, setNewSoftSkill] = useState("");
  const [newLang, setNewLang] = useState("");
  const [newLangLevel, setNewLangLevel] = useState("B1");
  const [newCert, setNewCert] = useState("");

  useEffect(() => { checkCompany(); }, [userId]);

  const checkCompany = async () => {
    try {
      const res = await checkCompanyRegistered(userId);
      if (res.data.registered) {
        setCompanyRegistered(true);
        const cpRes = await getCompanyProfile(userId);
        setCompanyData(cpRes.data);
        await loadVacancies();
      }
    } catch { /* sin datos */ }
    setLoading(false);
  };

  const loadVacancies = async () => {
    try {
      const res = await getMyVacancies(userId);
      setMyVacancies(res.data);
    } catch { /* sin vacantes */ }
  };

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const addSkill = () => {
    if (!newSkill.trim()) return;
    setForm((p) => ({ ...p, requiredTechnicalSkills: [...p.requiredTechnicalSkills, { name: newSkill.trim(), level: newSkillLevel }] }));
    setNewSkill("");
  };
  const removeSkill = (i) => setForm((p) => ({ ...p, requiredTechnicalSkills: p.requiredTechnicalSkills.filter((_, idx) => idx !== i) }));

  const addSoftSkill = () => {
    if (!newSoftSkill.trim()) return;
    setForm((p) => ({ ...p, desiredSoftSkills: [...p.desiredSoftSkills, newSoftSkill.trim()] }));
    setNewSoftSkill("");
  };
  const removeSoftSkill = (i) => setForm((p) => ({ ...p, desiredSoftSkills: p.desiredSoftSkills.filter((_, idx) => idx !== i) }));

  const addLanguage = () => {
    if (!newLang.trim()) return;
    setForm((p) => ({ ...p, requiredLanguages: [...p.requiredLanguages, { name: newLang.trim(), level: newLangLevel }] }));
    setNewLang("");
  };
  const removeLanguage = (i) => setForm((p) => ({ ...p, requiredLanguages: p.requiredLanguages.filter((_, idx) => idx !== i) }));

  const addCertification = () => {
    if (!newCert.trim()) return;
    setForm((p) => ({ ...p, desiredCertifications: [...p.desiredCertifications, newCert.trim()] }));
    setNewCert("");
  };
  const removeCertification = (i) => setForm((p) => ({ ...p, desiredCertifications: p.desiredCertifications.filter((_, idx) => idx !== i) }));

  const handleSubmit = async () => {
    if (!form.jobTitle || !form.department) {
      alert("Completa al menos el título del cargo y área.");
      return;
    }
    if (form.closingDate) {
      const closing = new Date(form.closingDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (closing <= today) {
        alert("FORMULARIO VENCIDO Y ELIMINADO - La fecha de cierre no puede ser hoy o anterior.");
        return;
      }
    }

    setSaving(true);
    try {
      if (editingId) {
        await updateVacancy(editingId, {
          ...form, id: editingId,
          recruiterId: userId,
          companyProfileId: companyData.id,
          companyName: companyData.companyName,
          companyDescription: companyData.description,
          companyPhone1: companyData.phone1,
          companyPhone2: companyData.phone2,
        });
        alert("Vacante actualizada correctamente.");
        setEditingId(null);
      } else {
        await createVacancy({
          ...form,
          recruiterId: userId,
          companyProfileId: companyData.id,
          companyName: companyData.companyName,
          companyDescription: companyData.description,
          companyPhone1: companyData.phone1,
          companyPhone2: companyData.phone2,
        });
        alert("Vacante publicada correctamente.");
      }
      setForm({ ...emptyForm });
      await loadVacancies();
    } catch (err) {
      alert(err.response?.data?.error || "Error al guardar la vacante.");
    }
    setSaving(false);
  };

  const handleSaveAndExit = async () => {
    await handleSubmit();
    navigate("/company");
  };

  const handleClear = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  const handleEditVacancy = (v) => {
    setEditingId(v.id);
    setForm({
      jobTitle: v.jobTitle || "",
      department: v.department || "",
      description: v.description || "",
      requiredTechnicalSkills: v.requiredTechnicalSkills || [],
      desiredSoftSkills: v.desiredSoftSkills || [],
      requiredLanguages: v.requiredLanguages || [],
      desiredCertifications: v.desiredCertifications || [],
      experienceLevel: v.experienceLevel || "con experiencia",
      minExperienceYears: v.minExperienceYears ?? 0,
      salaryRange: v.salaryRange || { min: 0, max: 0 },
      workAvailability: v.workAvailability || "tiempo completo",
      closingDate: v.closingDate || "",
      status: v.status || "Abierta",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteVacancy = async (id) => {
    if (!confirm("¿Eliminar esta vacante? Esta acción no se puede deshacer.")) return;
    try {
      await deleteVacancy(id);
      setMyVacancies((p) => p.filter((v) => v.id !== id));
      if (editingId === id) { setEditingId(null); setForm({ ...emptyForm }); }
    } catch {
      alert("Error al eliminar.");
    }
  };

  const descWordCount = form.description.split(/\s+/).filter(Boolean).length;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>;
  }

  if (!companyRegistered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-black text-blue-950 mb-2">EMPRESA NO REGISTRADA</h2>
          <p className="text-gray-500 mb-6">Por favor ingrese primero a Mi EMPRESA para registrar sus datos.</p>
          <Link to="/company/mi-empresa" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 inline-block">Ir a Mi Empresa</Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-blue-950">Reclutar</h1>
          <span></span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── FORMULARIO (IZQUIERDA) ── */}
          <div className="flex-1 min-w-0">
            {editingId && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 mb-4 flex items-center justify-between">
                <p className="text-sm text-amber-800 font-bold">Editando vacante existente</p>
                <button onClick={handleClear} className="text-xs text-amber-600 hover:text-amber-800 font-bold">Cancelar edición</button>
              </div>
            )}

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h3 className="text-sm font-bold text-blue-700 mb-2">Datos de la Empresa (no modificables aquí)</h3>
                <p className="text-sm"><strong>{companyData.companyName}</strong></p>
                <p className="text-xs text-gray-500">{companyData.description}</p>
                <p className="text-xs text-gray-500 mt-1">Tel: {companyData.phone1} {companyData.phone2 && `/ ${companyData.phone2}`}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Título del cargo</label>
                <input value={form.jobTitle} onChange={(e) => handleChange("jobTitle", e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: Desarrollador Web" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Área / Departamento</label>
                <input value={form.department} onChange={(e) => handleChange("department", e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: Tecnología" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Descripción <span className="text-xs text-gray-400">({descWordCount}/20 palabras)</span></label>
                <textarea value={form.description} onChange={(e) => { const w = e.target.value.split(/\s+/).filter(Boolean).length; if (w <= 20) handleChange("description", e.target.value); }} className="w-full border border-gray-200 rounded-xl px-4 py-3 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Habilidades técnicas requeridas</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.requiredTechnicalSkills.map((s, i) => (
                    <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      {s.name} ({s.level}) <button onClick={() => removeSkill(i)} className="text-red-400">&times;</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="Ej: Java, Excel" className="min-w-0 border border-gray-200 rounded-xl px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <select value={newSkillLevel} onChange={(e) => setNewSkillLevel(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {SKILL_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <button onClick={addSkill} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-100">+</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Habilidades blandas deseadas</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.desiredSoftSkills.map((s, i) => (
                    <span key={i} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      {s} <button onClick={() => removeSoftSkill(i)} className="text-red-400">&times;</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newSoftSkill} onChange={(e) => setNewSoftSkill(e.target.value)} placeholder="Ej: Trabajo en equipo" className="min-w-0 border border-gray-200 rounded-xl px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={addSoftSkill} className="bg-green-50 text-green-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-green-100">+</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Idiomas requeridos</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.requiredLanguages.map((l, i) => (
                    <span key={i} className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      {l.name} ({l.level}) <button onClick={() => removeLanguage(i)} className="text-red-400">&times;</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newLang} onChange={(e) => setNewLang(e.target.value)} placeholder="Ej: Inglés" className="min-w-0 border border-gray-200 rounded-xl px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <select value={newLangLevel} onChange={(e) => setNewLangLevel(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {LANGUAGE_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <button onClick={addLanguage} className="bg-purple-50 text-purple-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-purple-100">+</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Certificaciones deseadas <span className="text-xs text-gray-400">(informativas)</span></label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.desiredCertifications.map((c, i) => (
                    <span key={i} className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      {c} <button onClick={() => removeCertification(i)} className="text-red-400">&times;</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newCert} onChange={(e) => setNewCert(e.target.value)} placeholder="Ej: Scrum Fundamentals" className="min-w-0 border border-gray-200 rounded-xl px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={addCertification} className="bg-orange-50 text-orange-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-orange-100">+</button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nivel de experiencia</label>
                  <select value={form.experienceLevel} onChange={(e) => handleChange("experienceLevel", e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="con experiencia">Con experiencia</option>
                    <option value="sin experiencia">Sin experiencia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Años mínimos</label>
                  <input type="number" min="0" value={form.minExperienceYears} onChange={(e) => handleChange("minExperienceYears", Math.max(0, +e.target.value))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Disponibilidad</label>
                  <select value={form.workAvailability} onChange={(e) => handleChange("workAvailability", e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="tiempo completo">Tiempo completo</option>
                    <option value="medio tiempo">Medio tiempo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Rango salarial (Bs.)</label>
                <div className="flex gap-3">
                  <input type="number" value={form.salaryRange.min} onChange={(e) => handleChange("salaryRange", { ...form.salaryRange, min: +e.target.value })} placeholder="Min" className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="number" value={form.salaryRange.max} onChange={(e) => handleChange("salaryRange", { ...form.salaryRange, max: +e.target.value })} placeholder="Max" className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Fecha de cierre</label>
                  <input type="date" value={form.closingDate} onChange={(e) => handleChange("closingDate", e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Estado</label>
                  <select value={form.status} onChange={(e) => handleChange("status", e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Abierta">Abierta</option>
                    <option value="Cerrada">Cerrada</option>
                  </select>
                </div>
              </div>
            </motion.div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <button onClick={handleSubmit} disabled={saving} className="bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 text-sm">
                {saving ? "..." : editingId ? "ACTUALIZAR" : "GUARDAR Y RECLUTAR"}
              </button>
              <button onClick={handleClear} className="bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition-all text-sm">
                LIMPIAR CAMPOS
              </button>
              <button onClick={handleClear} className="bg-red-100 text-red-600 py-3 rounded-xl font-bold hover:bg-red-200 transition-all text-sm">
                BORRAR
              </button>
              <button onClick={handleSaveAndExit} disabled={saving} className="bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-gray-900 transition-all disabled:opacity-50 text-sm">
                GUARDAR Y SALIR
              </button>
            </div>
          </div>

          {/* ── TARJETAS CREADAS (DERECHA) ── */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <h2 className="text-lg font-black text-blue-950 mb-4">Vacantes Creadas ({myVacancies.length})</h2>
            <div className="space-y-4 max-h-[calc(100vh-160px)] overflow-y-auto pr-1">
              {myVacancies.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">Aún no has creado vacantes.</p>
              )}
              {myVacancies.map((v) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`bg-white rounded-2xl shadow p-4 border-2 transition-all ${editingId === v.id ? "border-amber-400 bg-amber-50" : "border-gray-100"}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-blue-900 text-sm leading-tight">{v.jobTitle}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ml-2 ${v.status === "Abierta" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{v.status}</span>
                  </div>
                  <p className="text-xs text-gray-500">{v.department}</p>
                  {v.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{v.description}</p>}
                  {v.requiredTechnicalSkills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {v.requiredTechnicalSkills.slice(0, 3).map((s, i) => (
                        <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{s.name}</span>
                      ))}
                    </div>
                  )}
                  {v.closingDate && <p className="text-[10px] text-gray-400 mt-2">Cierre: {v.closingDate}</p>}

                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button onClick={() => handleEditVacancy(v)} className="flex-1 bg-blue-50 text-blue-600 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all">Modificar</button>
                    <button onClick={() => handleDeleteVacancy(v.id)} className="flex-1 bg-red-50 text-red-500 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition-all">Borrar</button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reclutar;
