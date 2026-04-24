import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Toast from "../components/Toast";

const CreatePost = () => {
  const [form, setForm] = useState({
    profile: "", desc: "", exp: 0, techs: "", whatsappLink: "", nit: "", category: "Sistemas"
  });
  const [isValidated, setIsValidated] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const handleVerify = async () => {
    try {
      const res = await axios.post("http://localhost:8080/api/companies/verify-nit", form.nit, {
        headers: { "Content-Type": "text/plain" }
      });
      if (res.data) {
        setIsValidated(true);
        setToast({ message: "NIT verificado correctamente", type: "success" });
      } else {
        setToast({ message: "La empresa no está verificada en DICALI", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Error al conectar con el servidor", type: "error" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidated) return;

    try {
      const postData = { ...form, techs: form.techs.split(",").map(t => t.trim()) };
      await axios.post("http://localhost:8080/api/jobPosts/add", postData);
      setToast({ message: "Vacante publicada con éxito", type: "success" });
      setTimeout(() => navigate("/jobs"), 2000);
    } catch (err) {
      setToast({ message: "Error al publicar vacante", type: "error" });
    }
  };

  return (
    <div className="px-4 pb-12 pt-32 max-w-2xl mx-auto">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
        <h2 className="text-3xl font-black text-blue-900 mb-6 uppercase">Nueva Vacante</h2>
        
        <div className="flex gap-2 mb-6">
          <input 
            type="text" 
            placeholder="Ingrese NIT de la empresa" 
            className="flex-1 border-2 border-gray-50 p-4 rounded-xl outline-none focus:border-blue-500 bg-gray-50 font-mono"
            onChange={(e) => setForm({...form, nit: e.target.value})}
          />
          <button 
            onClick={handleVerify}
            className="bg-gray-900 text-white px-6 rounded-xl font-bold hover:bg-black transition-all"
          >
            Verificar
          </button>
        </div>

        <form onSubmit={handleSubmit} className={isValidated ? "space-y-4" : "opacity-30 pointer-events-none space-y-4"}>
          <select className="w-full border-2 border-gray-50 p-4 rounded-xl font-bold bg-gray-50 text-gray-600 outline-none" onChange={(e) => setForm({...form, category: e.target.value})}>
            <option value="Sistemas">Sistemas / TI</option>
            <option value="Auditoría">Auditoría / Finanzas</option>
            <option value="Administración">Administración</option>
            <option value="Ventas">Ventas / Marketing</option>
          </select>
          <input type="text" placeholder="Cargo" className="w-full border-2 border-gray-50 p-4 rounded-xl outline-none" onChange={(e) => setForm({...form, profile: e.target.value})} required />
          <textarea placeholder="Descripción..." className="w-full border-2 border-gray-50 p-4 rounded-xl h-32" onChange={(e) => setForm({...form, desc: e.target.value})} required></textarea>
          <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all">
            PUBLICAR AHORA
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;