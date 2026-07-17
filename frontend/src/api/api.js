import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:8080/api" });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const registerUser = (data) => API.post("/auth/register", data);
export const loginUser = (data) => API.post("/auth/login", data);
export const configureSecurityQuestion = (data) => API.post("/auth/security-question", data);
export const getSecurityQuestion = (email) => API.get(`/auth/security-question/${email}`);
export const verifySecurityAnswer = (data) => API.post("/auth/verify-answer", data);
export const resetPassword = (data) => API.post("/auth/reset-password", data);

// ─── CANDIDATE PROFILES ─────────────────────────────────────────────────────
export const getCandidateProfile = (userId) => API.get(`/candidate-profiles/user/${userId}`);
export const saveCandidateProfile = (data) => API.post("/candidate-profiles", data);
export const deleteCandidateProfile = (userId) => API.delete(`/candidate-profiles/user/${userId}`);
export const getAllCandidateProfiles = () => API.get("/candidate-profiles/all");

// ─── COMPANY PROFILES ───────────────────────────────────────────────────────
export const getCompanyProfile = (userId) => API.get(`/company-profiles/user/${userId}`);
export const saveCompanyProfile = (data) => API.post("/company-profiles", data);
export const deleteCompanyProfile = (userId) => API.delete(`/company-profiles/user/${userId}`);

// ─── VACANCIES ───────────────────────────────────────────────────────────────
export const getOpenVacancies = () => API.get("/vacancies/public/open");
export const getMyVacancies = (recruiterId) => API.get(`/vacancies/my/${recruiterId}`);
export const createVacancy = (data) => API.post("/vacancies", data);
export const updateVacancy = (id, data) => API.put(`/vacancies/${id}`, data);
export const deleteVacancy = (id) => API.delete(`/vacancies/${id}`);
export const checkCompanyRegistered = (recruiterId) => API.get(`/vacancies/company-check/${recruiterId}`);

// ─── MATCHES ─────────────────────────────────────────────────────────────────
export const getMatchesForCandidate = (candidateId) => API.get(`/matches/candidate/${candidateId}`);
export const getMatchesForVacancy = (vacancyId) => API.get(`/matches/vacancy/${vacancyId}`);
export const getConfirmedMatchesCandidate = (candidateId) => API.get(`/matches/candidate/${candidateId}/confirmed`);
export const getNewNotifications = (candidateId) => API.get(`/matches/candidate/${candidateId}/new-notifications`);
export const markNotified = (candidateId) => API.put(`/matches/candidate/${candidateId}/mark-notified`);
export const acceptMatch = (matchId) => API.put(`/matches/${matchId}/accept`);
export const rejectMatch = (matchId) => API.put(`/matches/${matchId}/reject`);
export const deleteMatch = (matchId) => API.delete(`/matches/${matchId}`);
export const runMatchingForCandidate = (candidateId) => API.post(`/matches/run-for-candidate/${candidateId}`);
export const directMatch = (data) => API.post("/matches/direct", data);
export const runMatchingForRecruiter = (recruiterId) => API.post(`/matches/run-for-recruiter/${recruiterId}`);
export const getRecruiterScores = (recruiterId) => API.get(`/matches/recruiter/${recruiterId}/scores`);
export const getMatchExplanation = (matchId) => API.get(`/matches/${matchId}/explanation`);

// ─── ADMIN ───────────────────────────────────────────────────────────────────
export const getAdminStats = () => API.get("/admin/stats");
export const getAdminUsers = () => API.get("/admin/users");
export const updateAdminUser = (id, data) => API.put(`/admin/users/${id}`, data);
export const deleteAdminUser = (id) => API.delete(`/admin/users/${id}`);
export const createAdminUser = (data) => API.post("/admin/users", data);
export const getAdminVacancies = () => API.get("/admin/vacancies");
export const deleteAdminVacancy = (id) => API.delete(`/admin/vacancies/${id}`);
export const getAdminProfiles = () => API.get("/admin/profiles");
export const deleteAdminProfile = (id) => API.delete(`/admin/profiles/${id}`);
export const getAdminCompanies = () => API.get("/admin/companies");

export default API;
