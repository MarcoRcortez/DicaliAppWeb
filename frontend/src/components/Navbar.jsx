import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { getCandidateProfile, getConfirmedMatchesCandidate } from "../api/api";

// Enlaces visibles según el estado de sesión / rol
const getLinks = (token, role) => {
  if (!token) {
    return [
      { to: "/login/candidate", label: "SOY POSTULANTE" },
      { to: "/login/company", label: "SOY EMPRESA" },
      { to: "/login/admin", label: "Admin", subtle: true },
    ];
  }
  if (role === "CANDIDATE") {
    return [
      { to: "/candidate", label: "Inicio" },
      { to: "/candidate/empleos", label: "Empleos", badge: true },
      { to: "/candidate/curriculum", label: "Mi CV" },
    ];
  }
  if (role === "RECRUITER") {
    return [
      { to: "/company", label: "Inicio" },
      { to: "/company/postulantes", label: "Postulantes" },
      { to: "/company/mi-empresa", label: "Mi Empresa" },
      { to: "/company/reclutar", label: "Reclutar" },
    ];
  }
  return []; // ADMIN: solo email + Salir
};

const MatchBadge = ({ count }) =>
  count > 0 ? (
    <span
      title={`Tienes ${count} conexión(es) con empresas`}
      className="bg-green-500 text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center"
    >
      {count}
    </span>
  ) : null;

const Navbar = () => {
  const { token, role, email, userId, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [matchCount, setMatchCount] = useState(0);
  const [open, setOpen] = useState(false);

  // Contador de matches confirmados del candidato (se carga una vez)
  useEffect(() => {
    if (!token || role !== "CANDIDATE" || !userId) { setMatchCount(0); return; }
    let cancelado = false;
    (async () => {
      try {
        const perfil = await getCandidateProfile(userId);
        const res = await getConfirmedMatchesCandidate(perfil.data.id);
        if (!cancelado) setMatchCount(res.data.length);
      } catch { /* sin perfil o sin matches todavía */ }
    })();
    return () => { cancelado = true; };
  }, [token, role, userId, location.pathname]);

  // Cerrar el menú móvil al navegar
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Cerrar con Escape mientras está abierto
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // No mostrar en el AdminPanel (tiene su propio sidebar)
  if (location.pathname === "/admin") return null;

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;
  const links = getLinks(token, role);
  const homePath = token ? (role === "CANDIDATE" ? "/candidate" : role === "RECRUITER" ? "/company" : "/admin") : "/";

  const desktopLinkClass = (link) =>
    link.subtle
      ? "text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
      : `text-sm font-semibold transition-colors flex items-center gap-1.5 ${isActive(link.to) ? "text-blue-600" : "text-gray-500 hover:text-blue-900"}`;

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo y Nombre */}
            <Link to={homePath} className="flex items-center gap-3 group shrink-0">
              <img src="/logo.png" alt="DICALI" className="h-10 w-auto transition-transform group-hover:scale-105" />
              <span className="text-2xl font-black text-blue-900 tracking-tighter">
                DICALI<span className="text-blue-500">.</span>
              </span>
            </Link>

            {/* Escritorio: barra horizontal */}
            <div className="hidden md:flex items-center gap-6">
              {links.map((link) => (
                <Link key={link.to} to={link.to} className={desktopLinkClass(link)}>
                  {link.label}
                  {link.badge && <MatchBadge count={matchCount} />}
                </Link>
              ))}
              {token && (
                <div className={`flex items-center gap-3 ${links.length ? "ml-4 pl-4 border-l border-gray-200" : ""}`}>
                  <span className="text-xs text-gray-400">{email}</span>
                  <button onClick={handleLogout} className="bg-red-50 text-red-500 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-all">
                    Salir
                  </button>
                </div>
              )}
            </div>

            {/* Móvil: botón hamburguesa */}
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              className="md:hidden relative w-11 h-11 rounded-xl flex items-center justify-center text-blue-900 hover:bg-blue-50 transition-colors"
            >
              <span className="sr-only">Menú</span>
              <span className="relative block w-6 h-5">
                <span className={`absolute left-0 top-0 h-0.5 w-6 rounded-full bg-current transition-all duration-300 motion-reduce:transition-none ${open ? "translate-y-[9px] rotate-45" : ""}`} />
                <span className={`absolute left-0 top-[9px] h-0.5 w-6 rounded-full bg-current transition-all duration-300 motion-reduce:transition-none ${open ? "opacity-0 scale-x-0" : ""}`} />
                <span className={`absolute left-0 top-[18px] h-0.5 w-6 rounded-full bg-current transition-all duration-300 motion-reduce:transition-none ${open ? "-translate-y-[9px] -rotate-45" : ""}`} />
              </span>
            </button>
          </div>
        </div>

        {/* Móvil: panel desplegable */}
        <div
          id="mobile-menu"
          inert={!open}
          aria-hidden={!open}
          className={`md:hidden grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
        >
          <div className="overflow-hidden">
            <div className="px-4 pb-4 pt-1 flex flex-col gap-1">
              {links.map((link, i) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  style={{ transitionDelay: open ? `${80 + i * 40}ms` : "0ms" }}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all duration-300 motion-reduce:transition-none ${
                    open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
                  } ${
                    link.subtle
                      ? "text-sm text-gray-400 hover:bg-gray-50"
                      : isActive(link.to)
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-50 hover:text-blue-900"
                  }`}
                >
                  {link.label}
                  {link.badge && <MatchBadge count={matchCount} />}
                </Link>
              ))}

              {token && (
                <div
                  style={{ transitionDelay: open ? `${80 + links.length * 40}ms` : "0ms" }}
                  className={`mt-2 pt-3 border-t border-gray-100 flex flex-col gap-3 transition-all duration-300 motion-reduce:transition-none ${
                    open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
                  }`}
                >
                  <span className="px-4 text-xs text-gray-400 truncate">{email}</span>
                  <button onClick={handleLogout} className="w-full bg-red-50 text-red-500 px-4 py-3 rounded-xl text-sm font-bold hover:bg-red-100 transition-all">
                    Salir
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Fondo para cerrar al tocar fuera (solo móvil) */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`md:hidden fixed inset-0 z-40 bg-black/20 transition-opacity duration-300 motion-reduce:transition-none ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />
    </>
  );
};

export default Navbar;
