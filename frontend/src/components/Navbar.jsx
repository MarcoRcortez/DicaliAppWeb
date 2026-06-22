import { Link, useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../store/authStore";

const Navbar = () => {
  const { token, role, email, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // No mostrar en el AdminPanel (tiene su propio sidebar)
  if (location.pathname === "/admin") return null;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y Nombre */}
          <Link to={token ? (role === "CANDIDATE" ? "/candidate" : role === "RECRUITER" ? "/company" : "/admin") : "/"} className="flex items-center gap-3 group">
            <img src="/logo.png" alt="DICALI" className="h-10 w-auto transition-transform group-hover:scale-105" />
            <span className="text-2xl font-black text-blue-900 tracking-tighter">
              DICALI<span className="text-blue-500">.</span>
            </span>
          </Link>

          {/* Navegación según estado */}
          <div className="flex items-center gap-2 md:gap-6">
            {!token ? (
              <>
                {/* Sin sesión */}
                <Link to="/login/candidate" className={`text-sm font-semibold transition-colors ${isActive("/login/candidate") ? "text-blue-600" : "text-gray-500 hover:text-blue-900"}`}>
                  SOY POSTULANTE
                </Link>
                <Link to="/login/company" className={`text-sm font-semibold transition-colors ${isActive("/login/company") ? "text-blue-600" : "text-gray-500 hover:text-blue-900"}`}>
                  SOY EMPRESA
                </Link>
                <Link to="/login/admin" className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors">
                  Admin
                </Link>
              </>
            ) : role === "CANDIDATE" ? (
              <>
                {/* Candidato autenticado */}
                <Link to="/candidate" className={`text-sm font-semibold transition-colors ${isActive("/candidate") ? "text-blue-600" : "text-gray-500 hover:text-blue-900"}`}>
                  Inicio
                </Link>
                <Link to="/candidate/empleos" className={`text-sm font-semibold transition-colors ${isActive("/candidate/empleos") ? "text-blue-600" : "text-gray-500 hover:text-blue-900"}`}>
                  Empleos
                </Link>
                <Link to="/candidate/curriculum" className={`text-sm font-semibold transition-colors ${isActive("/candidate/curriculum") ? "text-blue-600" : "text-gray-500 hover:text-blue-900"}`}>
                  Mi CV
                </Link>
                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
                  <span className="text-xs text-gray-400 hidden md:inline">{email}</span>
                  <button onClick={handleLogout} className="bg-red-50 text-red-500 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-all">
                    Salir
                  </button>
                </div>
              </>
            ) : role === "RECRUITER" ? (
              <>
                {/* Empresa autenticada */}
                <Link to="/company" className={`text-sm font-semibold transition-colors ${isActive("/company") ? "text-blue-600" : "text-gray-500 hover:text-blue-900"}`}>
                  Inicio
                </Link>
                <Link to="/company/postulantes" className={`text-sm font-semibold transition-colors ${isActive("/company/postulantes") ? "text-blue-600" : "text-gray-500 hover:text-blue-900"}`}>
                  Postulantes
                </Link>
                <Link to="/company/mi-empresa" className={`text-sm font-semibold transition-colors ${isActive("/company/mi-empresa") ? "text-blue-600" : "text-gray-500 hover:text-blue-900"}`}>
                  Mi Empresa
                </Link>
                <Link to="/company/reclutar" className={`text-sm font-semibold transition-colors ${isActive("/company/reclutar") ? "text-blue-600" : "text-gray-500 hover:text-blue-900"}`}>
                  Reclutar
                </Link>
                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
                  <span className="text-xs text-gray-400 hidden md:inline">{email}</span>
                  <button onClick={handleLogout} className="bg-red-50 text-red-500 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-all">
                    Salir
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Admin (solo se muestra en login, no en /admin porque se oculta arriba) */}
                <span className="text-xs text-gray-400">{email}</span>
                <button onClick={handleLogout} className="bg-red-50 text-red-500 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-all">
                  Salir
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
