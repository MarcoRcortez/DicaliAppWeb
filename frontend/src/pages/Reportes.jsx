import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import useAuthStore from "../store/authStore";
import { getRecruiterReport, getAllCandidateProfiles } from "../api/api";
import { titleCase } from "../utils/format";

const Reportes = () => {
  const { userId } = useAuthStore();
  const [data, setData] = useState(null);
  const [candidatos, setCandidatos] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getRecruiterReport(userId);
        setData(res.data);
        // Nombres de los candidatos sin responder (para el aviso)
        try {
          const cRes = await getAllCandidateProfiles();
          const map = {};
          cRes.data.forEach((c) => { map[c.id] = c.fullName; });
          setCandidatos(map);
        } catch { /* sin acceso a nombres */ }
      } catch { /* sin datos */ }
      setLoading(false);
    })();
  }, [userId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>;
  }

  const r = data?.resumen || {};
  const porVacante = data?.porVacante || [];
  const sinResponder = data?.sinResponderLista || [];
  const postulantes = data?.postulantes || [];

  const ESTADO_BADGE = {
    MATCHED: { label: "Conectado", cls: "bg-green-100 text-green-700" },
    REJECTED: { label: "Rechazado", cls: "bg-red-100 text-red-600" },
    PENDING: { label: "Sin responder", cls: "bg-amber-100 text-amber-700" },
  };

  const estados = [
    { name: "Conectados", value: r.conectados || 0, color: "#22c55e" },
    { name: "Sin responder", value: r.sinResponder || 0, color: "#f59e0b" },
    { name: "Rechazados", value: r.rechazados || 0, color: "#ef4444" },
  ];
  const hayPostulaciones = (r.postulados || 0) > 0;

  const tarjeta = (label, value, color) => (
    <div className={`bg-white rounded-2xl shadow p-5 border-l-4 ${color}`}>
      <p className="text-3xl font-black text-gray-800">{value ?? 0}</p>
      <p className="text-xs text-gray-500 font-bold uppercase mt-1">{label}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-blue-950">Reportes</h1>
          <Link to="/company" className="text-sm text-blue-600 font-bold hover:underline">← Volver</Link>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {tarjeta("Vacantes", r.totalVacantes, "border-blue-500")}
          {tarjeta("Postulaciones", r.postulados, "border-indigo-500")}
          {tarjeta("Conexiones", r.conectados, "border-green-500")}
          {tarjeta("Rechazados", r.rechazados, "border-red-500")}
          {tarjeta("Sin responder", r.sinResponder, "border-amber-500")}
          {tarjeta("Compatib. prom.", `${r.compatibilidadPromedio || 0}%`, "border-purple-500")}
        </div>

        {/* Aviso: postulaciones sin responder */}
        {sinResponder.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 border-2 border-amber-400 rounded-2xl p-6 bg-amber-50">
            <h2 className="text-lg font-black text-amber-800 mb-1">⏳ Tienes {sinResponder.length} postulación(es) sin responder</h2>
            <p className="text-xs text-amber-700 mb-4">Estos candidatos se postularon y aún no reciben respuesta. Atenderlos a tiempo mejora tu reputación en la plataforma.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sinResponder.map((s, i) => (
                <div key={i} className="bg-white rounded-xl p-3 border border-amber-200 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{titleCase(candidatos[s.candidateId] || "Candidato")}</p>
                    <p className="text-xs text-gray-500">{titleCase(s.jobTitle)}</p>
                  </div>
                  <span className="text-xs font-black text-blue-600">{Math.round(s.score)}%</span>
                </div>
              ))}
            </div>
            <Link to="/company/postulantes" className="inline-block mt-4 bg-amber-500 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 transition-all">
              Ir a Postulantes
            </Link>
          </motion.div>
        )}

        {!hayPostulaciones && (
          <p className="text-center text-gray-400 py-12">Aún no hay postulaciones a tus vacantes. Cuando los candidatos se postulen, verás aquí cómo avanza el proceso.</p>
        )}

        {hayPostulaciones && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Estado de las postulaciones */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="text-sm font-bold text-gray-700 mb-4">Estado de las postulaciones</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={estados.filter((e) => e.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label isAnimationActive={false}>
                    {estados.filter((e) => e.value > 0).map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Postulaciones por vacante */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="text-sm font-bold text-gray-700 mb-4">Postulaciones por vacante</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={porVacante.map((v) => ({ name: titleCase(v.jobTitle), Postulados: v.postulados, Conectados: v.conectados }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Postulados" fill="#6366f1" isAnimationActive={false} />
                  <Bar dataKey="Conectados" fill="#22c55e" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tabla general de postulantes */}
        {postulantes.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-6 overflow-x-auto mb-8">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Postulantes ({postulantes.length})</h3>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="p-3 text-left">Candidato</th>
                  <th className="p-3 text-left">Vacante</th>
                  <th className="p-3 text-center">Compatibilidad</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-center">Fecha de postulación</th>
                </tr>
              </thead>
              <tbody>
                {postulantes.map((p, i) => {
                  const badge = ESTADO_BADGE[p.status] || ESTADO_BADGE.PENDING;
                  return (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="p-3 font-medium text-gray-800">{titleCase(candidatos[p.candidateId] || "Candidato")}</td>
                      <td className="p-3 text-gray-600">{titleCase(p.jobTitle)}</td>
                      <td className="p-3 text-center font-bold text-blue-600">{Math.round(p.score)}%</td>
                      <td className="p-3 text-center"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badge.cls}`}>{badge.label}</span></td>
                      <td className="p-3 text-center text-gray-500 text-xs">{p.appliedAt ? p.appliedAt.slice(0, 10) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mt-4">
              <Link to="/company/postulantes" className="text-sm text-blue-600 font-bold hover:underline">Ver detalle y responder en Postulantes →</Link>
            </div>
          </div>
        )}

        {/* Tabla por vacante */}
        {porVacante.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-6 overflow-x-auto">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Detalle por vacante</h3>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="p-3 text-left">Vacante</th>
                  <th className="p-3 text-center">Postulados</th>
                  <th className="p-3 text-center">Conectados</th>
                  <th className="p-3 text-center">Rechazados</th>
                  <th className="p-3 text-center">Sin responder</th>
                  <th className="p-3 text-center">Compatib. prom.</th>
                </tr>
              </thead>
              <tbody>
                {porVacante.map((v) => (
                  <tr key={v.vacancyId} className="border-t border-gray-100">
                    <td className="p-3 font-medium text-gray-800">{titleCase(v.jobTitle)}</td>
                    <td className="p-3 text-center">{v.postulados}</td>
                    <td className="p-3 text-center text-green-600 font-bold">{v.conectados}</td>
                    <td className="p-3 text-center text-red-500">{v.rechazados}</td>
                    <td className="p-3 text-center text-amber-600 font-bold">{v.sinResponder}</td>
                    <td className="p-3 text-center">{v.compatibilidadProm}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reportes;
