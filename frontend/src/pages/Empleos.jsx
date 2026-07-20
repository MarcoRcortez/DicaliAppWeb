import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "../store/authStore";
import {
  getOpenVacancies,
  getConfirmedMatchesCandidate,
  getNewNotifications,
  markNotified,
  getCandidateProfile,
  rejectMatch,
  getMatchesForCandidate,
  getCompanyProfile,
  getMatchExplanation,
} from "../api/api";

const Empleos = () => {
  const { userId } = useAuthStore();
  const [vacancies, setVacancies] = useState([]);
  const [matches, setMatches] = useState([]);
  const [candidateScores, setCandidateScores] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState([]);
  const [filter, setFilter] = useState("Todos");
  const [candidateId, setCandidateId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewVacancy, setViewVacancy] = useState(null);
  const [contactPopup, setContactPopup] = useState(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [explanations, setExplanations] = useState({});
  const [explLoading, setExplLoading] = useState(null);

  // Búsqueda y filtros avanzados
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [minSalary, setMinSalary] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("Todas");
  const [maxYearsRequired, setMaxYearsRequired] = useState("");
  const [langFilter, setLangFilter] = useState("Todos");
  const [sortBy, setSortBy] = useState("score");

  useEffect(() => { loadData(); }, [userId]);

  const loadExplanation = async (matchId) => {
    if (!matchId || explanations[matchId]) return;
    setExplLoading(matchId);
    try {
      const res = await getMatchExplanation(matchId);
      setExplanations((p) => ({ ...p, [matchId]: res.data.explanation }));
    } catch { /* ignorar */ }
    setExplLoading(null);
  };

  const openContact = async (vacancy) => {
    setContactLoading(true);
    try {
      const res = await getCompanyProfile(vacancy.recruiterId);
      setContactPopup({ vacancy, company: res.data });
    } catch {
      setContactPopup({ vacancy, company: { companyName: vacancy.companyName, phone1: vacancy.companyPhone1, phone2: vacancy.companyPhone2, email: "", address: "" } });
    }
    setContactLoading(false);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const vacRes = await getOpenVacancies();
      setVacancies(vacRes.data);

      const profileRes = await getCandidateProfile(userId);
      const cid = profileRes.data.id;
      setCandidateId(cid);

      const matchRes = await getConfirmedMatchesCandidate(cid);
      setMatches(matchRes.data);

      // Cargar scores del candidato contra vacantes
      try {
        const scoresRes = await getMatchesForCandidate(cid);
        const byVacancy = {};
        scoresRes.data.forEach((m) => { byVacancy[m.vacancyId] = m; });
        setCandidateScores(byVacancy);
      } catch { /* sin scores */ }

      const notifRes = await getNewNotifications(cid);
      if (notifRes.data.length > 0) {
        setPopupData(notifRes.data);
        setShowPopup(true);
        await markNotified(cid);
      }
    } catch {
      // El candidato aún no tiene perfil
    }
    setLoading(false);
  };

  const handleRejectMatch = async (matchId) => {
    await rejectMatch(matchId);
    setMatches((prev) => prev.filter((m) => m.id !== matchId));
  };

  const departments = ["Todos", ...new Set(vacancies.map((v) => v.department).filter(Boolean))];
  const langs = ["Todos", ...new Set(vacancies.flatMap((v) => (v.requiredLanguages || []).map((l) => l.name)).filter(Boolean))];

  /** Compatibilidad del candidato con una vacante (-1 si aún no está calculada) */
  const scoreOf = (v) => candidateScores[v.id]?.score ?? -1;

  const filtered = vacancies
    .filter((v) => {
      const q = search.toLowerCase().trim();
      if (q) {
        const texto = [
          v.jobTitle, v.companyName, v.department, v.description,
          ...(v.requiredTechnicalSkills || []).map((s) => s.name),
          ...(v.desiredSoftSkills || []),
          ...(v.requiredLanguages || []).map((l) => l.name),
          ...(v.desiredCertifications || []),
        ].filter(Boolean).join(" ").toLowerCase();
        if (!texto.includes(q)) return false;
      }
      if (filter !== "Todos" && v.department !== filter) return false;
      if (availabilityFilter !== "Todas" && v.workAvailability !== availabilityFilter) return false;
      if (langFilter !== "Todos" && !v.requiredLanguages?.some((l) => l.name === langFilter)) return false;
      if (minSalary && (v.salaryRange?.max || 0) < Number(minSalary)) return false;
      if (maxYearsRequired !== "" && (v.minExperienceYears ?? 0) > Number(maxYearsRequired)) return false;
      if (minScore > 0 && scoreOf(v) < minScore) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "salary") return (b.salaryRange?.max || 0) - (a.salaryRange?.max || 0);
      if (sortBy === "recent") return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
      return scoreOf(b) - scoreOf(a); // por compatibilidad (por defecto)
    });

  /** Top 3 vacantes recomendadas por el motor (independiente de los filtros activos) */
  const recomendadas = [...vacancies]
    .filter((v) => scoreOf(v) >= 60)
    .sort((a, b) => scoreOf(b) - scoreOf(a))
    .slice(0, 3);

  const limpiarFiltros = () => {
    setSearch(""); setFilter("Todos"); setMinScore(0); setMinSalary("");
    setAvailabilityFilter("Todas"); setMaxYearsRequired(""); setLangFilter("Todos"); setSortBy("score");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* POP-UP DE MATCH */}
      <AnimatePresence>
        {showPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPopup(false)}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 text-center" onClick={(e) => e.stopPropagation()}>
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-black text-blue-950 mb-4">¡Haz hecho Match Laboral!</h2>
              {popupData.map((n) => (
                <p key={n.id} className="text-gray-600 mb-2">
                  Haz hecho match empresarial con <span className="font-bold text-blue-600">{n.companyName}</span> para el puesto de <span className="font-bold">{n.jobTitle}</span>
                </p>
              ))}
              <button onClick={() => setShowPopup(false)} className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">
                ¡Entendido!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL VER DETALLES DE VACANTE */}
      <AnimatePresence>
        {viewVacancy && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewVacancy(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-3xl p-8 max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-black text-blue-950">{viewVacancy.jobTitle}</h2>
                <span className={`text-xs px-2 py-1 rounded-full font-bold flex-shrink-0 ml-3 ${viewVacancy.status === "Abierta" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{viewVacancy.status}</span>
              </div>

              <p className="text-blue-600 font-bold">{viewVacancy.companyName}</p>
              <p className="text-sm text-gray-500">{viewVacancy.department}</p>

              {viewVacancy.description && (
                <div className="mt-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase mb-1">Descripcion</h3>
                  <p className="text-sm text-gray-700">{viewVacancy.description}</p>
                </div>
              )}

              {viewVacancy.requiredTechnicalSkills?.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Habilidades Tecnicas Requeridas</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewVacancy.requiredTechnicalSkills.map((s, i) => (
                      <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">{s.name} <span className="text-xs opacity-60">({s.level})</span></span>
                    ))}
                  </div>
                </div>
              )}

              {viewVacancy.desiredSoftSkills?.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Habilidades Blandas Deseadas</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewVacancy.desiredSoftSkills.map((s, i) => (
                      <span key={i} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {viewVacancy.requiredLanguages?.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Idiomas Requeridos</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewVacancy.requiredLanguages.map((l, i) => (
                      <span key={i} className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm">{l.name} <span className="text-xs opacity-60">({l.level})</span></span>
                    ))}
                  </div>
                </div>
              )}

              {viewVacancy.desiredCertifications?.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Certificaciones Deseadas</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewVacancy.desiredCertifications.map((c, i) => (
                      <span key={i} className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mt-5">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 font-bold">Experiencia</p>
                  <p className="text-sm font-bold text-gray-700">{viewVacancy.experienceLevel || "-"}{viewVacancy.minExperienceYears ? ` (${viewVacancy.minExperienceYears}+ años)` : ""}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 font-bold">Disponibilidad</p>
                  <p className="text-sm font-bold text-gray-700">{viewVacancy.workAvailability || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 font-bold">Salario Ofertado</p>
                  <p className="text-sm font-bold text-gray-700">{viewVacancy.salaryRange ? `Bs. ${viewVacancy.salaryRange.min} - ${viewVacancy.salaryRange.max}` : "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 font-bold">Fecha de cierre</p>
                  <p className="text-sm font-bold text-gray-700">{viewVacancy.closingDate || "-"}</p>
                </div>
              </div>

              {/* Score de compatibilidad */}
              {candidateScores[viewVacancy.id] && (
                <div className="mt-5 bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-blue-800">Tu compatibilidad con esta vacante</span>
                    <span className="text-lg font-black text-blue-600">{Math.round(candidateScores[viewVacancy.id].score)}%</span>
                  </div>
                  <div className="w-full bg-blue-100 rounded-full h-2 mt-2">
                    <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${Math.round(candidateScores[viewVacancy.id].score)}%` }}></div>
                  </div>
                  <div className="mt-2">
                    {!explanations[candidateScores[viewVacancy.id].id] && (
                      <button onClick={() => loadExplanation(candidateScores[viewVacancy.id].id)} className="text-xs text-blue-600 hover:underline font-bold">
                        {explLoading === candidateScores[viewVacancy.id].id ? "Generando explicación..." : "¿Por qué este match?"}
                      </button>
                    )}
                    {explanations[candidateScores[viewVacancy.id].id] && (
                      <p className="text-xs text-gray-600 mt-1 italic">{explanations[candidateScores[viewVacancy.id].id]}</p>
                    )}
                  </div>
                </div>
              )}

              <button onClick={() => setViewVacancy(null)} className="w-full mt-6 bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-gray-900 transition-all">Cerrar</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL CONTACTAR EMPRESA */}
      <AnimatePresence>
        {contactPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setContactPopup(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-3xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">🏢</div>
                <h2 className="text-xl font-black text-blue-950">Contactar Empresa</h2>
                <p className="text-sm text-gray-400 mt-1">Puesto: {contactPopup.vacancy.jobTitle}</p>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 font-bold uppercase mb-1">Empresa</p>
                  <p className="text-lg font-bold text-blue-900">{contactPopup.company.companyName}</p>
                  {contactPopup.company.description && <p className="text-xs text-gray-500 mt-1">{contactPopup.company.description}</p>}
                </div>

                {(contactPopup.company.phone1 || contactPopup.company.phone2) && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-2">Telefonos</p>
                    {contactPopup.company.phone1 && (
                      <a href={`tel:${contactPopup.company.phone1}`} className="flex items-center gap-3 text-sm text-blue-600 font-bold hover:underline mb-2">
                        <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-base">📞</span>
                        {contactPopup.company.phone1}
                      </a>
                    )}
                    {contactPopup.company.phone2 && (
                      <a href={`tel:${contactPopup.company.phone2}`} className="flex items-center gap-3 text-sm text-blue-600 font-bold hover:underline">
                        <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-base">📞</span>
                        {contactPopup.company.phone2}
                      </a>
                    )}
                  </div>
                )}

                {contactPopup.company.email && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-2">Correo electronico</p>
                    <a href={`mailto:${contactPopup.company.email}?subject=Postulacion: ${contactPopup.vacancy.jobTitle}`} className="flex items-center gap-3 text-sm text-blue-600 font-bold hover:underline">
                      <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-base">📧</span>
                      {contactPopup.company.email}
                    </a>
                  </div>
                )}

                {contactPopup.company.address && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-2">Direccion</p>
                    <p className="flex items-center gap-3 text-sm text-gray-700">
                      <span className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-base">📍</span>
                      {contactPopup.company.address}
                    </p>
                  </div>
                )}

                {contactPopup.company.phone1 && (
                  <a href={`https://wa.me/${contactPopup.company.phone1.replace(/\D/g, "")}?text=Hola, me interesa la vacante de ${contactPopup.vacancy.jobTitle}. Vi su oferta en DICALI.`} target="_blank" rel="noopener noreferrer" className="block w-full bg-green-500 text-white py-3 rounded-xl font-bold text-center hover:bg-green-600 transition-all text-sm">
                    Enviar mensaje por WhatsApp
                  </a>
                )}
              </div>

              <button onClick={() => setContactPopup(null)} className="w-full mt-4 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition-all">Cerrar</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-blue-950">Empleos</h1>
        </div>

        {/* SECTOR MATCHES */}
        {matches.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 border-2 border-green-400 rounded-2xl p-6 bg-green-50">
            <h2 className="text-lg font-black text-green-800 mb-4">Haz hecho match con las siguientes empresas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((m) => (
                <div key={m.id} className="bg-white rounded-xl p-4 shadow-sm border border-green-200">
                  <h3 className="font-bold text-blue-900">{m.jobTitle}</h3>
                  <p className="text-sm text-green-700 font-semibold">{m.companyName}</p>
                  <p className="text-xs text-gray-500 mt-1">{m.department}</p>
                  <p className="text-xs text-gray-400 mt-1">{m.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">{Math.round(m.score)}% match</span>
                    <button onClick={() => handleRejectMatch(m.id)} className="text-xs text-red-400 hover:text-red-600">Rechazar</button>
                  </div>
                  <button onClick={() => openContact({ jobTitle: m.jobTitle, recruiterId: m.recruiterId, companyName: m.companyName, companyPhone1: "", companyPhone2: "" })} className="w-full mt-3 bg-green-500 text-white py-2 rounded-xl text-xs font-bold hover:bg-green-600 transition-all">
                    Contactar Empresa
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── RECOMENDADAS PARA TI (ranking del motor de matching) ── */}
        {recomendadas.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 border-2 border-blue-300 rounded-2xl p-6 bg-blue-50">
            <h2 className="text-lg font-black text-blue-900 mb-1">⭐ Recomendadas para ti</h2>
            <p className="text-xs text-blue-700 mb-4">Las vacantes con mayor compatibilidad según tu currículum.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recomendadas.map((v) => {
                const s = Math.round(scoreOf(v));
                return (
                  <div key={v.id} className="bg-white rounded-xl p-4 shadow-sm border border-blue-200 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-blue-900 text-sm leading-tight">{v.jobTitle}</h3>
                      <span className="text-xs font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex-shrink-0">{s}%</span>
                    </div>
                    <p className="text-xs text-blue-600 font-semibold mt-1">{v.companyName}</p>
                    <p className="text-[11px] text-gray-500">{v.department}</p>
                    <div className="w-full bg-blue-100 rounded-full h-1.5 mt-2">
                      <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${s}%` }}></div>
                    </div>
                    <button onClick={() => setViewVacancy(v)} className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all">
                      VER DETALLES
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── BÚSQUEDA Y FILTROS AVANZADOS ── */}
        <div className="bg-white rounded-2xl shadow p-4 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por puesto, empresa, habilidad o descripción..."
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="score">Ordenar: compatibilidad</option>
              <option value="salary">Ordenar: mejor salario</option>
              <option value="recent">Ordenar: más recientes</option>
            </select>
            <button
              onClick={() => setShowFilters((s) => !s)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${showFilters ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              Filtros avanzados
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Área</label>
                <select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm">
                  {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Compatibilidad mínima</label>
                <select value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm">
                  <option value={0}>Cualquiera</option>
                  <option value={50}>≥ 50%</option>
                  <option value={70}>≥ 70%</option>
                  <option value={90}>≥ 90%</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Salario mínimo (Bs.)</label>
                <input type="number" min="0" value={minSalary} onChange={(e) => setMinSalary(e.target.value)} placeholder="Cualquiera" className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Disponibilidad</label>
                <select value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm">
                  <option value="Todas">Todas</option>
                  <option value="tiempo completo">Tiempo completo</option>
                  <option value="medio tiempo">Medio tiempo</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Idioma requerido</label>
                <select value={langFilter} onChange={(e) => setLangFilter(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm">
                  {langs.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Exp. requerida máx. (años)</label>
                <input type="number" min="0" value={maxYearsRequired} onChange={(e) => setMaxYearsRequired(e.target.value)} placeholder="Sin límite" className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm" />
              </div>
              <div className="flex items-end lg:col-span-2">
                <button onClick={limpiarFiltros} className="w-full bg-gray-100 text-gray-700 rounded-lg px-2 py-2 text-sm font-bold hover:bg-gray-200">Limpiar filtros</button>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-3">
            {filtered.length} {filtered.length === 1 ? "vacante encontrada" : "vacantes encontradas"}
          </p>
        </div>

        {/* VACANTES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((v) => {
            const matchData = candidateScores[v.id];
            const score = matchData ? Math.round(matchData.score) : null;
            const scoreColor = score >= 80 ? "bg-green-100 text-green-700" : score >= 50 ? "bg-yellow-100 text-yellow-700" : score !== null ? "bg-red-50 text-red-600" : "";

            return (
              <motion.div key={v.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-blue-900">{v.jobTitle}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-bold flex-shrink-0 ml-2 ${v.status === "Abierta" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{v.status}</span>
                </div>
                <p className="text-sm text-blue-600 font-semibold">{v.companyName}</p>
                <p className="text-xs text-gray-500 mt-1">{v.department}</p>
                <p className="text-sm text-gray-600 mt-3">{v.description}</p>
                <div className="mt-4 flex flex-wrap gap-1">
                  {v.requiredTechnicalSkills?.map((s, i) => (
                    <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">{s.name}</span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                  <span>{v.experienceLevel}</span>
                  <span>{v.workAvailability}</span>
                  {v.salaryRange && <span>Bs. {v.salaryRange.min} - {v.salaryRange.max}</span>}
                </div>

                {/* SCORE DE COMPATIBILIDAD */}
                {score !== null && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500 font-bold">Compatibilidad</span>
                      <span className={`text-xs font-black px-2 py-0.5 rounded-full ${scoreColor}`}>{score}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all ${score >= 80 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-red-400"}`} style={{ width: `${score}%` }}></div>
                    </div>
                  </div>
                )}

                {/* BOTONES */}
                <div className="flex gap-2 mt-auto pt-4">
                  <button onClick={() => setViewVacancy(v)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all">
                    VER DETALLES
                  </button>
                  {score !== null && score >= 70 && (
                    <button onClick={() => openContact(v)} disabled={contactLoading} className="flex-1 bg-green-500 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-green-600 transition-all">
                      CONTACTAR
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-gray-400 mt-12">No hay vacantes disponibles en este momento.</p>
        )}
      </div>
    </div>
  );
};

export default Empleos;
