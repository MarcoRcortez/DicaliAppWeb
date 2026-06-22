import React from 'react';

const JobCard = ({ job }) => {
    return (
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-100 hover:scale-105 transition-transform duration-300">
            <div className="flex justify-between items-start mb-6">
                <div className="bg-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 font-black">
                    {job.companyName?.charAt(0)}
                </div>
                <span className="bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full text-xs font-black uppercase">
                    {job.salary} Bs.
                </span>
            </div>

            <h3 className="text-xl font-black text-slate-800 leading-tight mb-2 uppercase italic tracking-tighter">
                {job.title}
            </h3>
            <p className="text-indigo-600 font-bold text-sm mb-4">
                🏢 {job.companyName}
            </p>

            <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-lg">
                    {job.category} {/* <-- Campo corregido segun tu Compass */}
                </span>
                <button className="bg-slate-900 text-white px-5 py-2 rounded-xl text-[10px] font-black hover:bg-indigo-600 transition-colors uppercase">
                    Ver Detalles
                </button>
            </div>
        </div>
    );
};

export default JobCard;