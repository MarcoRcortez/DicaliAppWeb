import React, { useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const CandidateProfile = () => {
    const [emailSearch, setEmailSearch] = useState('');
    const [candidate, setCandidate] = useState(null);
    const [error, setError] = useState(false);

    const handleSearch = async () => {
        try {
            setError(false);
            // CORRECCIÓN: Ruta sincronizada con el @GetMapping("/profile/{email}") del controlador
            const res = await axios.get(`http://localhost:8080/api/candidates/profile/${emailSearch.trim()}`);
            
            if (res.data) {
                setCandidate(res.data);
            }
        } catch (err) {
            console.error("Error al buscar:", err);
            setCandidate(null);
            setError(true);
        }
    };

    const downloadPDF = () => {
        const doc = document.getElementById('cv-render');
        html2canvas(doc, { scale: 2 }).then((canvas) => {
            const img = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            // Ajuste de proporciones para A4
            pdf.addImage(img, 'PNG', 0, 0, 210, (canvas.height * 210) / canvas.width);
            pdf.save(`CV_DICALI_${candidate.fullName}.pdf`);
        });
    };

    return (
        <div className="min-h-screen bg-[#060b1a] text-white p-6 font-sans pt-32">
            <div className="max-w-3xl mx-auto">
                <h2 className="text-2xl font-black mb-6 uppercase italic text-blue-400">Mi Perfil Profesional</h2>
                
                <div className="flex gap-4 mb-10">
                    <input 
                        type="email"
                        className="flex-1 bg-slate-800/50 border border-slate-700 p-4 rounded-2xl focus:border-blue-500 outline-none text-white"
                        placeholder="tu-correo@gmail.com"
                        value={emailSearch}
                        onChange={(e) => setEmailSearch(e.target.value)}
                    />
                    <button 
                        onClick={handleSearch} 
                        className="bg-blue-600 px-8 rounded-2xl font-bold hover:bg-blue-500 transition-all active:scale-95"
                    >
                        Cargar CV
                    </button>
                </div>

                {error && (
                    <p className="text-rose-500 text-center font-bold mb-4 animate-bounce">
                        ⚠️ No se encontró ningún perfil con ese correo
                    </p>
                )}

                {candidate && (
                    <div className="space-y-6 animate-fade-in">
                        <button 
                            onClick={downloadPDF} 
                            className="w-full bg-emerald-500 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-colors"
                        >
                            📥 Descargar Currículum en PDF
                        </button>

                        <div id="cv-render" className="bg-white text-slate-900 p-12 rounded-3xl shadow-2xl">
                            <div className="border-b-4 border-blue-900 pb-6 mb-8">
                                <h1 className="text-5xl font-black uppercase text-blue-900">{candidate.fullName}</h1>
                                <p className="text-xl font-bold text-slate-500">{candidate.education}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-8">
                                <div className="col-span-1 border-r border-slate-200 pr-6">
                                    <h3 className="text-blue-600 font-black text-[10px] uppercase mb-4 tracking-tighter">Información de Contacto</h3>
                                    <p className="text-sm mb-4"><b>Email:</b><br/><span className="text-slate-600">{candidate.email}</span></p>
                                    <p className="text-sm mb-4"><b>WhatsApp:</b><br/><span className="text-slate-600">{candidate.whatsapp}</span></p>
                                    
                                    <h3 className="text-blue-600 font-black text-[10px] uppercase mt-8 mb-4 tracking-tighter">Habilidades Técnicas</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {candidate.skills?.map((s, i) => (
                                            <span key={i} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-[9px] font-bold border border-blue-100">
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <h3 className="text-blue-600 font-black text-[10px] uppercase mb-4 tracking-tighter">Resumen de Carrera</h3>
                                    <p className="text-slate-700 leading-relaxed text-base">
                                        Profesional altamente capacitado con <b>{candidate.experienceYears} años</b> de experiencia demostrable en el sector de sistemas. 
                                        Especializado en la implementación de soluciones eficientes y el manejo de tecnologías modernas para el cumplimiento de objetivos organizacionales.
                                    </p>
                                    <div className="mt-12 pt-8 border-t border-slate-100 text-[10px] text-slate-400 italic">
                                        Documento generado automáticamente por la plataforma DICALI.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CandidateProfile;