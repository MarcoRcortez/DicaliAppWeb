import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const RegisterCandidate = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    whatsappNumber: "",
    education: "",
    experienceYears: "",
    skills: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataParaEnviar = {
        fullName: form.name,
        email: form.email,
        whatsapp: form.whatsappNumber,
        education: form.education,
        experienceYears: Number(form.experienceYears),
        skills: form.skills.split(",").map((s) => s.trim()),
      };

      await axios.post("http://localhost:8080/api/candidates/register", dataParaEnviar);
      alert("Perfil de Talento Creado");
      navigate("/jobs");
    } catch (error) {
      alert("Error al conectar con el servidor");
    }
  };

  return (
    <div className="pt-24 min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-2xl border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-black text-blue-900 italic uppercase">Registro de Talento</h2>
          <p className="text-gray-400 font-medium mt-2">Únete a la base de datos auditada de DICALI</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase ml-2">Nombre Completo</label>
            <input
              name="name"
              type="text"
              placeholder="Ej: Miguel Alcaraz"
              className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-2">Correo Electrónico</label>
              <input
                name="email"
                type="email"
                placeholder="miguel@gmail.com"
                className="w-full p-4 bg-gray-50 rounded-2xl outline-none"
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-2">WhatsApp</label>
              <input
                name="whatsappNumber"
                type="text"
                placeholder="60542309"
                className="w-full p-4 bg-gray-50 rounded-2xl outline-none"
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase ml-2">Formación Académica</label>
            <input
              name="education"
              type="text"
              placeholder="Ej: Diseñador Gráfico"
              className="w-full p-4 bg-gray-50 rounded-2xl outline-none"
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-2">Años Exp.</label>
              <input
                name="experienceYears"
                type="number"
                placeholder="4"
                className="w-full p-4 bg-gray-50 rounded-2xl outline-none"
                onChange={handleChange}
                required
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-2">Habilidades (Separa por comas)</label>
              <input
                name="skills"
                type="text"
                placeholder="photoshop, diseño web, illustrator"
                className="w-full p-4 bg-gray-50 rounded-2xl outline-none"
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black text-lg hover:bg-black transition-all transform hover:scale-[1.02] shadow-lg mt-4"
          >
            CREAR MI PERFIL PROFESIONAL
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterCandidate;