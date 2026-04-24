import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CompanyPanel = () => {
  const [talentos, setTalentos] = useState([]);
  const [activeTab, setActiveTab] = useState('talento');

  useEffect(() => {
    // La empresa consume los datos que los candidatos subieron
    axios.get('http://localhost:8080/api/candidates/all').then(res => setTalentos(res.data));
  }, []);

  return (
    <div className="pt-28 px-10">
      <h1 className="text-4xl font-black text-blue-900 italic mb-8">PANEL EMPRESARIAL</h1>
      
      <div className="flex gap-4 mb-10">
        <button onClick={() => setActiveTab('talento')} className={`px-6 py-3 rounded-full font-bold ${activeTab === 'talento' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Ver Talento Disponible</button>
        <button onClick={() => setActiveTab('publicar')} className={`px-6 py-3 rounded-full font-bold ${activeTab === 'publicar' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Publicar Empleo</button>
      </div>

      {activeTab === 'talento' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {talentos.map(t => (
            <div key={t._id} className="bg-white p-6 rounded-[2rem] shadow-lg border border-gray-50">
              <span className="text-blue-500 font-bold text-xs uppercase">Currículum Vitae</span>
              <h3 className="text-xl font-black mt-2">{t.fullName}</h3>
              <p className="text-gray-500 text-sm mb-4">{t.education}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {t.skills.map(s => <span className="bg-blue-50 text-blue-700 text-[10px] px-3 py-1 rounded-full font-bold">{s}</span>)}
              </div>
              <a href={`https://wa.me/${t.whatsapp}`} className="block text-center bg-black text-white py-3 rounded-2xl font-bold hover:bg-green-600 transition-colors">Contactar</a>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-[2rem] shadow-xl max-w-xl">
            {/* Aquí va el formulario de publicación de vacante */}
            <p className="text-gray-400 font-medium">Formulario de Publicación para Empresas Auditadas</p>
        </div>
      )}
    </div>
  );
};

export default CompanyPanel;