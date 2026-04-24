import { useState } from "react";
import axios from "axios";

const UserProfile = () => {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState(null);

  const handleSearch = async () => {
    try {
      const res = await axios.get(`http://localhost:8080/api/candidates/profile/${email}`);
      if (res.data) {
        setUser(res.data);
      } else {
        alert("No se encontró ningún perfil con ese correo.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="px-4 pb-12 pt-32 max-w-4xl mx-auto">
      {!user ? (
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center">
          <h2 className="text-3xl font-black text-blue-900 mb-6 uppercase italic">Mi Perfil Profesional</h2>
          <p className="text-gray-500 mb-6">Ingresa tu correo para visualizar tu CV Digital</p>
          <div className="flex gap-2 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="tu@correo.com" 
              className="flex-1 border-2 p-3 rounded-xl outline-none focus:border-blue-500"
              onChange={(e) => setEmail(e.target.value)}
            />
            <button 
              onClick={handleSearch}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-all"
            >
              Cargar
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-blue-900 h-32 w-full"></div>
          <div className="px-8 pb-8">
            <div className="relative -top-12 flex flex-col md:flex-row md:items-end gap-6">
              <div className="w-32 h-32 bg-blue-500 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-white text-5xl font-black">
                {user.name.charAt(0)}
              </div>
              <div className="md:mb-4">
                <h1 className="text-4xl font-black text-gray-900 uppercase">{user.name}</h1>
                <p className="text-blue-600 font-bold">{user.education}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <section>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Habilidades Técnicas</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((s, i) => (
                      <span key={i} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold border border-gray-200">
                        {s}
                      </span>
                    ))}
                  </div>
                </section>
                
                <section className="bg-blue-50 p-6 rounded-2xl">
                  <h3 className="text-blue-900 font-bold mb-2">Resumen de Experiencia</h3>
                  <p className="text-blue-800 text-sm">
                    Actualmente cuento con <span className="font-black">{user.experienceYears} años</span> de experiencia profesional en el sector tecnológico de Bolivia.
                  </p>
                </section>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase">Contacto</h3>
                  <p className="text-gray-500 text-sm mb-2">📧 {user.email}</p>
                  <p className="text-gray-500 text-sm">📱 {user.whatsappNumber}</p>
                </div>
                <button 
                  onClick={() => window.open(`http://localhost:8080/api/candidates/download/${user.email}`)}
                  className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                >
                  📥 Descargar CV (PDF)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;