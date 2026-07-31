import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import useAuthStore from "../store/authStore";
import {
  getAdminStats, getAdminUsers, deleteAdminUser, updateAdminUser, createAdminUser,
  getAdminVacancies, deleteAdminVacancy,
  getAdminProfiles, deleteAdminProfile,
  normalizeData,
} from "../api/api";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const AdminPanel = () => {
  const { email, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("inicio");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [normalizing, setNormalizing] = useState(false);

  const handleNormalize = async () => {
    if (!confirm("Se corregirán las mayúsculas de títulos, nombres, empresas, educación y certificaciones en todos los registros. ¿Continuar?")) return;
    setNormalizing(true);
    try {
      const res = await normalizeData();
      const d = res.data;
      alert(`Ortografía normalizada.\nVacantes: ${d.vacantes}\nCurrículos: ${d.curriculos}\nEmpresas: ${d.empresas}`);
    } catch {
      alert("No se pudo normalizar. Verifica tu sesión de administrador.");
    }
    setNormalizing(false);
  };

  // Modales
  const [editUser, setEditUser] = useState(null);
  const [editVacancy, setEditVacancy] = useState(null);
  const [editProfile, setEditProfile] = useState(null);
  const [addUser, setAddUser] = useState(false);
  const [addVacancy, setAddVacancy] = useState(false);
  const [addProfile, setAddProfile] = useState(false);

  // Formularios temporales
  const [formUser, setFormUser] = useState({ email: "", role: "CANDIDATE", active: true });
  const [formVacancy, setFormVacancy] = useState({ jobTitle: "", companyName: "", department: "", status: "Abierta", closingDate: "", description: "" });
  const [formProfile, setFormProfile] = useState({ fullName: "", email: "", phone: "", location: "La Paz", profileComplete: false });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, vacRes, profRes] = await Promise.all([
        getAdminStats(), getAdminUsers(), getAdminVacancies(), getAdminProfiles(),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setVacancies(vacRes.data);
      setProfiles(profRes.data);
    } catch { /* sin datos */ }
    setLoading(false);
  };

  const handleLogout = () => { logout(); navigate("/"); };

  // ── USUARIOS ──
  const handleDeleteUser = async (id) => {
    if (!confirm("¿Eliminar este usuario?")) return;
    await deleteAdminUser(id);
    setUsers((p) => p.filter((u) => u.id !== id));
  };

  const handleSaveUser = async () => {
    try {
      if (editUser) {
        await updateAdminUser(editUser.id, { ...editUser, ...formUser });
        setUsers((p) => p.map((u) => u.id === editUser.id ? { ...u, ...formUser } : u));
        setEditUser(null);
      } else {
        const res = await createAdminUser(formUser);
        setUsers((p) => [...p, res.data]);
        setAddUser(false);
      }
      setFormUser({ email: "", role: "CANDIDATE", active: true });
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || err.message));
    }
  };

  const openEditUser = (u) => {
    setFormUser({ email: u.email, role: u.role, active: u.active });
    setEditUser(u);
  };

  const openAddUser = () => {
    setFormUser({ email: "", role: "CANDIDATE", active: true });
    setAddUser(true);
  };

  // ── VACANTES ──
  const handleDeleteVacancy = async (id) => {
    if (!confirm("¿Eliminar esta vacante?")) return;
    await deleteAdminVacancy(id);
    setVacancies((p) => p.filter((v) => v.id !== id));
  };

  const openEditVacancy = (v) => {
    setFormVacancy({ jobTitle: v.jobTitle || "", companyName: v.companyName || "", department: v.department || "", status: v.status || "Abierta", closingDate: v.closingDate || "", description: v.description || "" });
    setEditVacancy(v);
  };

  const handleSaveVacancy = async () => {
    try {
      if (editVacancy) {
        const { default: API } = await import("../api/api");
        await API.put(`/admin/vacancies/${editVacancy.id}`, { ...editVacancy, ...formVacancy });
        setVacancies((p) => p.map((v) => v.id === editVacancy.id ? { ...v, ...formVacancy } : v));
        setEditVacancy(null);
      }
      setFormVacancy({ jobTitle: "", companyName: "", department: "", status: "Abierta", closingDate: "", description: "" });
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || err.message));
    }
  };

  // ── PERFILES ──
  const handleDeleteProfile = async (id) => {
    if (!confirm("¿Eliminar este currículo?")) return;
    await deleteAdminProfile(id);
    setProfiles((p) => p.filter((pr) => pr.id !== id));
  };

  const openEditProfile = (p) => {
    setFormProfile({ fullName: p.fullName || "", email: p.email || "", phone: p.phone || "", location: p.location || "La Paz", profileComplete: p.profileComplete || false });
    setEditProfile(p);
  };

  const handleSaveProfile = async () => {
    try {
      if (editProfile) {
        const { default: API } = await import("../api/api");
        await API.put(`/admin/profiles/${editProfile.id}`, { ...editProfile, ...formProfile });
        setProfiles((p) => p.map((pr) => pr.id === editProfile.id ? { ...pr, ...formProfile } : pr));
        setEditProfile(null);
      }
      setFormProfile({ fullName: "", email: "", phone: "", location: "La Paz", profileComplete: false });
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || err.message));
    }
  };

  const filteredUsers = users.filter((u) => u.email?.toLowerCase().includes(search.toLowerCase()) || u.role?.toLowerCase().includes(search.toLowerCase()));
  const filteredVacancies = vacancies.filter((v) => v.jobTitle?.toLowerCase().includes(search.toLowerCase()) || v.companyName?.toLowerCase().includes(search.toLowerCase()) || v.department?.toLowerCase().includes(search.toLowerCase()));
  const filteredProfiles = profiles.filter((p) => p.fullName?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase()));

  const tabs = [
    { id: "inicio", label: "Inicio", icon: "🏠" },
    { id: "usuarios", label: "Usuarios", icon: "👥" },
    { id: "empleos", label: "Empleos", icon: "💼" },
    { id: "curriculos", label: "Currículos", icon: "📄" },
  ];

  // ── MODAL GENÉRICO ──
  const Modal = ({ title, onClose, onSave, children }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-2xl p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-black text-blue-950 mb-4">{title}</h3>
        <div className="space-y-3">{children}</div>
        <div className="flex gap-3 mt-6">
          <button onClick={onSave} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">Guardar</button>
          <button onClick={onClose} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition-all">Cancelar</button>
        </div>
      </motion.div>
    </motion.div>
  );

  const InputField = ({ label, value, onChange, type = "text", options }) => (
    <div>
      <label className="block text-xs font-bold text-gray-600 mb-1">{label}</label>
      {options ? (
        <select value={value} onChange={onChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={onChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      )}
    </div>
  );

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-black text-blue-950">DICALI<span className="text-blue-500">.</span></h1>
          <p className="text-xs text-gray-400 mt-1">Panel Administrativo</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => { setActiveTab(t.id); setSearch(""); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === t.id ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"}`}>
              <span className="text-lg">{t.icon}</span> {t.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">AD</div>
            <div className="text-xs">
              <p className="font-bold text-gray-700">{email}</p>
              <p className="text-gray-400">Administrador</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full text-xs text-red-400 hover:text-red-600 text-left">Cerrar sesión</button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-8 overflow-y-auto">

        {/* ── MODALES ── */}
        <AnimatePresence>
          {(editUser || addUser) && (
            <Modal title={editUser ? "Modificar Usuario" : "Agregar Nuevo Usuario"} onClose={() => { setEditUser(null); setAddUser(false); }} onSave={handleSaveUser}>
              <InputField label="Email" value={formUser.email} onChange={(e) => setFormUser((p) => ({ ...p, email: e.target.value }))} type="email" />
              <InputField label="Rol" value={formUser.role} onChange={(e) => setFormUser((p) => ({ ...p, role: e.target.value }))} options={["CANDIDATE", "RECRUITER", "ADMIN"]} />
            </Modal>
          )}
          {editVacancy && (
            <Modal title="Modificar Empleo" onClose={() => setEditVacancy(null)} onSave={handleSaveVacancy}>
              <InputField label="Título del cargo" value={formVacancy.jobTitle} onChange={(e) => setFormVacancy((p) => ({ ...p, jobTitle: e.target.value }))} />
              <InputField label="Empresa" value={formVacancy.companyName} onChange={(e) => setFormVacancy((p) => ({ ...p, companyName: e.target.value }))} />
              <InputField label="Área/Departamento" value={formVacancy.department} onChange={(e) => setFormVacancy((p) => ({ ...p, department: e.target.value }))} />
              <InputField label="Descripción" value={formVacancy.description} onChange={(e) => setFormVacancy((p) => ({ ...p, description: e.target.value }))} />
              <InputField label="Estado" value={formVacancy.status} onChange={(e) => setFormVacancy((p) => ({ ...p, status: e.target.value }))} options={["Abierta", "Cerrada"]} />
              <InputField label="Fecha de cierre" value={formVacancy.closingDate} onChange={(e) => setFormVacancy((p) => ({ ...p, closingDate: e.target.value }))} type="date" />
            </Modal>
          )}
          {editProfile && (
            <Modal title="Modificar Currículo" onClose={() => setEditProfile(null)} onSave={handleSaveProfile}>
              <InputField label="Nombre completo" value={formProfile.fullName} onChange={(e) => setFormProfile((p) => ({ ...p, fullName: e.target.value }))} />
              <InputField label="Email" value={formProfile.email} onChange={(e) => setFormProfile((p) => ({ ...p, email: e.target.value }))} type="email" />
              <InputField label="Teléfono" value={formProfile.phone} onChange={(e) => setFormProfile((p) => ({ ...p, phone: e.target.value }))} />
              <InputField label="Ubicación" value={formProfile.location} onChange={(e) => setFormProfile((p) => ({ ...p, location: e.target.value }))} options={["La Paz", "El Alto"]} />
            </Modal>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* ── INICIO ── */}
          {activeTab === "inicio" && stats && (
            <motion.div key="inicio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-black text-blue-950">Bienvenido al Dashboard</h2>
                <button onClick={handleNormalize} disabled={normalizing} className="bg-amber-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-600 transition-all disabled:opacity-50">
                  {normalizing ? "Normalizando..." : "Normalizar ortografía de datos"}
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                {[
                  { label: "Total Usuarios", value: stats.totalUsers, border: "border-blue-500" },
                  { label: "Vacantes Abiertas", value: stats.openVacancies, border: "border-green-500" },
                  { label: "Compatibilidades Calculadas", value: stats.totalMatches, border: "border-yellow-500" },
                  { label: "Conexiones Confirmadas", value: stats.confirmedMatches, border: "border-purple-500" },
                ].map((c, i) => (
                  <div key={i} className={`bg-white rounded-2xl shadow p-6 border-l-4 ${c.border}`}>
                    <p className="text-xs text-gray-400 font-bold uppercase">{c.label}</p>
                    <p className="text-3xl font-black text-gray-800 mt-2">{c.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow p-6">
                  <h3 className="text-sm font-bold text-gray-700 mb-4">Usuarios y Empresas</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={[{ name: "Candidatos", value: Number(stats.candidates) }, { name: "Empresas", value: Number(stats.recruiters) }, { name: "Admins", value: Number(stats.admins) }]} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                        {[0, 1, 2].map((i) => <Cell key={i} fill={COLORS[i]} />)}
                      </Pie>
                      <Tooltip /><Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-2xl shadow p-6">
                  <h3 className="text-sm font-bold text-gray-700 mb-4">Estado de Vacantes</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={[{ name: "Abiertas", cantidad: Number(stats.openVacancies) }, { name: "Cerradas", cantidad: Number(stats.closedVacancies) }]}>
                      <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip />
                      <Bar dataKey="cantidad" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-2xl shadow p-6 md:col-span-2">
                  <h3 className="text-sm font-bold text-gray-700 mb-4">Resumen de Conexiones</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={[{ name: "Compatibilidades", cantidad: Number(stats.totalMatches) }, { name: "Confirmadas", cantidad: Number(stats.confirmedMatches) }]}>
                      <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip />
                      <Bar dataKey="cantidad" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── USUARIOS ── */}
          {activeTab === "usuarios" && (
            <motion.div key="usuarios" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-blue-950">Usuarios</h2>
                <div className="flex gap-3">
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por email o rol..." className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={openAddUser} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all whitespace-nowrap">+ Agregar Usuario</button>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-4 text-left font-bold text-gray-600">Email</th>
                      <th className="p-4 text-left font-bold text-gray-600">Rol</th>
                      <th className="p-4 text-left font-bold text-gray-600">Seguridad</th>
                      <th className="p-4 text-center font-bold text-gray-600">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="p-4">{u.email}</td>
                        <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${u.role === "ADMIN" ? "bg-purple-100 text-purple-700" : u.role === "RECRUITER" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{u.role}</span></td>
                        <td className="p-4 text-xs">{u.securityConfigured ? "Configurada" : "Pendiente"}</td>
                        <td className="p-4 text-center">
                          <div className="flex gap-3 justify-center">
                            <button onClick={() => openEditUser(u)} className="text-blue-500 hover:text-blue-700 text-xs font-bold">Modificar</button>
                            <button onClick={() => handleDeleteUser(u.id)} className="text-red-400 hover:text-red-600 text-xs font-bold">Eliminar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && <p className="p-8 text-center text-gray-400">Sin resultados.</p>}
              </div>
            </motion.div>
          )}

          {/* ── EMPLEOS ── */}
          {activeTab === "empleos" && (
            <motion.div key="empleos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-blue-950">Empleos</h2>
                <div className="flex gap-3">
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título o empresa..." className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={() => navigate("/company/reclutar")} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all whitespace-nowrap">+ Agregar Empleo</button>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-4 text-left font-bold text-gray-600">Título</th>
                      <th className="p-4 text-left font-bold text-gray-600">Empresa</th>
                      <th className="p-4 text-left font-bold text-gray-600">Área</th>
                      <th className="p-4 text-left font-bold text-gray-600">Estado</th>
                      <th className="p-4 text-left font-bold text-gray-600">Cierre</th>
                      <th className="p-4 text-center font-bold text-gray-600">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVacancies.map((v) => (
                      <tr key={v.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="p-4 font-medium">{v.jobTitle}</td>
                        <td className="p-4">{v.companyName}</td>
                        <td className="p-4">{v.department}</td>
                        <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${v.status === "Abierta" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{v.status}</span></td>
                        <td className="p-4 text-xs">{v.closingDate || "-"}</td>
                        <td className="p-4 text-center">
                          <div className="flex gap-3 justify-center">
                            <button onClick={() => openEditVacancy(v)} className="text-blue-500 hover:text-blue-700 text-xs font-bold">Modificar</button>
                            <button onClick={() => handleDeleteVacancy(v.id)} className="text-red-400 hover:text-red-600 text-xs font-bold">Eliminar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredVacancies.length === 0 && <p className="p-8 text-center text-gray-400">Sin resultados.</p>}
              </div>
            </motion.div>
          )}

          {/* ── CURRÍCULOS ── */}
          {activeTab === "curriculos" && (
            <motion.div key="curriculos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-blue-950">Currículos</h2>
                <div className="flex gap-3">
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o email..." className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={() => navigate("/login/candidate")} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all whitespace-nowrap">+ Agregar Currículo</button>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-4 text-left font-bold text-gray-600">Nombre</th>
                      <th className="p-4 text-left font-bold text-gray-600">Email</th>
                      <th className="p-4 text-left font-bold text-gray-600">Ubicación</th>
                      <th className="p-4 text-left font-bold text-gray-600">Skills</th>
                      <th className="p-4 text-left font-bold text-gray-600">Estado</th>
                      <th className="p-4 text-center font-bold text-gray-600">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfiles.map((p) => (
                      <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="p-4 font-medium">{p.fullName || "-"}</td>
                        <td className="p-4">{p.email || "-"}</td>
                        <td className="p-4">{p.location || "-"}</td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {p.technicalSkills?.slice(0, 3).map((s, i) => (
                              <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{s.name}</span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${p.profileComplete ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{p.profileComplete ? "Completo" : "Pendiente"}</span></td>
                        <td className="p-4 text-center">
                          <div className="flex gap-3 justify-center">
                            <button onClick={() => openEditProfile(p)} className="text-blue-500 hover:text-blue-700 text-xs font-bold">Modificar</button>
                            <button onClick={() => handleDeleteProfile(p.id)} className="text-red-400 hover:text-red-600 text-xs font-bold">Eliminar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredProfiles.length === 0 && <p className="p-8 text-center text-gray-400">Sin resultados.</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AdminPanel;
