import axios from 'axios';

const API_BASE = 'http://localhost:8080';

export const fetchJobs = () => axios.get(`${API_BASE}/job-posts`);

export const searchJobs = (text) => axios.get(`${API_BASE}/job-posts/${text}`);

export const createJobPost = (job) => axios.post(`${API_BASE}/create-job-post`, job);
