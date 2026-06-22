import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const RegisterCandidate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    whatsappNumber: "",
    education: "",
    experienceYears: "",
    skills: "",
  });

  // Manejador de cambios en los inputs
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Preparamos el objeto JSON para DICALI
      // Los nombres de las llaves deben ser iguales a los de CandidateModel.java
      const data = {
        fullName: form.name,
        email: form.email.toLowerCase().trim(),
        whatsapp: form.whatsappNumber,
        education: form.education,
        experienceYears: parseInt(form.experienceYears) || 0,
        skills: form.skills.split(",").map((s) => s.trim()).filter((s) => s !== ""),
      };

      // 2. Enviamos la petición al backend Spring Boot (puerto 8080)
      const response = await axios.post(
        "http://localhost:8080/api/candidates/register",
        data
      );

      if (response.status === 200 || response.status === 201) {
        alert("¡Perfil creado exitosamente en DICALI!");
        // Guardamos el email en localStorage por si CandidateProfile lo necesita
        localStorage.setItem("candidateEmail", data.email);
        navigate("/profile"); 
      }
    } catch (error) {
      console.error("Error en el registro:", error);
      
      if (error.response?.status === 400) {
        alert("Error: El correo electrónico ya se encuentra registrado.");
      } else if (error.code === "ERR_NETWORK") {
        alert("Error de conexión: El servidor (puerto 8080) no responde. ¿Ya lo encendiste?");
      } else {
        alert("Ocurrió un error inesperado al conectar con el servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-2xl border border-gray-100">
        <h2 className="text-3xl font-black text-center mb-2 italic text-blue-900">
          REGISTRO DE TALENTO
        </h2>
        <p className="text-center text-gray-500 mb-8 uppercase text-xs tracking-widest font-bold">
          Únete a la red profesional DICALI
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre Completo */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-blue-600 ml-4 uppercase">Nombre Completo</label>
            <input
              name="name"
              type="text"
              placeholder="Ej. Marco Rodolfo Cortez"
              className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none transition-all"
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-blue-600 ml-4 uppercase">Correo Electrónico</label>
              <input
                name="email"
                type="email"
                placeholder="correo@ejemplo.com"
                className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                onChange={handleChange}
                required
              />
            </div>
            {/* WhatsApp */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-blue-600 ml-4 uppercase">WhatsApp</label>
              <input
                name="whatsappNumber"
                type="text"
                placeholder="Ej. 71289150"
                className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Formación */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-blue-600 ml-4 uppercase">Formación Académica</label>
            <input
              name="education"
              type="text"
              placeholder="Ej. Ingeniero en Sistemas"
              className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none transition-all"
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Años de Experiencia */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-blue-600 ml-4 uppercase">Años Exp.</label>
              <input
                name="experienceYears"
                type="number"
                placeholder="0"
                className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                onChange={handleChange}
                required
              />
            </div>
            {/* Habilidades */}
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-black text-blue-600 ml-4 uppercase">Habilidades (Separadas por comas)</label>
              <input
                name="skills"
                type="text"
                placeholder="java, react, mongodb"
                className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-4 bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-black transition-all shadow-lg active:scale-95 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "PROCESANDO..." : "CREAR MI PERFIL PROFESIONAL"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterCandidate;