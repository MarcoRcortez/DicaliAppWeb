import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Feed = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("Todos");

  const categorias = ["Todos", "Sistemas", "Administración", "Ventas", "Marketing", "Diseño"];

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get('http://localhost:8080/api/jobPosts/all');
        setJobs(res.data);
        setFilteredJobs(res.data);
      } catch (err) { 
        console.error("Error al cargar vacantes:", err); 
      }
    };
    fetchJobs();
  }, []);

  // Lógica de Filtrado (usando .companyName, que es el campo real del backend)
  useEffect(() => {
    let temp = jobs.filter(j =>
      j.title?.toLowerCase().includes(search.toLowerCase()) ||
      j.companyName?.toLowerCase().includes(search.toLowerCase())
    );

    if (activeCat !== "Todos") {
      temp = temp.filter(j => j.category === activeCat);
    }
    setFilteredJobs(temp);
  }, [search, activeCat, jobs]);

  return (
    <div className="pt-24 p-8 max-w-7xl mx-auto min-h-screen bg-slate-100 font-sans">
      
      {/* Título y Estilo Cuadrado */}
      <div className="mb-10">
        <h1 className="text-5xl font-black text-slate-900 italic tracking-tighter uppercase mb-2">
          MERCADO <span className="text-indigo-600">LABORAL</span>
        </h1>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Dicali Bolivia</p>
      </div>

      {/* Buscador Cuadrado */}
      <div className="mb-6">
        <input 
          type="text" 
          placeholder="Buscar cargo o empresa..." 
          className="w-full max-w-xl p-4 bg-white border-2 border-slate-200 outline-none focus:border-indigo-500 font-bold text-slate-700 transition-all"
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Botones de Categoría */}
      <div className="flex flex-wrap gap-2 mb-10">
        {categorias.map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveCat(cat)}
            className={`px-6 py-2 border-2 font-black text-[10px] uppercase tracking-widest transition-all
            ${activeCat === cat 
              ? 'bg-slate-900 border-slate-900 text-white' 
              : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-500'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid de Tarjetas Cuadradas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredJobs.length > 0 ? (
          filteredJobs.map(job => (
            <div key={job._id} className="bg-white border-2 border-slate-200 p-6 flex flex-col justify-between hover:border-indigo-500 transition-all shadow-sm">
              
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-slate-900 text-white text-[9px] font-black px-2 py-1 uppercase">
                    {job.category || 'General'}
                  </span>
                  <p className="text-emerald-600 font-black text-sm">{job.salary} Bs.</p>
                </div>

                <h2 className="text-xl font-black text-slate-800 leading-tight uppercase mb-1">
                  {job.title}
                </h2>
                
                <p className="text-indigo-600 font-black text-xs uppercase mb-1">
                   🏢 {job.companyName || "Empresa Confidencial"}
                </p>
                <p className="text-slate-400 font-bold text-[10px] uppercase mb-4">
                   📍 {job.city || "La Paz"}
                </p>

                <hr className="mb-4 border-slate-100" />

                <p className="text-slate-500 text-xs leading-relaxed mb-6 line-clamp-3">
                  {job.description || "Descripción no disponible para esta vacante."}
                </p>
              </div>

              <button className="w-full bg-slate-900 text-white py-3 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-colors border-2 border-slate-900">
                Postular ahora
              </button>
              
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 border-2 border-dashed border-slate-200">
            <p className="text-slate-300 font-black uppercase text-xs tracking-widest">No se encontraron resultados</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;