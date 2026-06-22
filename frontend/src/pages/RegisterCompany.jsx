import React, { useState } from 'react';
import axios from 'axios';

const RegisterCompany = () => {
    const [formData, setFormData] = useState({
        companyName: '',
        nit: '',
        representativeName: '', // Nombre exacto del modelo Java
        city: 'La Paz'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8080/api/companies/register', formData);
            alert("¡Solicitud enviada exitosamente!");
            setFormData({ companyName: '', nit: '', representativeName: '', city: 'La Paz' });
        } catch (error) {
            alert("Error al registrar empresa");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <form onSubmit={handleSubmit} className="bg-white p-12 rounded-[3rem] shadow-2xl w-full max-w-lg space-y-4">
                <h2 className="text-2xl font-black text-blue-900 mb-6 uppercase italic text-center">Registro de Empresa</h2>
                <input type="text" placeholder="Nombre de la Empresa" className="w-full p-4 bg-slate-100 rounded-2xl" 
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})} value={formData.companyName} required />
                <input type="text" placeholder="NIT" className="w-full p-4 bg-slate-100 rounded-2xl" 
                    onChange={(e) => setFormData({...formData, nit: e.target.value})} value={formData.nit} required />
                {/* CAMBIO CLAVE: name="representativeName" */}
                <input type="text" placeholder="Representante Legal" className="w-full p-4 bg-slate-100 rounded-2xl" 
                    onChange={(e) => setFormData({...formData, representativeName: e.target.value})} value={formData.representativeName} required />
                <select className="w-full p-4 bg-slate-100 rounded-2xl" onChange={(e) => setFormData({...formData, city: e.target.value})}>
                    <option value="La Paz">La Paz</option>
                    <option value="Santa Cruz">Santa Cruz</option>
                </select>
                <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-blue-700">
                    Enviar para Verificación
                </button>
            </form>
        </div>
    );
};

export default RegisterCompany;