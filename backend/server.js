const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/job_portal_db');

// MODELOS COHERENTES
const Company = mongoose.model('Company', new mongoose.Schema({
  companyName: String, nit: String, representative: String, city: String, status: { type: String, default: 'PENDIENTE' }
}), 'companies');

const Candidate = mongoose.model('Candidate', new mongoose.Schema({
  fullName: String, email: String, whatsapp: String, education: String, experienceYears: Number, skills: [String]
}), 'candidates');

const Job = mongoose.model('Job', new mongoose.Schema({
  title: String, category: String, salary: Number, companyName: String
}), 'job_posts');

// --- RUTAS QUE TUS CAPTURAS PIDEN ---

// Para RegisterCandidate.jsx (Evita el Error 500)
app.post('/api/candidates/register', async (req, res) => {
  try {
    const nuevo = new Candidate(req.body);
    await nuevo.save();
    res.status(201).json({ message: "CV Registrado" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Para RegisterCompany.jsx (Evita el Error 404)
app.post('/api/companies/register', async (req, res) => {
  try {
    const nueva = new Company(req.body);
    await nueva.save();
    res.status(201).json({ message: "Empresa registrada" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Para AdminDashboard.jsx (Evita el Error 404)
app.get('/api/companies/all', async (req, res) => {
  res.json(await Company.find());
});

// Para Feed.jsx (Evita el Error 404)
app.get('/api/jobPosts/all', async (req, res) => {
  res.json(await Job.find());
});

app.listen(8080, () => console.log("🚀 Servidor DICALI en 8080"));