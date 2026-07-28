import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import useAuthStore from "../store/authStore";

const CompanyDashboard = () => {
  const { email } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-blue-950">Bienvenido, Empresa</h1>
          <p className="text-gray-400 mt-2">{email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/company/postulantes" className="group">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all border-2 border-transparent hover:border-blue-500 h-full">
              <div className="text-3xl mb-3">👥</div>
              <h2 className="text-xl font-black text-blue-900 mb-2">POSTULANTES</h2>
              <p className="text-gray-500 text-xs">Ve los candidatos disponibles y conecta con los que mejor se ajusten a tus vacantes.</p>
            </div>
          </Link>

          <Link to="/company/reportes" className="group">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all border-2 border-transparent hover:border-amber-500 h-full">
              <div className="text-3xl mb-3">📊</div>
              <h2 className="text-xl font-black text-amber-700 mb-2">REPORTES</h2>
              <p className="text-gray-500 text-xs">Consulta cómo va tu proceso: postulaciones, conexiones, rechazos y postulaciones sin responder.</p>
            </div>
          </Link>

          <Link to="/company/mi-empresa" className="group">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all border-2 border-transparent hover:border-green-500 h-full">
              <div className="text-3xl mb-3">🏢</div>
              <h2 className="text-xl font-black text-green-800 mb-2">MI EMPRESA</h2>
              <p className="text-gray-500 text-xs">Registra los datos de tu empresa: nombre, teléfonos, dirección y ubicación en el mapa.</p>
            </div>
          </Link>

          <Link to="/company/reclutar" className="group">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all border-2 border-transparent hover:border-purple-500 h-full">
              <div className="text-3xl mb-3">📢</div>
              <h2 className="text-xl font-black text-purple-800 mb-2">RECLUTAR</h2>
              <p className="text-gray-500 text-xs">Publica vacantes de empleo con requisitos específicos. Requiere datos de empresa registrados.</p>
            </div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default CompanyDashboard;
