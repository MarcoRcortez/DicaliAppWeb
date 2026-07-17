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
      for (const v of vacRes.data) {
        try {
          const mRes = await getMatchesForVacancy(v.id);
          confirmed.push(...mRes.data.filter((m) => m.status === "MATCHED"));
        } catch { /* vacante sin matches */ }
      }
      setConfirmedMatches(confirmed);
    } catch { /* sin vacantes */ }
    setLoading(false);
  };

  const handleAcceptMatch = async () => {
    try {
      if (matchPopup.matchId) {
        await acceptMatch(matchPopup.matchId);
      } else {
        await directMatch({
          candidateId: matchPopup.candidateId,
          recruiterId: userId,
          companyName: companyName,
        });
      }
      setMatchPopup(null);
      await loadData();
      alert("¡Match confirmado! El postulante recibirá una notificación.");
    } catch (err) {
      alert("Error al hacer match: " + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmDelete) return;
    await rejectMatch(confirmDelete);
    setConfirmedMatches((prev) => prev.filter((m) => m.id !== confirmDelete));
    setConfirmDelete(null);
  };

  const getScoreForCandidate = (candidateId) => {
    return scoresByCandidate[candidateId] || null;
  };

  // Buscar datos completos del candidato por su candidateId (para matches confirmados)
  const findCandidateById = (candidateId) => candidates.find((c) => c.id === candidateId);

  const areas = ["Todos", ...new Set(candidates.map((c) => c.technicalSkills?.[0]?.name).filter(Boolean))];
  const filtered = filter === "Todos" ? candidates : candidates.filter((c) => c.technicalSkills?.some((s) => s.name === filter));

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
                  <h2 className="text-2xl font-black text-blue-950">{viewCandidate.fullName || "Sin nombre"}</h2>
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
              <div className="grid grid-cols-3 gap-4 mb-6">
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

              <button onClick={() => setViewCandidate(null)} className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-gray-900 transition-all">Cerrar</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── POPUP CONFIRMAR MATCH ── */}
      <AnimatePresence>
        {matchPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setMatchPopup(null)}>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 text-center" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-black text-blue-950 mb-4">¿Vas a hacer match?</h2>
              <p className="text-gray-600 mb-6">Confirma para hacer match con <strong>{matchPopup.name}</strong>. El postulante recibirá una notificación.</p>
              <div className="flex gap-4 justify-center">
                <button onClick={handleAcceptMatch} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700">HACER MATCH</button>
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
              <h2 className="text-2xl font-black text-blue-950 mb-2">¿Eliminar este match?</h2>
              <p className="text-gray-500 mb-6">Esta acción eliminará la tarjeta de match de ambos lados. No se puede deshacer.</p>
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
            <h2 className="text-lg font-black text-green-800 mb-4">Matches Confirmados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {confirmedMatches.map((m) => {
                const cand = findCandidateById(m.candidateId);
                return (
                  <div key={m.id} className="bg-white rounded-xl p-4 shadow-sm border border-green-200">
                    <h3 className="font-bold text-blue-900">{m.jobTitle}</h3>
                    <p className="text-xs text-gray-500">{m.department}</p>
                    {cand && <p className="text-sm text-green-700 font-semibold mt-1">Candidato: {cand.fullName}</p>}
                    <p className="text-sm text-gray-600 mt-1">{m.description}</p>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold mt-2 inline-block">{Math.round(m.score)}% match</span>
                    <div className="flex gap-2 mt-3">
                      {cand && <button onClick={() => setViewCandidate(cand)} className="text-xs text-blue-500 hover:text-blue-700 font-bold">Ver CV</button>}
                      <button onClick={() => setConfirmDelete(m.id)} className="text-xs text-red-400 hover:text-red-600 font-bold">Eliminar Match</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FILTROS */}
        <div className="flex flex-wrap gap-2 mb-6">
          {areas.map((a) => (
            <button key={a} onClick={() => setFilter(a)} className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${filter === a ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-blue-400"}`}>
              {a}
            </button>
          ))}
        </div>

        {/* CANDIDATOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => {
            const matchData = getScoreForCandidate(c.id);
            const score = matchData ? Math.round(matchData.score) : null;
            const scoreColor = score >= 80 ? "bg-green-100 text-green-700 border-green-300" : score >= 50 ? "bg-yellow-100 text-yellow-700 border-yellow-300" : score !== null ? "bg-red-50 text-red-600 border-red-200" : "";
            const cardBorder = score >= 80 ? "border-green-300" : score >= 50 ? "border-yellow-200" : "border-gray-100";

            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`bg-white rounded-2xl shadow-lg p-6 border-2 ${cardBorder}`}>
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
                    {matchData.jobTitle && <p className="text-[10px] text-gray-400 mt-1">Mejor match: {matchData.jobTitle}</p>}
                    {matchData.id && (
                      <div className="mt-1">
                        {!explanations[matchData.id] && (
                          <button onClick={() => loadExplanation(matchData.id)} className="text-[10px] text-blue-500 hover:underline font-bold">
                            {explLoading === matchData.id ? "Generando..." : "¿Por qué este match?"}
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
                    <h3 className="font-bold text-blue-900">{c.fullName}</h3>
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
                    onClick={() => setMatchPopup(matchData ? { matchId: matchData.id, candidateId: c.id, name: c.fullName } : { candidateId: c.id, name: c.fullName })}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-blue-700"
                  >MATCH</button>
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
