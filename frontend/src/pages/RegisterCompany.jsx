import { useState } from "react";
import axios from "axios";

const RegisterCompany = () => {
  const [form, setForm] = useState({
    companyName: "",
    nit: "",
    representativeName: "",
    city: "La Paz"
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8080/api/companies/register", form);
      alert("Solicitud de registro enviada. DICALI verificará su NIT en breve.");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex items-center justify-center px-4 pb-4 pt-24">
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
        <h2 className="text-2xl font-black text-blue-900 mb-6 uppercase tracking-tight">Registro de Empresa</h2>
        <div className="space-y-4">
          <input type="text" name="companyName" placeholder="Razón Social / Nombre" onChange={handleChange} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
          <input type="text" name="nit" placeholder="Número de NIT" onChange={handleChange} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
          <input type="text" name="representativeName" placeholder="Representante Legal" onChange={handleChange} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
          <select name="city" onChange={handleChange} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="La Paz">La Paz</option>
            <option value="Cochabamba">Cochabamba</option>
            <option value="Santa Cruz">Santa Cruz</option>
          </select>
          <button type="submit" className="w-full bg-blue-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-all">
            Enviar para Verificación
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterCompany;