import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full z-50 glass bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y Nombre */}
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src="/logo.png" 
              alt="DICALI Logo" 
              className="h-10 w-auto transition-transform group-hover:scale-105" 
            />
            <span className="text-2xl font-black text-blue-900 tracking-tighter">
              DICALI<span className="text-blue-500">.</span>
            </span>
          </Link>

          {/* Menú de Navegación */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/jobs" className="text-sm font-semibold text-gray-600 hover:text-blue-900 transition-colors">EMPLEOS</Link>
            
            {/* CORRECCIÓN 1: Cambiamos /postular por /register-company */}
            <Link to="/register-company" className="text-sm font-semibold text-gray-600 hover:text-blue-900 transition-colors">SOY EMPRESA</Link>
            
            <Link to="/profile" className="text-sm font-semibold text-gray-600 hover:text-blue-900 transition-colors">MI PERFIL</Link>
            
            {/* CORRECCIÓN 2: Apuntamos INGRESAR al Dashboard Administrativo */}
            <Link 
              to="/admin" 
              className="bg-blue-900 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20"
            >
              INGRESAR
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;