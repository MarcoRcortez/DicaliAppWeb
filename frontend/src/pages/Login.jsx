import React from 'react';
import { Link } from 'react-router-dom';

const Login = () => {
  return (
    <div className="min-h-screen pt-24 pb-12 flex flex-col justify-center bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Branding Central */}
        <div className="flex flex-col items-center mb-6">
          <img 
            src="/logo-2.png" 
            alt="DICALI Icono" 
            className="w-20 h-20 mb-4 drop-shadow-md"
          />
          <h2 className="text-center text-3xl font-extrabold text-blue-900">
            Bienvenido de nuevo
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Accede a la plataforma de auditoría de talento
          </p>
        </div>

        {/* Tarjeta de Login */}
        <div className="bg-white py-8 px-4 shadow-xl border border-gray-100 rounded-2xl sm:px-10">
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
              <input 
                type="email" 
                className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="ejemplo@correo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <input 
                type="password" 
                className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
            >
              INICIAR SESIÓN
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿No tienes cuenta?{' '}
              <Link to="/register-candidate" className="font-bold text-blue-600 hover:text-blue-500">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;