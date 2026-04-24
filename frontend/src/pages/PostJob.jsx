import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PostJob = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({
    companyId: '', title: '', category: 'Sistemas', salary: '', description: ''
  });

  useEffect(() => {
    // Cargamos las empresas para simular el "Login"
    axios.get('http://localhost:8080/api/companies/all')
      .then(res => setCompanies(res.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8080/api/jobPosts/register', form);
      alert(res.data.message);
      navigate('/jobs');
    } catch (err) {
      alert(err.response?.data?.message || "Error al publicar");
    }
  };

  return (
    <div className="pt-32 p-8 max-w-2xl mx-auto">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100">
        <h2 className="text-3xl font-black text-blue-900 mb-6 uppercase">Publicar Vacante</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Selecciona tu Empresa</label>
            <select 
              className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500"
              onChange={e => setForm({...form, companyId: e.target.value})}
              required
            >
              <option value="">-- Seleccionar --</option>
              {companies.map(c => (
                <option key={c._id} value={c._id}>{c.companyName} ({c.status})</option>
              ))}
            </select>
          </div>

          <input 
            placeholder="Título del puesto" 
            className="w-full p-4 bg-gray-50 rounded-2xl outline-none"
            onChange={e => setForm({...form, title: e.target.value})}
            required 
          />

          <div className="grid grid-cols-2 gap-4">
            <input 
              type="number" placeholder="Sueldo (Bs)" 
              className="w-full p-4 bg-gray-50 rounded-2xl outline-none"
              onChange={e => setForm({...form, salary: e.target.value})}
              required 
            />
            <select 
              className="w-full p-4 bg-gray-50 rounded-2xl outline-none"
              onChange={e => setForm({...form, category: e.target.value})}
            >
              <option value="Sistemas">Sistemas</option>
              <option value="Administración">Administración</option>
              <option value="Ventas">Ventas</option>
            </select>
          </div>

          <textarea 
            placeholder="Descripción de la vacante..." 
            className="w-full p-4 bg-gray-50 rounded-2xl outline-none h-32"
            onChange={e => setForm({...form, description: e.target.value})}
            required
          ></textarea>

          <button type="submit" className="w-full bg-blue-900 text-white py-5 rounded-3xl font-black hover:bg-black transition-all">
            PUBLICAR OFERTA
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostJob;