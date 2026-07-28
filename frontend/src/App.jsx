import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// Páginas principales
import Home from "./pages/Home";
import Login from "./pages/Login";

// Flujo POSTULANTE
import CandidateDashboard from "./pages/CandidateDashboard";
import Empleos from "./pages/Empleos";
import MiCurriculum from "./pages/MiCurriculum";

// Flujo EMPRESA
import CompanyDashboard from "./pages/CompanyDashboard";
import Postulantes from "./pages/Postulantes";
import MiEmpresa from "./pages/MiEmpresa";
import Reclutar from "./pages/Reclutar";
import Reportes from "./pages/Reportes";

// Admin
import AdminPanel from "./pages/AdminPanel";

// 404
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Navbar />

        <main className="pt-16">
          <Routes>
            {/* Home */}
            <Route path="/" element={<Home />} />

            {/* Login por rol */}
            <Route path="/login/:roleParam" element={<Login />} />

            {/* Flujo POSTULANTE */}
            <Route path="/candidate" element={<ProtectedRoute allowedRoles={["CANDIDATE"]}><CandidateDashboard /></ProtectedRoute>} />
            <Route path="/candidate/empleos" element={<ProtectedRoute allowedRoles={["CANDIDATE"]}><Empleos /></ProtectedRoute>} />
            <Route path="/candidate/curriculum" element={<ProtectedRoute allowedRoles={["CANDIDATE"]}><MiCurriculum /></ProtectedRoute>} />

            {/* Flujo EMPRESA */}
            <Route path="/company" element={<ProtectedRoute allowedRoles={["RECRUITER"]}><CompanyDashboard /></ProtectedRoute>} />
            <Route path="/company/postulantes" element={<ProtectedRoute allowedRoles={["RECRUITER"]}><Postulantes /></ProtectedRoute>} />
            <Route path="/company/mi-empresa" element={<ProtectedRoute allowedRoles={["RECRUITER"]}><MiEmpresa /></ProtectedRoute>} />
            <Route path="/company/reclutar" element={<ProtectedRoute allowedRoles={["RECRUITER"]}><Reclutar /></ProtectedRoute>} />
            <Route path="/company/reportes" element={<ProtectedRoute allowedRoles={["RECRUITER"]}><Reportes /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminPanel /></ProtectedRoute>} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
