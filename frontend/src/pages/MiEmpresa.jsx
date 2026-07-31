import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import useAuthStore from "../store/authStore";
import { getCompanyProfile, saveCompanyProfile, deleteCompanyProfile } from "../api/api";
import ImageCropper from "../components/ImageCropper";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix para el icono de Leaflet con Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Al hacer clic en el mapa: fija el marcador y reverse-geocodifica la dirección
const LocationPicker = ({ setPosition, onReverse }) => {
  useMapEvents({
    click(e) {
      const p = [e.latlng.lat, e.latlng.lng];
      setPosition(p);
      onReverse(p);
    },
  });
  return null;
};

// Mueve el centro del mapa cuando cambia la posición (p. ej. al geocodificar)
const Recenter = ({ position }) => {
  const map = useMap();
  useEffect(() => { if (position) map.setView(position, map.getZoom()); }, [position, map]);
  return null;
};

const MiEmpresa = () => {
  const { userId, email: cuentaEmail } = useAuthStore();
  const [form, setForm] = useState({
    companyName: "", description: "", phone1: "", phone2: "",
    address: "", email: cuentaEmail || "", logoBase64: "",
    latitude: -16.5, longitude: -68.15, profileComplete: false,
  });
  const [position, setPosition] = useState([-16.5, -68.15]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);

  useEffect(() => { loadProfile(); }, [userId]);

  const loadProfile = async () => {
    try {
      const res = await getCompanyProfile(userId);
      // Heredar el email de la cuenta si el perfil aún no tiene uno
      setForm({ ...res.data, email: res.data.email || cuentaEmail || "" });
      if (res.data.latitude && res.data.longitude) {
        setPosition([res.data.latitude, res.data.longitude]);
      }
    } catch {
      // Primer ingreso: dejar el email de la cuenta prellenado
      setForm((p) => ({ ...p, email: cuentaEmail || "" }));
    }
    setLoading(false);
  };

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  useEffect(() => {
    setForm((p) => ({ ...p, latitude: position[0], longitude: position[1] }));
  }, [position]);

  // Al elegir un archivo, abre el editor de recorte (zoom + posición, sin deformar)
  const handleLogo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCropSrc(URL.createObjectURL(file));
    e.target.value = "";
  };

  // ── Geocodificación (OpenStreetMap / Nominatim) ──
  const geocodeAddress = async () => {
    if (!form.address?.trim()) { alert("Escribe primero una dirección."); return; }
    setGeoLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=bo&q=${encodeURIComponent(form.address)}`;
      const res = await fetch(url, { headers: { "Accept-Language": "es" } });
      const data = await res.json();
      if (data.length > 0) {
        setPosition([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      } else {
        alert("No se encontró la dirección. Intenta con más detalle o ubícala en el mapa.");
      }
    } catch {
      alert("No se pudo buscar la dirección (¿sin conexión a internet?).");
    }
    setGeoLoading(false);
  };

  const reverseGeocode = async (pos) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos[0]}&lon=${pos[1]}`;
      const res = await fetch(url, { headers: { "Accept-Language": "es" } });
      const data = await res.json();
      if (data.display_name) handleChange("address", data.display_name);
    } catch { /* sin conexión: se conserva la dirección escrita */ }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveCompanyProfile({ ...form, userId, profileComplete: true });
      alert("Datos de empresa guardados correctamente.");
    } catch (err) {
      alert(err.response?.data?.error || "Error al guardar.");
    }
    setSaving(false);
  };

  const handleClear = () => {
    setForm({ companyName: "", description: "", phone1: "", phone2: "", address: "", email: cuentaEmail || "", logoBase64: "", latitude: -16.5, longitude: -68.15, profileComplete: false });
    setPosition([-16.5, -68.15]);
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de borrar todos los datos de tu empresa?")) return;
    try {
      await deleteCompanyProfile(userId);
      handleClear();
      alert("Datos eliminados.");
    } catch { alert("Error al eliminar."); }
  };

  const wordCount = form.description.split(/\s+/).filter(Boolean).length;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          shape="square"
          onCancel={() => setCropSrc(null)}
          onConfirm={(base64) => { handleChange("logoBase64", base64); setCropSrc(null); }}
        />
      )}
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-blue-950">Mi Empresa</h1>
          <span></span>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
          {/* LOGO */}
          <div className="flex items-center gap-5">
            <div className="w-24 h-24 rounded-2xl bg-gray-100 overflow-hidden border-2 border-gray-200 flex-shrink-0 flex items-center justify-center">
              {form.logoBase64 ? (
                <img src={form.logoBase64} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-3xl text-gray-300">🏢</span>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Logotipo de la empresa</label>
              <label className="inline-block bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer hover:bg-blue-100">
                Subir imagen
                <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
              </label>
              {form.logoBase64 && (
                <button onClick={() => handleChange("logoBase64", "")} className="ml-2 text-xs text-red-400 hover:text-red-600 font-bold">Quitar</button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nombre de la empresa</label>
            <input value={form.companyName} onChange={(e) => handleChange("companyName", e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: DICALI S.R.L." />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Descripción <span className="text-xs text-gray-400">({wordCount}/20 palabras)</span></label>
            <textarea
              value={form.description}
              onChange={(e) => {
                const words = e.target.value.split(/\s+/).filter(Boolean);
                if (words.length <= 20) handleChange("description", e.target.value);
              }}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Breve descripción de la empresa (máximo 20 palabras)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">1er Teléfono</label>
              <input value={form.phone1} onChange={(e) => handleChange("phone1", e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">2do Teléfono</label>
              <input value={form.phone2} onChange={(e) => handleChange("phone2", e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Dirección</label>
            <div className="flex gap-2">
              <input value={form.address} onChange={(e) => handleChange("address", e.target.value)} className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Dirección de la empresa" />
              <button onClick={geocodeAddress} disabled={geoLoading} className="bg-blue-600 text-white px-4 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50 whitespace-nowrap">
                {geoLoading ? "..." : "Ubicar en el mapa"}
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Escribe la dirección y pulsa "Ubicar", o haz clic en el mapa para rellenarla automáticamente.</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* MAPA */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Ubicación en el mapa (haz clic para marcar)</label>
            <div className="rounded-xl overflow-hidden border border-gray-200 h-64">
              <MapContainer center={position} zoom={13} className="h-full w-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                <Marker position={position} />
                <LocationPicker setPosition={setPosition} onReverse={reverseGeocode} />
                <Recenter position={position} />
              </MapContainer>
            </div>
          </div>
        </motion.div>

        <div className="mt-8 grid grid-cols-3 gap-3">
          <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50">
            {saving ? "..." : "GUARDAR"}
          </button>
          <button onClick={handleClear} className="bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition-all">
            LIMPIAR
          </button>
          <button onClick={handleDelete} className="bg-red-100 text-red-600 py-3 rounded-xl font-bold hover:bg-red-200 transition-all">
            BORRAR
          </button>
        </div>
      </div>
    </div>
  );
};

export default MiEmpresa;
