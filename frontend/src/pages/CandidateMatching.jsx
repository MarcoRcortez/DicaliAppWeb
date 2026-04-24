import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import LoadingSpinner from "../components/LoadingSpinner";

const CandidateMatching = () => {
  const { jobId } = useParams();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/candidates/match/${jobId}`);
        setMatches(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [jobId]);

  return (
    <div className="px-4 pb-12 pt-32 max-w-4xl mx-auto text-center">
      <h2 className="text-3xl font-black text-blue-900 mb-8 uppercase italic">Análisis de Compatibilidad</h2>
      
      {loading ? (
        <div className="bg-white p-12 rounded-3xl shadow-xl">
          <LoadingSpinner />
          <p className="text-gray-400 text-sm mt-2 font-medium">Nuestro algoritmo está evaluando perfiles...</p>
        </div>
      ) : (
        <div className="grid gap-6 text-left">
          {matches.map((m, index) => (
            <div key={index} className="bg-white p-8 rounded-3xl shadow-lg border-l-8 border-green-500 flex justify-between items-center transition-all hover:scale-[1.02]">
              <div>
                <h3 className="text-2xl font-black text-gray-800">{m.candidate.name}</h3>
                <p className="text-gray-500 font-bold">{m.candidate.education}</p>
                <div className="flex gap-2 mt-3">
                  {m.candidate.skills.map((s, i) => (
                    <span key={i} className="bg-blue-50 text-blue-600 text-[10px] px-2 py-1 rounded font-black uppercase">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-center">
                <span className="block text-4xl font-black text-green-600">{m.matchPercentage.toFixed(0)}%</span>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Match IA</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CandidateMatching;