import { useEffect, useState } from "react";
import axios from "axios";

const AdminJobs = () => {
  const [jobs, setJobs] = useState([]);

  const fetchJobs = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/jobPosts/all");
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("¿Está seguro de eliminar esta vacante?")) {
      try {
        await axios.delete(`http://localhost:8080/api/jobPosts/delete/${id}`);
        fetchJobs();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="px-4 pb-4 pt-24 max-w-6xl mx-auto">
      <h1 className="text-3xl font-black text-gray-900 mb-8 uppercase">Gestión de Vacantes</h1>
      <div className="grid gap-4">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white p-6 rounded-2xl shadow-sm border flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-blue-900">{job.profile}</h3>
              <p className="text-gray-500 text-sm">NIT Empresa: {job.nit}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleDelete(job.id)}
                className="bg-red-100 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-600 hover:text-white transition-all"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminJobs;