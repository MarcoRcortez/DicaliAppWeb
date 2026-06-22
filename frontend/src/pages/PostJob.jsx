import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PostJob = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({
    companyName: '', // Cambiado de companyId a companyName para que coincida con tu DB
    title: '', 
    category: 'Sistemas', 
    salary: '', 
    city: 'La Paz', // Agregamos ciudad por defecto
    description: ''
  });

  useEffect(() => {
    axios.get('http://localhost:8080/api/companies/all')
      .then(res => setCompanies(res.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Enviamos el formulario directamente
      await axios.post('http://localhost:8080/api/jobPosts/register', form);
      alert("¡Oferta publicada con éxito!");
      navigate('/jobs'); // O la ruta donde tengas tu JobBoard
    } catch (err) {
      alert(err.response?.data?.message || "Error al publicar");
    }
  };

  return (
    <div className="pt-32 p-8 max-w-2xl mx-auto">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100">
        <h2 className="text-3xl font-black text-indigo-900 mb-6 uppercase italic tracking-tighter">Publicar Vacante</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Empresa que publica</label>
            <select 
              className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
              onChange={e => setForm({...form, companyName: e.target.value})}
              required
            >
              <option value="">-- Seleccionar Empresa --</option>
              {companies.map(c => (
                <option key={c._id} value={c.companyName}>{c.companyName}</option>
              ))}
            </select>
          </div>

          <input 
            placeholder="Título del puesto (Ej: Desarrollador Flutter)" 
            className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
            onChange={e => setForm({...form, title: e.target.value})}
            required 
          />

          <div className="grid grid-cols-2 gap-4">
            <input 
              type="number" placeholder="Sueldo (Bs)" 
              className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
              onChange={e => setForm({...form, salary: e.target.value})}
              required 
            />
            <select 
              className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
              onChange={e => setForm({...form, category: e.target.value})}
            >
              <option value="Sistemas">Sistemas</option>
              <option value="Administración">Administración</option>
              <option value="Ventas">Ventas</option>
              <option value="Marketing">Marketing</option>
              <option value="Diseño">Diseño</option>
            </select>
          </div>

          <input 
            placeholder="Ciudad (Ej: La Paz)" 
            className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
            onChange={e => setForm({...form, city: e.target.value})}
            required 
          />

          <textarea 
            placeholder="Descripción detallada de la vacante..." 
            className="w-full p-4 bg-slate-50 rounded-2xl outline-none h-32 font-medium text-slate-600 focus:ring-2 focus:ring-indigo-500"
            onChange={e => setForm({...form, description: e.target.value})}
            required
          ></textarea>

          <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest text-sm">
            PUBLICAR OFERTA AHORA
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostJob;