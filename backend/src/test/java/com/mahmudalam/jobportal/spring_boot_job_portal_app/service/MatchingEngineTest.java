package com.mahmudalam.jobportal.spring_boot_job_portal_app.service;

import com.mahmudalam.jobportal.spring_boot_job_portal_app.config.MatchingWeightsProperties;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.CandidateProfileModel;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.MatchBreakdown;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.VacancyModel;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.repository.MatchRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

/**
 * Tests del motor de matching ponderado. Prueban lógica pura (calculateBreakdown /
 * calculateScore), sin contexto de Spring ni Mongo: el MatchRepository sólo se usa
 * en upsertMatch, que aquí no se ejercita.
 */
class MatchingEngineTest {

    private MatchingEngine engine;

    /** Pesos de ajuste por defecto: experiencia .30, técnicas .25, blandas .20, salario .10, tipo .075,
     *  idiomas .075 (suman 1.0). La afinidad vocacional (estudios+experiencia) NO es un peso: multiplica
     *  el resultado (piso 0.10). La vacante base no tiene jobTitle → la afinidad no aplica (factor 1.0)
     *  y el promedio de ajuste se renormaliza sobre los criterios presentes. */
    @BeforeEach
    void setUp() {
        engine = new MatchingEngine(mock(MatchRepository.class), new MatchingWeightsProperties());
    }

    // ── Helpers ──

    private CandidateProfileModel candidate() {
        CandidateProfileModel c = new CandidateProfileModel();
        c.setTechnicalSkills(List.of(skill("Java", "AVANZADO")));
        c.setSoftSkills(List.of("Trabajo en equipo"));
        c.setLanguages(List.of(candidateLang("Ingles", "B2")));
        c.setWorkExperience(List.of(experience("2019-01-01", "2024-01-01"))); // ~5 años
        c.setExpectedSalary(salary(3000, 6000));
        c.setWorkType("remoto");
        return c;
    }

    private VacancyModel vacancy() {
        VacancyModel v = new VacancyModel();
        v.setRequiredTechnicalSkills(List.of(vacancySkill("Java", "AVANZADO")));
        v.setDesiredSoftSkills(List.of("Trabajo en equipo"));
        v.setRequiredLanguages(List.of(vacancyLang("Ingles", "B2")));
        v.setMinExperienceYears(3);
        v.setSalaryRange(vacancySalary(4000, 7000));
        v.setWorkAvailability("tiempo completo");
        return v;
    }

    private CandidateProfileModel.SkillTag skill(String name, String level) {
        CandidateProfileModel.SkillTag s = new CandidateProfileModel.SkillTag();
        s.setName(name);
        s.setLevel(level);
        return s;
    }

    private VacancyModel.SkillTag vacancySkill(String name, String level) {
        VacancyModel.SkillTag s = new VacancyModel.SkillTag();
        s.setName(name);
        s.setLevel(level);
        return s;
    }

    private CandidateProfileModel.LanguageEntry candidateLang(String name, String level) {
        CandidateProfileModel.LanguageEntry l = new CandidateProfileModel.LanguageEntry();
        l.setName(name);
        l.setLevel(level);
        return l;
    }

    private VacancyModel.LanguageEntry vacancyLang(String name, String level) {
        VacancyModel.LanguageEntry l = new VacancyModel.LanguageEntry();
        l.setName(name);
        l.setLevel(level);
        return l;
    }

    private CandidateProfileModel.WorkExperience experience(String start, String end) {
        CandidateProfileModel.WorkExperience w = new CandidateProfileModel.WorkExperience();
        w.setStartDate(start);
        w.setEndDate(end);
        w.setCurrent(false);
        return w;
    }

    private CandidateProfileModel.SalaryRange salary(double min, double max) {
        CandidateProfileModel.SalaryRange s = new CandidateProfileModel.SalaryRange();
        s.setMin(min);
        s.setMax(max);
        return s;
    }

    private VacancyModel.SalaryRange vacancySalary(double min, double max) {
        VacancyModel.SalaryRange s = new VacancyModel.SalaryRange();
        s.setMin(min);
        s.setMax(max);
        return s;
    }

    // ── Score total ──

    @Test
    void candidatoIdealObtiene100() {
        assertEquals(100.0, engine.calculateScore(candidate(), vacancy()), 0.01);
    }

    @Test
    void scoreNuncaExcede100() {
        assertTrue(engine.calculateScore(candidate(), vacancy()) <= 100.0);
    }

    // ── Criterio de idiomas (peso 0.05) ──

    @Test
    void faltaIdiomaRequeridoRestaElPesoDeIdiomasRenormalizado() {
        CandidateProfileModel c = candidate();
        c.setLanguages(List.of(candidateLang("Frances", "C1"))); // no tiene el idioma pedido

        // Los criterios de ajuste presentes suman 1.0. Se pierde el peso de idiomas (0.075):
        // (1.0 - 0.075) / 1.0 = 0.925 → 92.5% (afinidad no aplica → factor 1.0)
        assertEquals(92.5, engine.calculateScore(c, vacancy()), 0.05);
    }

    @Test
    void nivelDeIdiomaInferiorAlRequeridoNoCuenta() {
        CandidateProfileModel c = candidate();
        c.setLanguages(List.of(candidateLang("Ingles", "B1"))); // pide B2

        MatchBreakdown b = engine.calculateBreakdown(c, vacancy());
        assertEquals(0.0, b.languageScore(), 0.01);
        assertEquals(List.of("Ingles"), b.missingLanguages());
    }

    @Test
    void nivelDeIdiomaSuperiorAlRequeridoSiCuenta() {
        CandidateProfileModel c = candidate();
        c.setLanguages(List.of(candidateLang("Ingles", "C1"))); // pide B2

        MatchBreakdown b = engine.calculateBreakdown(c, vacancy());
        assertEquals(1.0, b.languageScore(), 0.01);
        assertEquals(List.of("Ingles"), b.matchedLanguages());
    }

    @Test
    void vacanteSinIdiomasRequeridosNoPenaliza() {
        VacancyModel v = vacancy();
        v.setRequiredLanguages(null); // compatibilidad con vacantes antiguas

        MatchBreakdown b = engine.calculateBreakdown(candidate(), v);
        assertEquals(1.0, b.languageScore(), 0.01);
        assertEquals(100.0, b.totalScore(), 0.01);
    }

    // ── Experiencia: años reales y crédito parcial ──

    @Test
    void calculaAniosDeExperienciaDesdeLasFechas() {
        MatchBreakdown b = engine.calculateBreakdown(candidate(), vacancy());
        assertEquals(5.0, b.candidateYearsExperience(), 0.05); // 2019-01-01 → 2024-01-01
    }

    @Test
    void experienciaDaCreditoParcial() {
        CandidateProfileModel c = candidate();
        c.setWorkExperience(List.of(experience("2020-01-01", "2022-01-01"))); // ~2 años
        VacancyModel v = vacancy();
        v.setMinExperienceYears(4); // pide 4 → 2/4 = 0.5

        MatchBreakdown b = engine.calculateBreakdown(c, v);
        assertEquals(0.5, b.experienceScore(), 0.01);
        // Pierde la mitad del peso de experiencia (0.30/2 = 0.15) sobre el denominador 1.0 → 0.85
        assertEquals(85.0, b.totalScore(), 0.1);
    }

    @Test
    void experienciaDeSobraNoSuperaElTope() {
        VacancyModel v = vacancy();
        v.setMinExperienceYears(1); // candidato tiene ~5

        assertEquals(1.0, engine.calculateBreakdown(candidate(), v).experienceScore(), 0.01);
    }

    @Test
    void minExperienceYearsCeroSiempreCumple() {
        CandidateProfileModel c = candidate();
        c.setWorkExperience(null); // sin experiencia
        VacancyModel v = vacancy();
        v.setMinExperienceYears(0);

        assertEquals(1.0, engine.calculateBreakdown(c, v).experienceScore(), 0.01);
    }

    @Test
    void fechaMalFormadaSeIgnoraSinRomper() {
        CandidateProfileModel c = candidate();
        c.setWorkExperience(List.of(experience("fecha-invalida", "2024-01-01")));

        MatchBreakdown b = engine.calculateBreakdown(c, vacancy());
        assertEquals(0.0, b.candidateYearsExperience(), 0.01);
    }

    @Test
    void experienciaActualCuentaHastaHoy() {
        CandidateProfileModel c = candidate();
        CandidateProfileModel.WorkExperience w = experience("2020-01-01", null);
        w.setCurrent(true);
        c.setWorkExperience(List.of(w));

        assertTrue(engine.calculateBreakdown(c, vacancy()).candidateYearsExperience() > 4.0);
    }

