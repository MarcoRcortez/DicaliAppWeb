import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [view, setView] = useState('companies'); // Controla qué tabla ver
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchData = async () => {
    try {
      const resComp = await axios.get('http://localhost:8080/api/companies/all');
      const resJobs = await axios.get('http://localhost:8080/api/jobPosts/all');
      setCompanies(resComp.data);
      setJobs(resJobs.data);
    } catch (err) { console.error("Error al sincronizar datos:", err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (id, type) => {
    const endpoint = type === 'company' ? `api/companies/${id}` : `api/jobPosts/${id}`;
    await axios.put(`http://localhost:8080/${endpoint}`, editForm);
    setEditingId(null);
    fetchData();
  };

  const handleDelete = async (id, type) => {
    if (window.confirm("¿Estás seguro de eliminar este registro?")) {
      const endpoint = type === 'company' ? `api/companies/${id}` : `api/jobPosts/${id}`;
      await axios.delete(`http://localhost:8080/${endpoint}`);
      fetchData();
    }
  };

  return (
    <div className="pt-24 p-8 max-w-7xl mx-auto min-h-screen bg-gray-50">
      <h1 className="text-4xl font-black text-[#1e3a8a] mb-8 tracking-tighter">PANEL ADMINISTRATIVO</h1>
      
      {/* Pestañas de Selección */}
      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => { setView('companies'); setEditingId(null); }} 
          className={`px-8 py-3 rounded-2xl font-bold transition-all ${view === 'companies' ? 'bg-[#1e3a8a] text-white shadow-lg' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
        >
          Empresas ({companies.length})
        </button>
        <button 
          onClick={() => { setView('jobs'); setEditingId(null); }} 
          className={`px-8 py-3 rounded-2xl font-bold transition-all ${view === 'jobs' ? 'bg-[#1e3a8a] text-white shadow-lg' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
        >
          Vacantes ({jobs.length})
        </button>
      </div>

      {/* Cuadro Blanco Dinámico */}
      <div className="bg-white rounded-[40px] shadow-sm p-10 border border-gray-100 min-h-[500px]">
        {view === 'companies' ? (
          /* --- SECCIÓN EMPRESAS --- */
          <div className="animate-in fade-in duration-500">
            <h2 className="text-xl font-bold text-blue-900 mb-8 underline decoration-blue-200">Control de Entidades Registradas</h2>
            <div className="space-y-4">
              {companies.map(c => (
                <div key={c._id} className="grid grid-cols-5 py-4 border-b border-gray-50 items-center gap-4">
                  {editingId === c._id ? (
                    <>
                      <input className="border p-2 rounded-lg text-sm" value={editForm.companyName} onChange={e => setEditForm({...editForm, companyName: e.target.value})} />
                      <input className="border p-2 rounded-lg text-sm font-mono" value={editForm.nit} onChange={e => setEditForm({...editForm, nit: e.target.value})} />
                      <input className="border p-2 rounded-lg text-sm" value={editForm.city} onChange={e => setEditForm({...editForm, city: e.target.value})} />
                      <select className="border p-2 rounded-lg text-sm" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                        <option value="PENDIENTE">PENDIENTE</option>
                        <option value="AUDITADO">AUDITADO</option>
                      </select>
                      <button onClick={() => handleSave(c._id, 'company')} className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-green-700">Guardar</button>
                    </>
                  ) : (
                    <>
                      <span className="font-bold text-slate-700">{c.companyName}</span>
                      <span className="text-gray-400 font-mono text-sm">{c.nit}</span>
                      <span className="text-gray-500">{c.city}</span>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full w-fit ${c.status === 'AUDITADO' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{c.status}</span>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => { setEditingId(c._id); setEditForm(c); }} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-200">Editar</button>
                        <button onClick={() => handleDelete(c._id, 'company')} className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-lg hover:bg-red-100">Borrar</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* --- SECCIÓN VACANTES --- */
          <div className="animate-in fade-in duration-500">
            <h2 className="text-xl font-bold text-blue-900 mb-8 underline decoration-blue-200">Gestión de Ofertas Laborales</h2>
            <div className="space-y-4">
              {jobs.map(j => (
                <div key={j._id} className="grid grid-cols-5 py-4 border-b border-gray-50 items-center gap-4">
                  {editingId === j._id ? (
                    <>
                      <input className="border p-2 rounded-lg text-sm col-span-1" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} />
                      <input className="border p-2 rounded-lg text-sm" value={editForm.company} onChange={e => setEditForm({...editForm, company: e.target.value})} />
                      <input className="border p-2 rounded-lg text-sm font-bold text-green-600" value={editForm.salary} onChange={e => setEditForm({...editForm, salary: e.target.value})} />
                      <span className="text-gray-300 text-xs italic">Modo edición</span>
                      <button onClick={() => handleSave(j._id, 'job')} className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-green-700">Guardar</button>
                    </>
                  ) : (
                    <>
                      <span className="font-bold text-slate-700">{j.title}</span>
                      <span className="text-gray-500">{j.company}</span>
                      <span className="font-bold text-green-600">{j.salary} Bs.</span>
                      <span className="text-gray-400 text-xs">{j.location}</span>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => { setEditingId(j._id); setEditForm(j); }} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-200">Editar</button>
                        <button onClick={() => handleDelete(j._id, 'job')} className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-lg hover:bg-red-100">Borrar</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;