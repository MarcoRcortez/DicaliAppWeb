import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 mt-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* COLUMNA 1: LOGO Y DESCRIPCIÓN */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="text-2xl font-black text-white tracking-tighter mb-4 block">
              DICALI<span className="text-blue-500">.</span>
            </Link>
            <p className="text-sm leading-relaxed">
              Plataforma inteligente de reclutamiento y auditoría de sistemas para el mercado laboral en La Paz, Bolivia.
            </p>
          </div>

          {/* COLUMNA 2: NAVEGACIÓN */}
          <div>
            <h4 className="text-white font-bold uppercase text-xs tracking-widest mb-6">Plataforma</h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="/jobs" className="hover:text-blue-400 transition-colors">Explorar Empleos</Link></li>
              <li><Link to="/register-talent" className="hover:text-blue-400 transition-colors">Postular mi Talento</Link></li>
              <li><Link to="/register-company" className="hover:text-blue-400 transition-colors">Registrar Empresa</Link></li>
            </ul>
          </div>

          {/* COLUMNA 3: SOPORTE Y LEGAL */}
          <div>
            <h4 className="text-white font-bold uppercase text-xs tracking-widest mb-6">Seguridad</h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="/login" className="hover:text-blue-400 transition-colors">Acceso Administrativo</Link></li>
              <li><span className="cursor-default">Verificación de NIT</span></li>
              <li><span className="cursor-default">Políticas de Auditoría</span></li>
            </ul>
          </div>

          {/* COLUMNA 4: CRÉDITOS ACADÉMICOS */}
          <div>
            <h4 className="text-white font-bold uppercase text-xs tracking-widest mb-6">Académico</h4>
            <p className="text-xs mb-2">Proyecto de Grado</p>
            <p className="text-white font-bold text-sm">Ingeniería de Sistemas</p>
            <p className="text-xs mt-4 italic text-gray-500">Universidad Boliviana de Informática</p>
          </div>
        </div>

        {/* LÍNEA FINAL */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] uppercase tracking-widest">
            © 2026 DICALI - Todos los derechos reservados
          </p>
          <div className="flex gap-6">
            <span className="text-[10px] font-black text-gray-600 uppercase">La Paz - Bolivia</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;