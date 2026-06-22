import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
    const [view, setView] = useState('companies');
    const [data, setData] = useState([]);
    const [editId, setEditId] = useState(null);
    const [tempData, setTempData] = useState({});

    useEffect(() => { fetchData(); }, [view]);

    const fetchData = async () => {
        try {
            const url = `http://localhost:8080/api/${view === 'companies' ? 'companies/all' : 'jobPosts/all'}`;
            const res = await axios.get(url);
            setData(res.data);
        } catch (err) { console.error("Error al jalar datos:", err); }
    };

    const addNewRow = () => {
        const newItem = view === 'companies'
            ? { _id: 'temp-' + Date.now(), companyName: '', representativeName: '', nit: '', city: 'La Paz', status: 'PENDIENTE' }
            : { _id: 'temp-' + Date.now(), title: '', companyName: '', city: 'La Paz', salary: 0 };
        setData([newItem, ...data]);
        setEditId(newItem._id);
        setTempData(newItem);
    };

    const handleSave = async (id) => {
        try {
            const path = view === 'companies' ? '/api/companies/save' : '/api/jobPosts/save';
            // Si el ID es temporal, lo enviamos como null para que MongoDB cree uno nuevo
            const isNew = id.toString().startsWith('temp-');
            const payload = isNew ? { ...tempData, id: null, _id: null } : { ...tempData, id: id };

            await axios.post(`http://localhost:8080${path}`, payload);
            setEditId(null);
            fetchData();
            alert("Cambios guardados correctamente.");
        } catch (err) {
            alert("Error al guardar: " + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Deseas eliminar este registro?")) return;
        try {
            const path = view === 'companies' ? `/api/companies/delete/${id}` : `/api/jobPosts/${id}`;
            await axios.delete(`http://localhost:8080${path}`);
            fetchData();
        } catch (err) { alert("Error al borrar."); }
    };

    return (
        <div className="min-h-screen bg-[#060b1a] text-white p-8">
            <div className="max-w-7xl mx-auto flex justify-between items-center mb-10">
                <h1 className="text-4xl font-black italic">DICALI <span className="text-blue-500 underline">ADMIN</span></h1>
                <button onClick={addNewRow} className="bg-emerald-500 px-6 py-2 rounded-xl font-bold uppercase text-[10px] hover:scale-105 transition-all shadow-lg shadow-emerald-500/20">
                    + Nueva Fila
                </button>
            </div>

            <div className="flex gap-8">
                <div className="w-64 space-y-4">
                    <button onClick={() => setView('companies')} className={`w-full p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest ${view === 'companies' ? 'bg-blue-600 shadow-blue-900/40' : 'bg-slate-800/30 text-slate-500'}`}>
                        🏢 Gestión Empresas
                    </button>
                    <button onClick={() => setView('jobs')} className={`w-full p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest ${view === 'jobs' ? 'bg-blue-600 shadow-blue-900/40' : 'bg-slate-800/30 text-slate-500'}`}>
                        💼 Bolsa de Trabajo
                    </button>
                </div>

                <div className="flex-1 bg-[#0f172a]/50 border border-slate-800 rounded-[3rem] overflow-hidden backdrop-blur-md">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/40 border-b border-slate-800">
                            <tr>
                                <th className="p-6 text-blue-400 text-[10px] font-black uppercase tracking-widest">{view === 'companies' ? 'Empresa' : 'Cargo'}</th>
                                <th className="p-6 text-blue-400 text-[10px] font-black uppercase tracking-widest">{view === 'companies' ? 'Representante Legal' : 'Empresa'}</th>
                                <th className="p-6 text-blue-400 text-[10px] font-black uppercase tracking-widest text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item) => (
                                <tr key={item._id || item.id} className="border-b border-slate-800/30 hover:bg-white/5 transition-all">
                                    <td className="p-6 font-bold uppercase text-xs">
                                        {editId === (item._id || item.id) ? (
                                            <input className="bg-slate-800 p-2 rounded w-full" defaultValue={view === 'companies' ? item.companyName : item.title} onChange={e => setTempData({...tempData, [view === 'companies' ? 'companyName' : 'title']: e.target.value})} />
                                        ) : (view === 'companies' ? item.companyName : item.title)}
                                    </td>
                                    <td className="p-6 italic text-slate-400 text-sm">
                                        {editId === (item._id || item.id) ? (
                                            <input className="bg-slate-800 p-2 rounded w-full" defaultValue={view === 'companies' ? item.representativeName : item.companyName} onChange={e => setTempData({...tempData, [view === 'companies' ? 'representativeName' : 'companyName']: e.target.value})} />
                                        ) : (view === 'companies' ? (item.representativeName || "Sin registro") : item.companyName)}
                                    </td>
                                    <td className="p-6 text-center space-x-4">
                                        {editId === (item._id || item.id) ? (
                                            <button onClick={() => handleSave(item._id || item.id)} className="text-emerald-400 font-black text-[10px] uppercase">Guardar</button>
                                        ) : (
                                            <>
                                                <button onClick={() => {setEditId(item._id || item.id); setTempData(item);}} className="text-blue-500 font-black text-[10px] uppercase">Editar</button>
                                                <button onClick={() => handleDelete(item._id || item.id)} className="text-rose-500 font-black text-[10px] uppercase">Borrar</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;