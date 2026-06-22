import React, { useState } from "react";
import axios from "axios";

const UserProfile = () => {
  const [emailBusqueda, setEmailBusqueda] = useState("");
  const [perfil, setPerfil] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCargarPerfil = async () => {
    if (!emailBusqueda.trim()) {
      setError("Por favor, ingresa un correo electrónico.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setPerfil(null);

      // Sincronizado con la ruta del CandidateController en Spring Boot
      const response = await axios.get(
        `http://localhost:8080/api/candidates/profile/${emailBusqueda.trim()}`
      );
      
      setPerfil(response.data);
    } catch (err) {
      console.error("Error al buscar perfil:", err);
      // Captura el mensaje de error enviado por el backend o usa uno por defecto
      const msg = err.response?.status === 404 
        ? "No se encontró ningún perfil con ese correo" 
        : "Error de conexión con el servidor";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 min-h-screen bg-gray-50 flex flex-col items-center p-6">
      <div className="bg-white p-8 rounded-[2rem] shadow-xl w-full max-w-md text-center">
        <h2 className="text-3xl font-black text-blue-900 italic mb-6 uppercase">
          Mi Perfil Profesional
        </h2>
        <p className="text-gray-500 mb-6">Visualiza tu CV Digital en DICALI</p>
        
        <div className="flex gap-2 mb-6">
          <input
            type="email"
            placeholder="tu-correo@gmail.com"
            className="flex-1 p-4 bg-gray-100 rounded-2xl outline-none border-2 border-transparent focus:border-blue-500 transition-all"
            value={emailBusqueda}
            onChange={(e) => setEmailBusqueda(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCargarPerfil()}
          />
          <button 
            onClick={handleCargarPerfil}
            disabled={loading}
            className={`bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-black transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? "..." : "Cargar"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-xl font-bold mb-4 border border-red-100">
            {error}
          </div>
        )}

        {perfil && (
          <div className="text-left bg-blue-50 p-6 rounded-3xl border border-blue-100 animate-fade-in shadow-inner">
            {/* CORRECCIÓN: Usamos fullName y whatsapp que coinciden con CandidateModel.java */}
            <h3 className="text-xl font-black text-blue-900 uppercase mb-4 border-b border-blue-200 pb-2">
              {perfil.fullName || "Sin nombre"}
            </h3>
            
            <div className="space-y-3 text-sm text-blue-800">
              <p><strong>📧 Email:</strong> {perfil.email}</p>
              <p><strong>📱 WhatsApp:</strong> {perfil.whatsapp}</p>
              <p><strong>🎓 Título:</strong> {perfil.education}</p>
              <p><strong>⏳ Experiencia:</strong> {perfil.experienceYears} años</p>
              
              <div className="pt-2">
                <strong className="block mb-2 text-xs uppercase tracking-widest text-blue-400">Habilidades Técnicas</strong>
                <div className="flex flex-wrap gap-2">
                  {perfil.skills && perfil.skills.length > 0 ? (
                    perfil.skills.map((skill, index) => (
                      <span key={index} className="bg-white px-3 py-1 rounded-full text-[10px] font-black text-blue-600 shadow-sm border border-blue-100">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 italic">No especificadas</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;