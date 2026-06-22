import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import useAuthStore from "../store/authStore";
import {
  loginUser,
  registerUser,
  configureSecurityQuestion,
  getSecurityQuestion,
  verifySecurityAnswer,
  resetPassword,
} from "../api/api";

const SECURITY_QUESTIONS = [
  "¿Cuál es el nombre de tu primera mascota?",
  "¿En qué ciudad naciste?",
  "¿Cuál es el nombre de tu mejor amigo de la infancia?",
];

const ROLE_MAP = {
  candidate: "CANDIDATE",
  company: "RECRUITER",
  admin: "ADMIN",
};

const ROLE_LABELS = {
  candidate: "SOY POSTULANTE",
  company: "SOY EMPRESA",
  admin: "ADMINISTRADOR",
};

const Login = () => {
  const { roleParam } = useParams();
  const navigate = useNavigate();
  const authLogin = useAuthStore((s) => s.login);
  const setSecurityConfigured = useAuthStore((s) => s.setSecurityConfigured);

  const [isRegister, setIsRegister] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [securitySetup, setSecuritySetup] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedQuestion, setSelectedQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [secAnswer, setSecAnswer] = useState("");
  const [tempAuth, setTempAuth] = useState(null);

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotQuestion, setForgotQuestion] = useState("");
  const [forgotAnswer, setForgotAnswer] = useState("");
  const [forgotStep, setForgotStep] = useState(1);
  const [newPassword, setNewPassword] = useState("");

  const role = ROLE_MAP[roleParam] || "CANDIDATE";
  const label = ROLE_LABELS[roleParam] || "POSTULANTE";

  const redirectToDashboard = (r) => {
    if (r === "CANDIDATE") navigate("/candidate");
    else if (r === "RECRUITER") navigate("/company");
    else if (r === "ADMIN") navigate("/admin");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        if (password !== confirmPassword) { setError("Las contraseñas no coinciden."); setLoading(false); return; }
        if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); setLoading(false); return; }
        const res = await registerUser({ email, password, role });
        setTempAuth(res.data);
        setSecuritySetup(true);
      } else {
        const res = await loginUser({ email, password });
        if (!res.data.securityConfigured) {
          setTempAuth(res.data);
          setSecuritySetup(true);
        } else {
          authLogin(res.data);
          redirectToDashboard(res.data.role);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || "Error de conexión con el servidor.");
    }
    setLoading(false);
  };

  const handleSecuritySetup = async (e) => {
    e.preventDefault();
    setError("");
    if (!secAnswer.trim()) { setError("Debes ingresar una respuesta."); return; }
    try {
      await configureSecurityQuestion({ userId: tempAuth.userId, question: selectedQuestion, answer: secAnswer });
      setSecurityConfigured(true);
      authLogin({ ...tempAuth, securityConfigured: true });
      redirectToDashboard(tempAuth.role);
    } catch (err) {
      setError(err.response?.data?.error || "Error al guardar pregunta secreta.");
    }
  };

  const handleForgotStep = async (e) => {
    e.preventDefault();
    setError("");
    if (forgotStep === 1) {
      try {
        const res = await getSecurityQuestion(forgotEmail);
        setForgotQuestion(res.data.question);
        setForgotStep(2);
      } catch { setError("Correo no encontrado."); }
    } else if (forgotStep === 2) {
      try {
        const res = await verifySecurityAnswer({ email: forgotEmail, answer: forgotAnswer });
        if (res.data.valid) setForgotStep(3);
        else setError("Respuesta incorrecta. Intenta de nuevo.");
      } catch { setError("Error al verificar."); }
    } else if (forgotStep === 3) {
      if (newPassword.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
      try {
        await resetPassword({ email: forgotEmail, newPassword });
        setForgotMode(false); setForgotStep(1); setError("");
        alert("Contraseña actualizada. Ahora puedes iniciar sesión.");
      } catch { setError("Error al actualizar la contraseña."); }
    }
  };

  // ── SETUP PREGUNTA SECRETA ──
  if (securitySetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full">
          <h2 className="text-2xl font-black text-blue-950 mb-2 text-center">Configura tu Pregunta Secreta</h2>
          <p className="text-gray-400 text-sm text-center mb-6">Solo se configura una vez. Te servirá para recuperar tu contraseña.</p>
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          <form onSubmit={handleSecuritySetup} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Pregunta secreta</label>
              <select value={selectedQuestion} onChange={(e) => setSelectedQuestion(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {SECURITY_QUESTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Tu respuesta</label>
              <input type="text" value={secAnswer} onChange={(e) => setSecAnswer(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Escribe tu respuesta..." />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">Guardar y Continuar</button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ── RECUPERAR CONTRASEÑA ──
  if (forgotMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full">
          <h2 className="text-2xl font-black text-blue-950 mb-6 text-center">Recuperar Contraseña</h2>
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          <form onSubmit={handleForgotStep} className="space-y-4">
            {forgotStep === 1 && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Correo electrónico</label>
                <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
            )}
            {forgotStep === 2 && (
              <div>
                <p className="text-sm text-gray-600 mb-3 font-medium">{forgotQuestion}</p>
                <input type="text" value={forgotAnswer} onChange={(e) => setForgotAnswer(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Tu respuesta..." required />
              </div>
            )}
            {forgotStep === 3 && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nueva contraseña</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
            )}
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">
              {forgotStep === 1 ? "Buscar cuenta" : forgotStep === 2 ? "Verificar respuesta" : "Cambiar contraseña"}
            </button>
          </form>
          <button onClick={() => { setForgotMode(false); setForgotStep(1); setError(""); }} className="mt-4 text-sm text-gray-400 hover:text-gray-600 w-full text-center">Volver al inicio de sesión</button>
        </motion.div>
      </div>
    );
  }

  // ── LOGIN / REGISTRO ──
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full">
        <div className="text-center mb-8">
          <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">{label}</span>
          <h2 className="text-3xl font-black text-blue-950 mt-4">{isRegister ? "Crear Cuenta" : "Iniciar Sesión"}</h2>
        </div>
        {error && <p className="text-red-500 text-sm mb-4 text-center bg-red-50 p-3 rounded-xl">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Correo electrónico</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="tu@correo.com" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" required />
          </div>
          {isRegister && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Confirmar contraseña</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" required />
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50">
            {loading ? "Cargando..." : isRegister ? "Registrarme" : "Ingresar"}
          </button>
        </form>
        <div className="mt-6 text-center space-y-2">
          <button onClick={() => { setIsRegister(!isRegister); setError(""); }} className="text-sm text-blue-600 hover:underline">
            {isRegister ? "Ya tengo cuenta — Iniciar sesión" : "¿Nuevo? Crear una cuenta"}
          </button>
          {!isRegister && (
            <button onClick={() => { setForgotMode(true); setError(""); }} className="block mx-auto text-sm text-gray-400 hover:text-gray-600">¿Olvidaste tu contraseña?</button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
