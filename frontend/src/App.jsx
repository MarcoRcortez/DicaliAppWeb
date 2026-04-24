import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Feed from "./pages/Feed";
import Login from "./pages/Login";
import RegisterCandidate from "./pages/RegisterCandidate"; // Perspectiva Talento
import RegisterCompany from "./pages/RegisterCompany";   // Perspectiva Empresa
import UserProfile from "./pages/UserProfile";
import AdminDashboard from "./pages/AdminDashboard";
import CreatePost from "./pages/CreatePost"; // Aquí la empresa publicará
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-50"> 
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/jobs" element={<Feed />} />
            <Route path="/login" element={<Login />} />
            
            {/* PERSPECTIVA TALENTO: Registro de CV */}
            <Route path="/register-talent" element={<RegisterCandidate />} />
            
            {/* PERSPECTIVA EMPRESA: Registro y Panel de Control */}
            <Route path="/register-company" element={<RegisterCompany />} />
            <Route path="/company-panel" element={<CreatePost />} /> 

            <Route path="/profile" element={<UserProfile />} />

            {/* PERSPECTIVA ADMINISTRADOR */}
            <Route path="/admin" element={<AdminDashboard />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;