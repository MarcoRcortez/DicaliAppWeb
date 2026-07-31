import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Home = () => {
  return (
    <div className="bg-white min-h-screen">
      {/* HERO */}
      <section className="pt-16 pb-20 px-4 relative">
        <div className="max-w-6xl mx-auto text-center">
          <motion.span
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6 inline-block"
          >
            Plataforma de Reclutamiento Inteligente
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-7xl font-black text-blue-950 mb-6 tracking-tighter"
          >
            DICALI<span className="text-blue-500">.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Optimizando el talento humano en La Paz mediante emparejamiento inteligente entre candidatos y empresas.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col md:flex-row justify-center gap-6"
          >
            <Link
              to="/login/candidate"
              className="bg-blue-600 text-white px-12 py-6 rounded-2xl font-black text-lg hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all hover:scale-105"
            >
              SOY POSTULANTE
            </Link>
            <Link
              to="/login/company"
              className="bg-gray-900 text-white px-12 py-6 rounded-2xl font-black text-lg hover:bg-black transition-all hover:scale-105"
            >
              SOY EMPRESA
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CARACTERÍSTICAS */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { icon: "🤖", title: "Compatibilidad Inteligente", desc: "La afinidad vocacional (estudios + experiencia) filtra por rubro; luego pondera experiencia (30%), habilidades técnicas (25%), blandas (20%), salario (10%), disponibilidad (7,5%) e idiomas (7,5%)." },
            { icon: "📋", title: "CV Digital Estructurado", desc: "Formulario completo con habilidades por niveles, experiencia laboral, idiomas y expectativa salarial — sin PDFs desordenados." },
            { icon: "📊", title: "Dashboard en Tiempo Real", desc: "Panel administrativo con gráficos de embudo, usuarios activos y seguimiento de conexiones confirmadas." },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-white shadow-lg rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">{item.icon}</div>
              <h3 className="text-xl font-black mb-2 text-blue-900">{item.title}</h3>
              <p className="text-gray-500 text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto bg-blue-600 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-black mb-6 uppercase">¿Listo para empezar?</h2>
          <p className="text-blue-100 mb-8 font-medium">Únete a la red de profesionales más segura de La Paz.</p>
          <Link
            to="/login/candidate"
            className="bg-white text-blue-600 px-12 py-4 rounded-2xl font-black hover:bg-gray-100 transition-all uppercase tracking-widest"
          >
            Registrarme Ahora
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
