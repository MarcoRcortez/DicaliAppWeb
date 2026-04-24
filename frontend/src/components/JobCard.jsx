import React from 'react';

const JobCard = ({ job }) => {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase">
            {job.category || "General"}
          </span>
          <h3 className="text-xl font-bold text-gray-800 mt-2">{job.title}</h3>
        </div>
        <div className="text-blue-600 font-bold">
          {job.salary ? `Bs. ${job.salary}` : "Sueldo a convenir"}
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {job.description || "Sin descripción disponible."}
      </p>
      
      <div className="flex items-center text-gray-500 text-xs gap-4 mb-6">
        <span className="flex items-center gap-1">🏢 {job.company}</span>
        <span className="flex items-center gap-1">📍 {job.location}</span>
        <span className="flex items-center gap-1">⏱️ {job.type}</span>
      </div>
      
      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors">
        Postular ahora
      </button>
    </div>
  );
};

export default JobCard;