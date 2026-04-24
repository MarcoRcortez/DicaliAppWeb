import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="bg-white">
      {/* SECCIÓN HERO */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6 inline-block">
            Plataforma de Reclutamiento Inteligente
          </span>
          <h1 className="text-6xl md:text-7xl font-black text-blue-950 mb-6 tracking-tighter">
            DICALI<span className="text-blue-500">.</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Optimizando el talento humano en La Paz mediante auditoría de perfiles y emparejamiento con Inteligencia Artificial.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <Link to="/register-talent" className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all">
              SOY TALENTO
            </Link>
            <Link to="/register-company" className="bg-gray-900 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-black transition-all">
              SOY EMPRESA
            </Link>
          </div>
        </div>
      </section>

      {/* SECCIÓN DE CARACTERÍSTICAS */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-white shadow-lg rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">🛡️</div>
            <h3 className="text-xl font-black mb-2 text-blue-900">NIT Verificado</h3>
            <p className="text-gray-500 text-sm">Auditoría rigurosa de empresas para garantizar ofertas de empleo reales y legales en Bolivia.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-white shadow-lg rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">🤖</div>
            <h3 className="text-xl font-black mb-2 text-blue-900">Matching IA</h3>
            <p className="text-gray-500 text-sm">Algoritmos avanzados que comparan habilidades y experiencia para encontrar el candidato ideal.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-white shadow-lg rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">📄</div>
            <h3 className="text-xl font-black mb-2 text-blue-900">CV Digital PDF</h3>
            <p className="text-gray-500 text-sm">Generación automática de currículums profesionales listos para descarga y auditoría.</p>
          </div>
        </div>
      </section>

      {/* SECCIÓN CTA FINAL */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto bg-blue-600 rounded-[3rem] p-12 text-center text-white shadow-3xl shadow-blue-200">
          <h2 className="text-3xl md:text-4xl font-black mb-6 uppercase">¿Listo para empezar?</h2>
          <p className="text-blue-100 mb-8 font-medium">Únete a la red de profesionales más segura de La Paz.</p>
          <Link to="/" className="bg-white text-blue-600 px-12 py-4 rounded-2xl font-black hover:bg-gray-100 transition-all uppercase tracking-widest">
            Ver Ofertas Actuales
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;