    // ── Compatibilidad con vacantes antiguas (sin minExperienceYears) ──

    @Test
    void vacanteAntiguaUsaElCampoLegadoExperienceLevel() {
        VacancyModel v = vacancy();
        v.setMinExperienceYears(null);
        v.setExperienceLevel("con experiencia");

        // candidato con experiencia → 1.0
        assertEquals(1.0, engine.calculateBreakdown(candidate(), v).experienceScore(), 0.01);

        // candidato sin experiencia → 0.3
        CandidateProfileModel sinExp = candidate();
        sinExp.setWorkExperience(null);
        assertEquals(0.3, engine.calculateBreakdown(sinExp, v).experienceScore(), 0.01);
    }

    @Test
    void vacanteAntiguaSinExperienciaSiempreCumple() {
        VacancyModel v = vacancy();
        v.setMinExperienceYears(null);
        v.setExperienceLevel("sin experiencia");

        CandidateProfileModel sinExp = candidate();
        sinExp.setWorkExperience(null);
        assertEquals(1.0, engine.calculateBreakdown(sinExp, v).experienceScore(), 0.01);
    }

    // ── Desglose de habilidades técnicas ──

    @Test
    void desgloseListaTecnicasCoincidentesYFaltantes() {
        VacancyModel v = vacancy();
        v.setRequiredTechnicalSkills(List.of(
                vacancySkill("Java", "AVANZADO"),
                vacancySkill("Python", "BASICO")));

        MatchBreakdown b = engine.calculateBreakdown(candidate(), v);
        assertEquals(List.of("Java"), b.matchedTechnicalSkills());
        assertEquals(List.of("Python"), b.missingTechnicalSkills());
    }

    @Test
    void nivelTecnicoInferiorDaCreditoParcial() {
        CandidateProfileModel c = candidate();
        c.setTechnicalSkills(List.of(skill("Java", "BASICO"))); // pide AVANZADO

        // coincide el nombre (1pt) pero no el nivel (de 2 posibles) → 0.5
        assertEquals(0.5, engine.calculateBreakdown(c, vacancy()).technicalScore(), 0.01);
    }

    @Test
    void candidatoSinHabilidadesTecnicasNoCoincide() {
        CandidateProfileModel c = candidate();
        c.setTechnicalSkills(null);

        MatchBreakdown b = engine.calculateBreakdown(c, vacancy());
        assertEquals(0.0, b.technicalScore(), 0.01);
        assertEquals(List.of("Java"), b.missingTechnicalSkills());
    }

    // ── Pesos configurables ──

    @Test
    void losPesosConfiguradosCambianElScore() {
        MatchingWeightsProperties w = new MatchingWeightsProperties();
        w.setTechnical(1.0); // todo el peso de ajuste en técnicas
        w.setSoft(0.0);
        w.setExperience(0.0);
        w.setSalary(0.0);
        w.setWorkType(0.0);
        w.setLanguage(0.0);
        MatchingEngine soloTecnicas = new MatchingEngine(mock(MatchRepository.class), w);

        CandidateProfileModel c = candidate();
        c.setLanguages(null); // ya no debe importar

        assertEquals(100.0, soloTecnicas.calculateScore(c, vacancy()), 0.01);
    }

    // ── Afinidad vocacional ──

    /** Candidata claramente orientada a secretaria (experiencia, educación, certificación). */
    private CandidateProfileModel secretaria() {
        CandidateProfileModel c = new CandidateProfileModel();
        c.setWorkExperience(List.of(
                expWithTitle("Secretaria", "2020-01-01", "2024-01-01"),
                expWithTitle("Recepcionista", "2018-01-01", "2020-01-01")));
        c.setEducations(List.of(education("Administración de Empresas", "Universidad UDABOL")));
        c.setCertifications(List.of(certification("Secretariado Ejecutivo", "INCOS")));
        c.setTechnicalSkills(List.of(skill("Office", "AVANZADO")));
        c.setSoftSkills(List.of("Organización"));
        c.setExpectedSalary(salary(0, 3350));
        c.setWorkType("presencial La Paz");
        return c;
    }

    private VacancyModel vacantePuesto(String jobTitle, String department, double salMin, double salMax) {
        VacancyModel v = new VacancyModel();
        v.setJobTitle(jobTitle);
        v.setDepartment(department);
        v.setWorkAvailability("tiempo completo");
        v.setSalaryRange(vacancySalary(salMin, salMax));
        v.setExperienceLevel("sin experiencia");
        return v; // sin habilidades/idiomas requeridos, como en el caso real
    }

