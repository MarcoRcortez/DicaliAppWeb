const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center p-10">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-blue-900 font-bold animate-pulse uppercase text-xs tracking-widest">
        Procesando Datos...
      </p>
    </div>
  );
};

export default LoadingSpinner;