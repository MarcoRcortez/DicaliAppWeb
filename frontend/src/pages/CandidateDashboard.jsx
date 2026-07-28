import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import useAuthStore from "../store/authStore";

const CandidateDashboard = () => {
  const { email } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-blue-950">Bienvenido, Postulante</h1>
          <p className="text-gray-400 mt-2">{email}</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Link to="/candidate/empleos" className="group">
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all border-2 border-transparent hover:border-blue-500">
              <div className="text-4xl mb-4">💼</div>
              <h2 className="text-2xl font-black text-blue-900 mb-2">EMPLEOS</h2>
              <p className="text-gray-500 text-sm">Explora las vacantes disponibles y revisa tus conexiones con empresas. Si una empresa está interesada en ti, lo verás aquí.</p>
            </div>
          </Link>

          <Link to="/candidate/curriculum" className="group">
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all border-2 border-transparent hover:border-green-500">
              <div className="text-4xl mb-4">📄</div>
              <h2 className="text-2xl font-black text-green-800 mb-2">MI CURRICULUM</h2>
              <p className="text-gray-500 text-sm">Llena tu curriculum digital con tus datos personales, experiencia, habilidades y educación. Podrás exportarlo en PDF.</p>
            </div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default CandidateDashboard;
