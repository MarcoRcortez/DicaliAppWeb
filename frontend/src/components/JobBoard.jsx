import React, { useState, useEffect } from 'react';
import axios from 'axios';
import JobCard from './JobCard';

const JobBoard = () => {
    const [jobs, setJobs] = useState([]);
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [search, setSearch] = useState("");
    const [activeCat, setActiveCat] = useState("Todos");

    // Categorías basadas en tu base de datos (puedes agregar más aquí)
    const categoriasDisponibles = ["Todos", "Ingeniería", "Marketing", "Diseño", "Salud"];

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await axios.get('http://localhost:8080/api/jobPosts/all');
                console.log("Datos recibidos:", res.data); // Para verificar en la consola (F12)
                setJobs(res.data);
                setFilteredJobs(res.data);
            } catch (err) {
                console.error("Error al conectar con la API:", err);
            }
        };
        fetchJobs();
    }, []);

    // Lógica de filtrado
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
        <div className="min-h-screen bg-slate-50 p-6 md:p-12">
            
            {/* --- SECCIÓN DE BÚSQUEDA (Visible) --- */}
            <div className="max-w-4xl mx-auto mb-12">
                <h1 className="text-4xl font-black text-slate-900 italic text-center mb-8 uppercase tracking-tighter">
                    Encuentra tu próximo <span className="text-indigo-600">empleo</span>
                </h1>
                
                <div className="bg-white p-4 rounded-[2rem] shadow-2xl flex items-center border-2 border-transparent focus-within:border-indigo-400 transition-all">
                    <span className="ml-4 text-slate-400 text-xl">🔍</span>
                    <input 
                        type="text" 
                        placeholder="Puesto, empresa o palabra clave..." 
                        className="flex-1 p-3 outline-none text-slate-700 font-bold bg-transparent"
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* --- BOTONES DE CATEGORÍA (Corregido según 'category' de tu DB) --- */}
            <div className="flex flex-wrap justify-center gap-3 mb-16">
                {categoriasDisponibles.map(cat => (
                    <button 
                        key={cat}
                        onClick={() => setActiveCat(cat)}
                        className={`px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-all shadow-lg 
                        ${activeCat === cat ? 'bg-indigo-600 text-white scale-110' : 'bg-white text-slate-400 hover:bg-slate-100 hover:text-indigo-500'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* --- LISTADO DE TARJETAS --- */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {filteredJobs.length > 0 ? (
                    filteredJobs.map(job => (
                        <JobCard key={job._id} job={job} />
                    ))
                ) : (
                    <div className="col-span-full text-center py-20 bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
                        <div className="text-6xl mb-4">📂</div>
                        <p className="text-slate-400 font-black italic uppercase tracking-widest">
                            No hay vacantes en {activeCat} que coincidan con tu búsqueda
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobBoard;