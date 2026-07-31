import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "../store/authStore";
import {
  getAllCandidateProfiles,
  getMyVacancies,
  getMatchesForVacancy,
  acceptMatch,
  rejectMatch,
  directMatch,
  getCompanyProfile,
  runMatchingForRecruiter,
  getRecruiterScores,
  getMatchExplanation,
} from "../api/api";
import { titleCase } from "../utils/format";
import { exportCvToPdf } from "../utils/cvPdf";

const Postulantes = () => {
  const { userId } = useAuthStore();
  const [candidates, setCandidates] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [scoresByCandidate, setScoresByCandidate] = useState({});
  const [confirmedMatches, setConfirmedMatches] = useState([]);
  const [filter, setFilter] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [matchPopup, setMatchPopup] = useState(null);
  const [viewCandidate, setViewCandidate] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [explanations, setExplanations] = useState({});
  const [explLoading, setExplLoading] = useState(null);

  // Matches del candidato contra cada vacante de la empresa: { candidateId: [{vacancyId, jobTitle, score, matchId}] }
  const [matchesByCandidate, setMatchesByCandidate] = useState({});
  // Vista por vacante: "Todas" o el id de una vacante concreta
  const [vacancyView, setVacancyView] = useState("Todas");
  // Vacante elegida en el pop-up de confirmación de match
  const [popupVacancy, setPopupVacancy] = useState("");

  // Búsqueda y filtros avanzados
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [langFilter, setLangFilter] = useState("Todos");
  const [workTypeFilter, setWorkTypeFilter] = useState("Todos");
  const [minYears, setMinYears] = useState(0);
  const [maxSalary, setMaxSalary] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState("score");
  const [soloPostulados, setSoloPostulados] = useState(false);

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

  const loadData = async () => {
    setLoading(true);
    try {
      const candRes = await getAllCandidateProfiles();
      setCandidates(candRes.data);
    } catch (err) {
      console.error("Error cargando candidatos:", err);
    }

    try {
      const cpRes = await getCompanyProfile(userId);
      setCompanyName(cpRes.data.companyName || "Empresa");
    } catch { /* sin perfil de empresa */ }

    // Ejecutar el motor de matching automáticamente
    try {
      await runMatchingForRecruiter(userId);
    } catch { /* sin vacantes para matchear */ }

    // Cargar los scores calculados por candidato
    try {
      const scoresRes = await getRecruiterScores(userId);
      setScoresByCandidate(scoresRes.data);
    } catch { /* sin scores */ }

    // Cargar matches confirmados
    try {
      const vacRes = await getMyVacancies(userId);
      setVacancies(vacRes.data);

      const confirmed = [];
      const byCandidate = {};
      for (const v of vacRes.data) {
        try {
          const mRes = await getMatchesForVacancy(v.id);
          confirmed.push(...mRes.data.filter((m) => m.status === "MATCHED"));
          // Guardar el match de cada candidato contra ESTA vacante (para el selector y la vista por vacante)
          for (const m of mRes.data) {
            if (!byCandidate[m.candidateId]) byCandidate[m.candidateId] = [];
            byCandidate[m.candidateId].push({
              id: m.id,            // mismo nombre que usa scoresByCandidate (para la explicación)
              matchId: m.id,
              vacancyId: v.id,
              jobTitle: v.jobTitle,
              score: m.score,
              status: m.status,
              candidateApplied: m.candidateApplied,
            });
          }
        } catch { /* vacante sin matches */ }
      }
      setConfirmedMatches(confirmed);
      setMatchesByCandidate(byCandidate);
    } catch { /* sin vacantes */ }
    setLoading(false);
  };

  /** Abre el pop-up preseleccionando la vacante de mayor compatibilidad (o la vista actual) */
  const openMatchPopup = (c) => {
    const list = matchesByCandidate[c.id] || [];
    const best = [...list].sort((a, b) => b.score - a.score)[0];
    const preselect =
      vacancyView !== "Todas" ? vacancyView : best?.vacancyId || vacancies[0]?.id || "";
    setPopupVacancy(preselect);
    setMatchPopup({ candidateId: c.id, name: c.fullName });
  };

  const handleAcceptMatch = async () => {
    try {
      const list = matchesByCandidate[matchPopup.candidateId] || [];
      const chosen = list.find((m) => m.vacancyId === popupVacancy);

      if (chosen?.matchId) {
        // Ya existía el match para la vacante elegida: solo confirmarlo
        await acceptMatch(chosen.matchId);
      } else {
        // No había match precalculado para esa vacante: el backend lo crea con el score real
        await directMatch({
          candidateId: matchPopup.candidateId,
          recruiterId: userId,
          companyName: companyName,
          vacancyId: popupVacancy,
        });
      }
      const titulo = vacancies.find((v) => v.id === popupVacancy)?.jobTitle || "";
      setMatchPopup(null);
      await loadData();
      alert(`¡Conexión confirmada${titulo ? ` para el puesto de ${titleCase(titulo)}` : ""}! El postulante recibirá una notificación.`);
    } catch (err) {
      alert("Error al conectar: " + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmDelete) return;
    await rejectMatch(confirmDelete);
    setConfirmedMatches((prev) => prev.filter((m) => m.id !== confirmDelete));
    setConfirmDelete(null);
  };

  /**
   * Score a mostrar: si se está viendo una vacante concreta, el de ESA vacante;
   * si no, el mejor match del candidato entre todas las vacantes de la empresa.
   */
  const getScoreForCandidate = (candidateId) => {
    if (vacancyView !== "Todas") {
      const list = matchesByCandidate[candidateId] || [];
      return list.find((m) => m.vacancyId === vacancyView) || null;
    }
    return scoresByCandidate[candidateId] || null;
  };

  // Buscar datos completos del candidato por su candidateId (para matches confirmados)
  const findCandidateById = (candidateId) => candidates.find((c) => c.id === candidateId);

  /**
   * ¿El candidato se postuló? Si se está viendo una vacante concreta, a ESA vacante;
   * si no, a cualquiera de las vacantes de la empresa.
   */
  const sePostulo = (candidateId) => {
    const list = matchesByCandidate[candidateId] || [];
    if (vacancyView !== "Todas") {
      return list.some((m) => m.vacancyId === vacancyView && m.candidateApplied);
    }
    return list.some((m) => m.candidateApplied);
  };

  /** Años de experiencia sumando las fechas del CV (mismo criterio que el motor) */
  const calcYears = (c) => {
    if (!c.workExperience?.length) return 0;
    const today = new Date();
    let days = 0;
    for (const w of c.workExperience) {
      if (!w.startDate) continue;
      const start = new Date(w.startDate);
      const end = w.current || !w.endDate ? today : new Date(w.endDate);
      if (isNaN(start) || isNaN(end) || end < start) continue;
      days += (end - start) / 86400000;
    }
    return days / 365.25;
  };

  // Opciones de filtro: TODAS las habilidades/idiomas de todos los candidatos
  const areas = ["Todos", ...new Set(candidates.flatMap((c) => (c.technicalSkills || []).map((s) => s.name)).filter(Boolean))];
  const langs = ["Todos", ...new Set(candidates.flatMap((c) => (c.languages || []).map((l) => l.name)).filter(Boolean))];

  const filtered = candidates
    .filter((c) => {
      const q = search.toLowerCase().trim();
      if (q) {
        const texto = [
          c.fullName, c.email, c.location,
          ...(c.technicalSkills || []).map((s) => s.name),
          ...(c.softSkills || []),
          ...(c.educations || []).map((e) => `${e.degree || ""} ${e.institution || ""}`),
          ...(c.certifications || []).map((x) => x.name),
        ].filter(Boolean).join(" ").toLowerCase();
        if (!texto.includes(q)) return false;
      }
      if (filter !== "Todos" && !c.technicalSkills?.some((s) => s.name === filter)) return false;
      if (langFilter !== "Todos" && !c.languages?.some((l) => l.name === langFilter)) return false;
      if (workTypeFilter !== "Todos" && c.workType !== workTypeFilter) return false;
      if (minYears > 0 && calcYears(c) < minYears) return false;
      if (maxSalary && (c.expectedSalary?.max || 0) > Number(maxSalary)) return false;
      if (minScore > 0) {
        const m = getScoreForCandidate(c.id);
        if (!m || m.score < minScore) return false;
      }
      if (soloPostulados && !sePostulo(c.id)) return false;
      if (vacancyView !== "Todas") {
        const list = matchesByCandidate[c.id] || [];
        if (!list.some((m) => m.vacancyId === vacancyView)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "years") return calcYears(b) - calcYears(a);
      if (sortBy === "salary") return (a.expectedSalary?.max || 0) - (b.expectedSalary?.max || 0);
      return (getScoreForCandidate(b.id)?.score || 0) - (getScoreForCandidate(a.id)?.score || 0);
    });

  // Cuántos candidatos se postularon activamente (en la vista actual)
  const numInteresados = candidates.filter((c) => sePostulo(c.id)).length;

  const limpiarFiltros = () => {
    setSearch(""); setFilter("Todos"); setLangFilter("Todos"); setWorkTypeFilter("Todos");
    setMinYears(0); setMaxSalary(""); setMinScore(0); setSortBy("score");
    setSoloPostulados(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* ── POPUP VER DETALLES DEL CV ── */}
      <AnimatePresence>
        {viewCandidate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewCandidate(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

              {/* Cabecera */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden border-4 border-blue-100 flex-shrink-0">
                  {viewCandidate.photoBase64 ? <img src={viewCandidate.photoBase64} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">👤</div>}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-blue-950">{titleCase(viewCandidate.fullName) || "Sin nombre"}</h2>
                  <p className="text-sm text-gray-500">{viewCandidate.email} | {viewCandidate.phone} | {viewCandidate.location}</p>
                </div>
              </div>

              {/* Experiencia Laboral */}
              {viewCandidate.workExperience?.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-sm font-black text-blue-900 mb-2 uppercase tracking-wide">Experiencia Laboral</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-gray-200 rounded-xl">
                      <thead className="bg-gray-50"><tr><th className="p-2 text-left">Cargo</th><th className="p-2 text-left">Empresa</th><th className="p-2 text-left">Desde</th><th className="p-2 text-left">Hasta</th></tr></thead>
                      <tbody>
                        {viewCandidate.workExperience.map((w, i) => (
                          <tr key={i} className="border-t border-gray-100">
                            <td className="p-2 font-medium">{w.title}</td>
                            <td className="p-2">{w.company}</td>
                            <td className="p-2">{w.startDate}</td>
                            <td className="p-2">{w.current ? "Actual" : w.endDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Educación */}
              {viewCandidate.educations?.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-sm font-black text-blue-900 mb-2 uppercase tracking-wide">Educación</h3>
                  {viewCandidate.educations.map((e, i) => (
                    <p key={i} className="text-sm text-gray-700"><strong>{e.degree}</strong> — {e.institution} ({e.year})</p>
                  ))}
                </div>
              )}

              {/* Habilidades Técnicas */}
              {viewCandidate.technicalSkills?.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-sm font-black text-blue-900 mb-2 uppercase tracking-wide">Habilidades Técnicas</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewCandidate.technicalSkills.map((s, i) => (
                      <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">{s.name} <span className="text-xs opacity-60">({s.level})</span></span>
                    ))}
                  </div>
                </div>
              )}

              {/* Habilidades Blandas */}
              {viewCandidate.softSkills?.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-sm font-black text-blue-900 mb-2 uppercase tracking-wide">Habilidades Blandas</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewCandidate.softSkills.map((s, i) => (
                      <span key={i} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Idiomas */}
              {viewCandidate.languages?.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-sm font-black text-blue-900 mb-2 uppercase tracking-wide">Idiomas</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewCandidate.languages.map((l, i) => (
                      <span key={i} className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm">{l.name} ({l.level})</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Certificaciones */}
              {viewCandidate.certifications?.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-sm font-black text-blue-900 mb-2 uppercase tracking-wide">Certificaciones</h3>
                  {viewCandidate.certifications.map((c, i) => (
                    <p key={i} className="text-sm text-gray-700"><strong>{c.name}</strong> — {c.institution}{c.year ? ` (${c.year})` : ""}</p>
                  ))}
                </div>
              )}

              {/* Salario y Disponibilidad */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 font-bold">Expectativa Salarial</p>
                  <p className="text-sm font-bold text-gray-700">Bs. {viewCandidate.expectedSalary?.min || 0} - {viewCandidate.expectedSalary?.max || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 font-bold">Disponibilidad</p>
                  <p className="text-sm font-bold text-gray-700">{viewCandidate.workSchedule || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 font-bold">Tipo de trabajo</p>
                  <p className="text-sm font-bold text-gray-700">{viewCandidate.workType || "-"}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => exportCvToPdf(viewCandidate, { download: true })} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                  <span>⬇</span> Descargar CV (PDF)
                </button>
                <button onClick={() => setViewCandidate(null)} className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-gray-900 transition-all">Cerrar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── POPUP CONFIRMAR MATCH ── */}
      <AnimatePresence>
        {matchPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setMatchPopup(null)}>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 text-center" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-black text-blue-950 mb-4">¿Vas a conectar con este candidato?</h2>
              <p className="text-gray-600 mb-4">Vas a conectar con <strong>{titleCase(matchPopup.name)}</strong>.</p>

              {/* Selección explícita del puesto */}
              <div className="text-left mb-5">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Puesto al que se asociará</label>
                <select
                  aria-label="Puesto para la conexión"
                  value={popupVacancy}
                  onChange={(e) => setPopupVacancy(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {vacancies.length === 0 && <option value="">No tienes vacantes creadas</option>}
                  {[...vacancies]
                    .map((v) => {
                      const m = (matchesByCandidate[matchPopup.candidateId] || []).find((x) => x.vacancyId === v.id);
                      return { ...v, _score: m ? Math.round(m.score) : null, _applied: !!m?.candidateApplied };
                    })
                    .sort((a, b) => (b._score ?? -1) - (a._score ?? -1))
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.jobTitle}{v._score !== null ? ` — ${v._score}% compatibilidad` : " — sin calcular"}{v._applied ? " · se postuló" : ""}
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  Se preselecciona el puesto de mayor compatibilidad, pero puedes elegir otro.
                </p>
              </div>

              <p className="text-xs text-gray-500 mb-5">El postulante recibirá una notificación con este puesto.</p>
              <div className="flex gap-4 justify-center">
                <button onClick={handleAcceptMatch} disabled={!popupVacancy} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50">CONECTAR</button>
                <button onClick={() => setMatchPopup(null)} className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-300">SALIR</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── POPUP CONFIRMAR ELIMINAR MATCH ── */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setConfirmDelete(null)}>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 text-center" onClick={(e) => e.stopPropagation()}>
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-2xl font-black text-blue-950 mb-2">¿Eliminar esta conexión?</h2>
              <p className="text-gray-500 mb-6">Esta acción eliminará la tarjeta de conexión de ambos lados. No se puede deshacer.</p>
              <div className="flex gap-4 justify-center">
                <button onClick={handleDeleteConfirmed} className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700">SÍ, ELIMINAR</button>
                <button onClick={() => setConfirmDelete(null)} className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-300">CANCELAR</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-blue-950">Postulantes</h1>
          <span></span>
        </div>

        {/* SECTOR MATCHES */}
        {confirmedMatches.length > 0 && (
          <div className="mb-8 border-2 border-green-400 rounded-2xl p-6 bg-green-50">
            <h2 className="text-lg font-black text-green-800 mb-4">Conexiones confirmadas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {confirmedMatches.map((m) => {
                const cand = findCandidateById(m.candidateId);
                return (
                  <div key={m.id} className="bg-white rounded-xl p-4 shadow-sm border border-green-200">
                    <h3 className="font-bold text-blue-900">{titleCase(m.jobTitle)}</h3>
                    <p className="text-xs text-gray-500">{m.department}</p>
                    {cand && <p className="text-sm text-green-700 font-semibold mt-1">Candidato: {cand.fullName}</p>}
                    <p className="text-sm text-gray-600 mt-1">{m.description}</p>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold mt-2 inline-block">{Math.round(m.score)}% compatibilidad</span>
                    <div className="flex gap-2 mt-3">
                      {cand && <button onClick={() => setViewCandidate(cand)} className="text-xs text-blue-500 hover:text-blue-700 font-bold">Ver CV</button>}
                      <button onClick={() => setConfirmDelete(m.id)} className="text-xs text-red-400 hover:text-red-600 font-bold">Eliminar conexión</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── BÚSQUEDA, VISTA POR VACANTE Y FILTROS AVANZADOS ── */}
        <div className="bg-white rounded-2xl shadow p-4 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, habilidad, institución o ubicación..."
              className="min-w-0 flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              aria-label="Ver candidatos por vacante"
              value={vacancyView}
              onChange={(e) => setVacancyView(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Ver candidatos para una vacante concreta"
            >
              <option value="Todas">Todas mis vacantes</option>
              {vacancies.map((v) => (
                <option key={v.id} value={v.id}>Vacante: {v.jobTitle}</option>
              ))}
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
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Habilidad técnica</label>
                <select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm">
                  {areas.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Idioma</label>
                <select value={langFilter} onChange={(e) => setLangFilter(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm">
                  {langs.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Modalidad</label>
                <select value={workTypeFilter} onChange={(e) => setWorkTypeFilter(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm">
                  <option value="Todos">Todas</option>
                  <option value="remoto">Remoto</option>
                  <option value="presencial La Paz">Presencial La Paz</option>
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
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Años exp. mínimos</label>
                <input type="number" min="0" value={minYears} onChange={(e) => setMinYears(Math.max(0, +e.target.value))} className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Salario esperado máx. (Bs.)</label>
                <input type="number" min="0" value={maxSalary} onChange={(e) => setMaxSalary(e.target.value)} placeholder="Sin límite" className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ordenar por</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm">
                  <option value="score">Compatibilidad</option>
                  <option value="years">Años de experiencia</option>
                  <option value="salary">Expectativa salarial</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 w-full bg-blue-50 border border-blue-200 rounded-lg px-2 py-2 text-sm font-bold text-blue-700 cursor-pointer">
                  <input type="checkbox" checked={soloPostulados} onChange={(e) => setSoloPostulados(e.target.checked)} className="accent-blue-600" />
                  Solo postulados
                </label>
              </div>
              <div className="flex items-end">
                <button onClick={limpiarFiltros} className="w-full bg-gray-100 text-gray-700 rounded-lg px-2 py-2 text-sm font-bold hover:bg-gray-200">Limpiar filtros</button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
            <p className="text-xs text-gray-400">
              {filtered.length} {filtered.length === 1 ? "postulante" : "postulantes"}
              {vacancyView !== "Todas" && ` para "${vacancies.find((v) => v.id === vacancyView)?.jobTitle || ""}"`}
            </p>
            {numInteresados > 0 && (
              <button
                onClick={() => setSoloPostulados((v) => !v)}
                title="Los que se postularon activamente a tus vacantes"
                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${soloPostulados ? "bg-blue-600 text-white border-blue-600" : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"}`}
              >
                {soloPostulados ? "✓ Mostrando solo interesados" : `✋ Ver solo interesados (${numInteresados})`}
              </button>
            )}
          </div>
        </div>

        {/* CANDIDATOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => {
            const matchData = getScoreForCandidate(c.id);
            const score = matchData ? Math.round(matchData.score) : null;
            const scoreColor = score >= 80 ? "bg-green-100 text-green-700 border-green-300" : score >= 50 ? "bg-yellow-100 text-yellow-700 border-yellow-300" : score !== null ? "bg-red-50 text-red-600 border-red-200" : "";
            const cardBorder = score >= 80 ? "border-green-300" : score >= 50 ? "border-yellow-200" : "border-gray-100";
            const applied = sePostulo(c.id);

            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`bg-white rounded-2xl shadow-lg p-6 border-2 ${applied ? "border-blue-500 ring-2 ring-blue-200" : cardBorder}`}>
                {applied && (
                  <div className="mb-4 -mt-1 bg-blue-600 text-white text-[11px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1.5 uppercase tracking-wide">
                    <span>✋</span> Se postuló a este puesto
                  </div>
                )}
                {/* BARRA DE SCORE */}
                {score !== null && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-500">Compatibilidad</span>
                      <span className={`text-sm font-black px-2 py-0.5 rounded-full border ${scoreColor}`}>{score}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all ${score >= 80 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-red-400"}`} style={{ width: `${score}%` }}></div>
                    </div>
                    {matchData.jobTitle && (
                      <p className="text-[10px] text-gray-400 mt-1">
                        {vacancyView === "Todas" ? "Mejor compatibilidad: " : "Puesto: "}{titleCase(matchData.jobTitle)}
                      </p>
                    )}
                    {matchData.id && (
                      <div className="mt-1">
                        {!explanations[matchData.id] && (
                          <button onClick={() => loadExplanation(matchData.id)} className="text-[10px] text-blue-500 hover:underline font-bold">
                            {explLoading === matchData.id ? "Generando..." : "¿Por qué esta compatibilidad?"}
                          </button>
                        )}
                        {explanations[matchData.id] && <p className="text-[11px] text-gray-500 mt-1 italic">{explanations[matchData.id]}</p>}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden border-2 border-blue-100">
                    {c.photoBase64 ? <img src={c.photoBase64} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg text-gray-300">👤</div>}
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-900 flex items-center gap-2">
                      {titleCase(c.fullName)}
                      {sePostulo(c.id) && (
                        <span title="Este candidato se postuló activamente" className="bg-blue-100 text-blue-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                          Se postuló
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-gray-500">{c.location}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {c.technicalSkills?.slice(0, 4).map((s, i) => (
                    <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">{s.name}</span>
                  ))}
                </div>
                {score === null && <p className="text-xs text-gray-400 italic mb-2">Sin vacantes para calcular compatibilidad</p>}
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setViewCandidate(c)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl text-xs font-bold hover:bg-gray-200">VER DETALLES</button>
                  <button
                    onClick={() => openMatchPopup(c)}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-blue-700"
                  >CONECTAR</button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && <p className="text-center text-gray-400 mt-12">No hay postulantes disponibles.</p>}
      </div>
    </div>
  );
};

export default Postulantes;
