import { useEffect } from "react";

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Se cierra tras 4 segundos
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgStyles = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-blue-600"
  };

  return (
    <div className={`fixed bottom-10 right-10 ${bgStyles[type] || "bg-gray-800"} text-white px-8 py-4 rounded-2xl shadow-2xl z-[100] animate-bounce-in flex items-center gap-3`}>
      <span className="font-black uppercase text-xs tracking-widest">{message}</span>
      <button onClick={onClose} className="text-white/50 hover:text-white font-bold">×</button>
    </div>
  );
};

export default Toast;