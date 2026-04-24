import { useEffect, useState } from "react";
import axios from "axios";

const AuditCompanies = () => {
  const [companies, setCompanies] = useState([]);

  const fetchPending = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/companies/pending");
      setCompanies(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleVerify = async (id) => {
    try {
      await axios.put(`http://localhost:8080/api/companies/verify/${id}`);
      alert("Empresa verificada con éxito");
      fetchPending();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="px-4 pb-4 pt-24 max-w-5xl mx-auto">
      <h1 className="text-3xl font-black text-red-600 mb-8 uppercase">Auditoría: Verificación de NIT</h1>
      
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="p-4">Empresa</th>
              <th className="p-4">NIT</th>
              <th className="p-4">Representante</th>
              <th className="p-4">Acción</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-bold">{c.companyName}</td>
                <td className="p-4">{c.nit}</td>
                <td className="p-4">{c.representativeName}</td>
                <td className="p-4">
                  <button 
                    onClick={() => handleVerify(c.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors"
                  >
                    Verificar NIT
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {companies.length === 0 && (
          <p className="p-8 text-center text-gray-500 font-medium">No hay empresas pendientes de validación.</p>
        )}
      </div>
    </div>
  );
};

export default AuditCompanies;