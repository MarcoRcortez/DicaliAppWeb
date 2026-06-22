import { useEffect, useState } from "react";
import axios from "axios";

const AdminJobs = () => {
  const [jobs, setJobs] = useState([]);

  const fetchJobs = async () => {
    try {
      // Usamos el puerto 8080 que configuraste en tu server.js
      const res = await axios.get("http://localhost:8080/api/jobPosts/all");
      setJobs(res.data);
    } catch (err) {
      console.error("Error al obtener vacantes:", err);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("¿Está seguro de eliminar esta vacante definitivamente?")) {
      try {
        // Ajustamos la ruta para que coincida con tu backend (/:id)
        await axios.delete(`http://localhost:8080/api/jobPosts/${id}`);
        fetchJobs(); // Recargar la lista tras eliminar
      } catch (err) {
        console.error("Error al eliminar:", err);
      }
    }
  };

  return (
    <div className="px-4 pb-4 pt-32 max-w-6xl mx-auto min-h-screen bg-slate-50">
      <div className="flex justify-between items-end mb-10 border-b-4 border-slate-900 pb-4">
        <div>
          <h1 className="text-5xl font-black text-slate-900 italic uppercase tracking-tighter">
            Gestión de <span className="text-indigo-600">Vacantes</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Panel de Control Dicali</p>
        </div>
        <div className="bg-slate-900 text-white px-4 py-2 font-black text-xs uppercase">
          Total: {jobs.length}
        </div>
      </div>

      <div className="grid gap-3">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <div key={job._id} className="bg-white p-6 border-2 border-slate-200 flex flex-col md:flex-row justify-between items-center group hover:border-indigo-500 transition-all">
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="bg-indigo-100 text-indigo-700 text-[9px] font-black px-2 py-0.5 uppercase tracking-tighter">
                    {job.category || 'Sin Categoría'}
                  </span>
                  <span className="text-slate-300 text-xs font-mono">ID: {job._id.slice(-6)}</span>
                </div>
                
                <h3 className="text-xl font-black text-slate-800 uppercase italic leading-none mb-1">
                  {job.title}
                </h3>
                
                <div className="flex flex-wrap gap-x-4 text-xs font-bold uppercase tracking-tighter">
                  <p className="text-indigo-600">🏢 {job.companyName || "Empresa"}</p>
                  <p className="text-slate-400">📍 {job.city || "La Paz"}</p>
                  <p className="text-emerald-600">💰 {job.salary} Bs.</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4 md:mt-0">
                <button 
                  onClick={() => handleDelete(job._id)}
                  className="bg-white border-2 border-red-600 text-red-600 px-6 py-2 font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"
                >
                  Eliminar Vacante
                </button>
              </div>
              
            </div>
          ))
        ) : (
          <div className="text-center py-20 border-4 border-dashed border-slate-200">
            <p className="text-slate-300 font-black uppercase text-sm tracking-[0.3em]">No hay vacantes registradas</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminJobs;