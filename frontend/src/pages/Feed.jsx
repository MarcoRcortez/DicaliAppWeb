import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Feed = () => {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get('http://localhost:8080/api/jobPosts/all');
        setJobs(res.data);
      } catch (err) { console.error(err); }
    };
    fetchJobs();
  }, []);

  return (
    <div className="pt-24 p-8 max-w-7xl mx-auto min-h-screen bg-gray-50">
      <h1 className="text-4xl font-black text-blue-900 mb-2 font-['Outfit']">MERCADO LABORAL</h1>
      <p className="text-gray-500 mb-10">Explora las vacantes disponibles en La Paz</p>
      
      <div className="grid gap-6">
        {jobs.map(job => (
          <div key={job._id} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <span className="text-blue-600 font-bold text-xs uppercase tracking-widest">{job.category}</span>
              <h2 className="text-2xl font-bold text-slate-800 mt-1">{job.title}</h2>
              <p className="text-gray-500 font-medium">{job.company} • <span className="text-gray-400">{job.location}</span></p>
              <div className="mt-4 text-3xl font-black text-green-600">{job.salary} <span className="text-sm">Bs.</span></div>
            </div>
            <button className="bg-[#1e3a8a] text-white px-10 py-3 rounded-2xl font-bold hover:bg-blue-800 transition-all">
              Postular
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Feed;