    private CandidateProfileModel.WorkExperience expWithTitle(String title, String start, String end) {
        CandidateProfileModel.WorkExperience w = experience(start, end);
        w.setTitle(title);
        return w;
    }

    private CandidateProfileModel.EducationEntry education(String degree, String institution) {
        CandidateProfileModel.EducationEntry e = new CandidateProfileModel.EducationEntry();
        e.setDegree(degree);
        e.setInstitution(institution);
        return e;
    }

    private CandidateProfileModel.CertificationEntry certification(String name, String institution) {
        CandidateProfileModel.CertificationEntry ce = new CandidateProfileModel.CertificationEntry();
        ce.setName(name);
        ce.setInstitution(institution);
        return ce;
    }

    @Test
    void priorizaVacantesAfinesAlPerfilDelCandidato() {
        CandidateProfileModel sec = secretaria();
        VacancyModel vSecretaria = vacantePuesto("Secretaria Recepcionista", "Administración", 1500, 3350);
        VacancyModel vDiseno = vacantePuesto("Diseñador Gráfico", "Diseño", 1000, 2000);

        double scoreSecretaria = engine.calculateScore(sec, vSecretaria);
        double scoreDiseno = engine.calculateScore(sec, vDiseno);

        assertTrue(scoreSecretaria > scoreDiseno,
                "La vacante afín (secretaria=" + scoreSecretaria + ") debe superar a la no afín (diseño=" + scoreDiseno + ")");
    }

    @Test
    void afinidadUsaCargoEducacionYCertificacion() {
        MatchBreakdown b = engine.calculateBreakdown(secretaria(),
                vacantePuesto("Secretaria", "Recepcion", 1500, 3350));
        assertTrue(b.affinityScore() > 0.0);
        assertTrue(b.matchedRoleKeywords().contains("secretaria"),
                "debe detectar 'secretaria' en la trayectoria → " + b.matchedRoleKeywords());
    }

    @Test
    void vacanteSinRequisitosNoInflaParaPerfilNoAfin() {
        // Vacante de diseño sin requisitos; una secretaria no debería llegar a ~100%.
        double score = engine.calculateScore(secretaria(), vacantePuesto("Diseñador Gráfico", "Diseño", 1000, 2000));
        assertTrue(score < 70.0, "un perfil no afín no debe inflar en una vacante sin requisitos → " + score);
    }

    @Test
    void vacanteSinTituloNoAplicaAfinidad() {
        // La vacante base no tiene jobTitle → la afinidad no aplica y no penaliza.
        MatchBreakdown b = engine.calculateBreakdown(candidate(), vacancy());
        assertEquals(100.0, b.totalScore(), 0.01);
    }

    @Test
    void cocineroNuncaSeraDisenadorNiSecretaria() {
        CandidateProfileModel cocinero = new CandidateProfileModel();
        cocinero.setWorkExperience(List.of(expWithTitle("Cocinero", "2019-01-01", "2024-01-01")));
        cocinero.setEducations(List.of(education("Gastronomía", "Instituto Culinario")));
        cocinero.setTechnicalSkills(List.of(skill("Cocina Internacional", "AVANZADO")));
        cocinero.setExpectedSalary(salary(0, 3000));
        cocinero.setWorkType("presencial La Paz");

        double enDiseno = engine.calculateScore(cocinero, vacantePuesto("Diseñador Gráfico", "Diseño", 1000, 2000));
        double enSecretaria = engine.calculateScore(cocinero, vacantePuesto("Secretaria", "Administración", 1500, 3000));
        double enCocina = engine.calculateScore(cocinero, vacantePuesto("Cocinero", "Cocina", 1500, 3000));

        // Un cocinero en un rubro ajeno queda muy bajo (filtro fuerte)...
        assertTrue(enDiseno < 20.0, "cocinero en diseño debe ser muy bajo → " + enDiseno);
        assertTrue(enSecretaria < 20.0, "cocinero en secretaria debe ser muy bajo → " + enSecretaria);
        // ...pero en su propio rubro sube claramente.
        assertTrue(enCocina > 45.0 && enCocina > enDiseno,
                "cocinero en cocina debe ser alto y superar a diseño → cocina=" + enCocina + " diseño=" + enDiseno);
    }
}
