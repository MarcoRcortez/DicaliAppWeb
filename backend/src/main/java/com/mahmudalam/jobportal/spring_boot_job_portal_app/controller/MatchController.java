package com.mahmudalam.jobportal.spring_boot_job_portal_app.controller;

import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.*;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.repository.*;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.service.MatchingEngine;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.service.MatchExplanationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/matches")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class MatchController {

    private final MatchRepository matchRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final VacancyRepository vacancyRepository;
    private final MatchingEngine matchingEngine;
    private final MatchExplanationService matchExplanationService;

    /** Vacantes recomendadas para un candidato (ordenadas por score) */
    @GetMapping("/candidate/{candidateId}")
    public List<MatchModel> getForCandidate(@PathVariable String candidateId) {
        return matchRepository.findByCandidateIdOrderByScoreDesc(candidateId);
    }

    /** Candidatos rankeados para una vacante (ordenados por score) */
    @GetMapping("/vacancy/{vacancyId}")
    public List<MatchModel> getForVacancy(@PathVariable String vacancyId) {
        return matchRepository.findByVacancyIdOrderByScoreDesc(vacancyId);
    }

    /** Matches confirmados para el candidato (SECTOR MATCHES en EMPLEOS) */
    @GetMapping("/candidate/{candidateId}/confirmed")
    public List<MatchModel> getConfirmedForCandidate(@PathVariable String candidateId) {
        return matchRepository.findByCandidateIdAndStatus(candidateId, "MATCHED");
    }

    /** Matches confirmados para el reclutador (SECTOR MATCHES en POSTULANTES) */
    @GetMapping("/vacancy/{vacancyId}/confirmed")
    public List<MatchModel> getConfirmedForVacancy(@PathVariable String vacancyId) {
        return matchRepository.findByVacancyIdAndStatus(vacancyId, "MATCHED");
    }

    /** Nuevas notificaciones para el candidato (pop-up al cargar EMPLEOS) */
    @GetMapping("/candidate/{candidateId}/new-notifications")
    public List<MatchModel> getNewNotifications(@PathVariable String candidateId) {
        return matchRepository.findByCandidateIdAndStatusAndCandidateNotifiedFalse(candidateId, "MATCHED");
    }

    /** Marcar notificaciones como vistas */
    @PutMapping("/candidate/{candidateId}/mark-notified")
    public ResponseEntity<?> markNotified(@PathVariable String candidateId) {
        List<MatchModel> pending = matchRepository.findByCandidateIdAndStatusAndCandidateNotifiedFalse(candidateId, "MATCHED");
        for (MatchModel m : pending) {
            m.setCandidateNotified(true);
            matchRepository.save(m);
        }
        return ResponseEntity.ok(Map.of("marked", pending.size()));
    }

    /**
     * El candidato se postula (o retira su postulación) a una vacante concreta.
     *
     * Marca únicamente `candidateApplied`: NO cambia el `status`, porque la
     * confirmación del match sigue siendo decisión de la empresa. Si el match aún
     * no existía, se crea calculando el score real con el motor.
     */
    @PutMapping("/apply")
    public ResponseEntity<?> applyToVacancy(@RequestBody Map<String, Object> body) {
        String candidateId = (String) body.get("candidateId");
        String vacancyId   = (String) body.get("vacancyId");
        boolean applied = !Boolean.FALSE.equals(body.get("applied")); // por defecto true

        if (candidateId == null || vacancyId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Faltan candidateId o vacancyId."));
        }

        VacancyModel vacancy = vacancyRepository.findById(vacancyId).orElse(null);
        if (vacancy == null) {
            return ResponseEntity.notFound().build();
        }

        MatchModel match = matchRepository
                .findByCandidateIdAndVacancyId(candidateId, vacancyId)
                .orElse(null);

        if (match == null) {
            // Aún no había match calculado para este par: crearlo con el score real
            CandidateProfileModel candidate = candidateProfileRepository.findById(candidateId).orElse(null);
            if (candidate == null) {
                return ResponseEntity.notFound().build();
            }
            match = new MatchModel();
            match.setCandidateId(candidateId);
            match.setVacancyId(vacancyId);
            match.setRecruiterId(vacancy.getRecruiterId());
            match.setCompanyName(vacancy.getCompanyName());
            match.setScore(matchingEngine.calculateScore(candidate, vacancy));
            match.setStatus("PENDING");
            match.setCalculatedAt(LocalDateTime.now());
            match.setJobTitle(vacancy.getJobTitle());
            match.setDepartment(vacancy.getDepartment());
            match.setDescription(vacancy.getDescription());
            match.setExperienceLevel(vacancy.getExperienceLevel());
            match.setWorkAvailability(vacancy.getWorkAvailability());
            if (vacancy.getSalaryRange() != null) {
                match.setSalaryMin(vacancy.getSalaryRange().getMin());
                match.setSalaryMax(vacancy.getSalaryRange().getMax());
            }
        }

        match.setCandidateApplied(applied);
        match.setAppliedAt(applied ? LocalDateTime.now() : null);
        matchRepository.save(match);

        return ResponseEntity.ok(Map.of(
                "message", applied ? "Postulación registrada." : "Postulación retirada.",
                "matchId", match.getId(),
                "candidateApplied", applied
        ));
    }

    /** Empresa hace MATCH con un candidato */
    @PutMapping("/{matchId}/accept")
    public ResponseEntity<?> acceptMatch(@PathVariable String matchId) {
        return matchRepository.findById(matchId)
                .map(match -> {
                    match.setStatus("MATCHED");
                    match.setActionAt(LocalDateTime.now());
                    match.setCandidateNotified(false);
                    matchRepository.save(match);
                    return ResponseEntity.ok(Map.of("message", "Match confirmado."));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /** Empresa rechaza un candidato (elimina la tarjeta de ambos lados) */
    @PutMapping("/{matchId}/reject")
    public ResponseEntity<?> rejectMatch(@PathVariable String matchId) {
        return matchRepository.findById(matchId)
                .map(match -> {
                    match.setStatus("REJECTED");
                    match.setActionAt(LocalDateTime.now());
                    matchRepository.save(match);
                    return ResponseEntity.ok(Map.of("message", "Candidato rechazado."));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /** Reclutador actualiza la tarjeta de match (modificar datos visibles) */
    @PutMapping("/{matchId}")
    public ResponseEntity<?> updateMatch(@PathVariable String matchId, @RequestBody MatchModel updated) {
        return matchRepository.findById(matchId)
                .map(match -> {
                    updated.setId(matchId);
                    return ResponseEntity.ok(matchRepository.save(updated));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /** Reclutador elimina la tarjeta de match de su sector */
    @DeleteMapping("/{matchId}")
    public ResponseEntity<?> deleteMatch(@PathVariable String matchId) {
        matchRepository.deleteById(matchId);
        return ResponseEntity.ok(Map.of("message", "Tarjeta eliminada."));
    }

    /**
     * Empresa confirma match con un candidato para una vacante concreta.
     *
     * El reclutador elige explícitamente la vacante (`vacancyId`). Si no la envía, se usa
     * aquella con la que el candidato tiene mejor score — nunca una vacante arbitraria.
     * Si el match no estaba precalculado, el score se calcula con el motor (no se inventa).
     */
    @PostMapping("/direct")
    public ResponseEntity<?> directMatch(@RequestBody Map<String, String> body) {
        String candidateId = body.get("candidateId");
        String recruiterId = body.get("recruiterId");
        String companyName = body.get("companyName");
        String vacancyId   = body.get("vacancyId");

        List<VacancyModel> myVacancies = vacancyRepository.findByRecruiterId(recruiterId);
        if (myVacancies.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No tienes vacantes creadas."));
        }

        // 1. Determinar la vacante objetivo
        VacancyModel target;
        if (vacancyId != null && !vacancyId.isBlank()) {
            target = myVacancies.stream()
                    .filter(v -> vacancyId.equals(v.getId()))
                    .findFirst()
                    .orElse(null);
            if (target == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "La vacante indicada no pertenece a este reclutador."));
            }
        } else {
            // Sin selección explícita: la de mejor score (determinístico, no "la primera")
            target = myVacancies.get(0);
            double best = -1;
            for (VacancyModel v : myVacancies) {
                var m = matchRepository.findByCandidateIdAndVacancyId(candidateId, v.getId());
                if (m.isPresent() && m.get().getScore() > best) {
                    best = m.get().getScore();
                    target = v;
                }
            }
        }

        // 2. Confirmar el match existente para esa vacante, o crearlo con score real
        var existing = matchRepository.findByCandidateIdAndVacancyId(candidateId, target.getId());
        MatchModel match = existing.orElseGet(MatchModel::new);

        if (existing.isEmpty()) {
            CandidateProfileModel candidate = candidateProfileRepository.findById(candidateId).orElse(null);
            double score = (candidate != null) ? matchingEngine.calculateScore(candidate, target) : 0.0;
            match.setCandidateId(candidateId);
            match.setVacancyId(target.getId());
            match.setScore(score);
            match.setCalculatedAt(LocalDateTime.now());
        }

        // Snapshot de la vacante elegida (lo que verá el candidato)
        match.setRecruiterId(recruiterId);
        match.setCompanyName(companyName != null ? companyName : target.getCompanyName());
        match.setJobTitle(target.getJobTitle());
        match.setDepartment(target.getDepartment());
        match.setDescription(target.getDescription());
        match.setExperienceLevel(target.getExperienceLevel());
        match.setWorkAvailability(target.getWorkAvailability());
        if (target.getSalaryRange() != null) {
            match.setSalaryMin(target.getSalaryRange().getMin());
            match.setSalaryMax(target.getSalaryRange().getMax());
        }
        match.setStatus("MATCHED");
        match.setActionAt(LocalDateTime.now());
        match.setCandidateNotified(false);

        matchRepository.save(match);
        return ResponseEntity.ok(Map.of(
                "message", "Match confirmado.",
                "matchId", match.getId(),
                "jobTitle", target.getJobTitle() != null ? target.getJobTitle() : ""
        ));
    }

    /** Candidato guarda perfil y se ejecuta matching automático */
    @PostMapping("/run-for-candidate/{candidateId}")
    public ResponseEntity<?> runMatchingForCandidate(@PathVariable String candidateId) {
        CandidateProfileModel candidate = candidateProfileRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidato no encontrado."));
        List<VacancyModel> openVacancies = vacancyRepository.findByStatus("Abierta");
        matchingEngine.runForCandidate(candidate, openVacancies);
        return ResponseEntity.ok(Map.of("message", "Matching ejecutado.", "vacancies", openVacancies.size()));
    }

    /** Recalcula matching de TODAS las vacantes del reclutador contra TODOS los candidatos */
    @PostMapping("/run-for-recruiter/{recruiterId}")
    public ResponseEntity<?> runMatchingForRecruiter(@PathVariable String recruiterId) {
        List<VacancyModel> myVacancies = vacancyRepository.findByRecruiterId(recruiterId);
        List<CandidateProfileModel> allCandidates = candidateProfileRepository.findAll();

        if (myVacancies.isEmpty()) {
            return ResponseEntity.ok(Map.of("message", "No tienes vacantes creadas.", "matched", 0));
        }

        int count = 0;
        for (VacancyModel v : myVacancies) {
            for (CandidateProfileModel c : allCandidates) {
                matchingEngine.runForVacancy(v, java.util.List.of(c));
                count++;
            }
        }
        return ResponseEntity.ok(Map.of("message", "Matching ejecutado.", "matched", count));
    }

    /** Obtiene scores calculados de todos los candidatos para un reclutador (agrupado por candidato, mejor score) */
    @GetMapping("/recruiter/{recruiterId}/scores")
    public ResponseEntity<?> getScoresForRecruiter(@PathVariable String recruiterId) {
        List<VacancyModel> myVacancies = vacancyRepository.findByRecruiterId(recruiterId);

        // Recopilar el mejor score por candidato entre todas las vacantes
        java.util.Map<String, MatchModel> bestByCandidate = new java.util.HashMap<>();
        for (VacancyModel v : myVacancies) {
            List<MatchModel> matches = matchRepository.findByVacancyIdOrderByScoreDesc(v.getId());
            for (MatchModel m : matches) {
                MatchModel existing = bestByCandidate.get(m.getCandidateId());
                if (existing == null || m.getScore() > existing.getScore()) {
                    bestByCandidate.put(m.getCandidateId(), m);
                }
            }
        }
        return ResponseEntity.ok(bestByCandidate);
    }

    /**
     * Reporte de contratación para la empresa: por cada vacante y en total, cuántos
     * candidatos se postularon, cuántos fueron conectados (MATCHED), rechazados
     * (REJECTED) y cuántos siguen sin respuesta (postulados pero PENDING), más la
     * compatibilidad promedio de los postulantes y las postulaciones del mes actual.
     */
    @GetMapping("/recruiter/{recruiterId}/report")
    public ResponseEntity<?> getRecruiterReport(@PathVariable String recruiterId) {
        List<VacancyModel> myVacancies = vacancyRepository.findByRecruiterId(recruiterId);

        List<Map<String, Object>> porVacante = new java.util.ArrayList<>();
        int totPostulados = 0, totConectados = 0, totRechazados = 0, totSinResponder = 0, totMes = 0;
        double sumaCompat = 0;
        int contCompat = 0;
        List<Map<String, Object>> sinResponderLista = new java.util.ArrayList<>();
        List<Map<String, Object>> postulantes = new java.util.ArrayList<>();
        LocalDateTime inicioMes = LocalDateTime.now().withDayOfMonth(1).toLocalDate().atStartOfDay();

        for (VacancyModel v : myVacancies) {
            List<MatchModel> matches = matchRepository.findByVacancyIdOrderByScoreDesc(v.getId());

            int postulados = 0, conectados = 0, rechazados = 0, sinResponder = 0;
            double sumaV = 0;
            int contV = 0;

            for (MatchModel m : matches) {
                if ("MATCHED".equals(m.getStatus())) conectados++;
                if ("REJECTED".equals(m.getStatus())) rechazados++;
                if (m.isCandidateApplied()) {
                    postulados++;
                    sumaV += m.getScore();
                    contV++;
                    postulantes.add(Map.of(
                            "candidateId", m.getCandidateId() != null ? m.getCandidateId() : "",
                            "vacancyId", v.getId(),
                            "jobTitle", v.getJobTitle() != null ? v.getJobTitle() : "",
                            "score", m.getScore(),
                            "status", m.getStatus() != null ? m.getStatus() : "PENDING",
                            "appliedAt", m.getAppliedAt() != null ? m.getAppliedAt().toString() : ""
                    ));
                    if ("PENDING".equals(m.getStatus())) {
                        sinResponder++;
                        sinResponderLista.add(Map.of(
                                "candidateId", m.getCandidateId() != null ? m.getCandidateId() : "",
                                "jobTitle", v.getJobTitle() != null ? v.getJobTitle() : "",
                                "score", m.getScore(),
                                "appliedAt", m.getAppliedAt() != null ? m.getAppliedAt().toString() : ""
                        ));
                    }
                    if (m.getAppliedAt() != null && m.getAppliedAt().isAfter(inicioMes)) totMes++;
                }
            }

            porVacante.add(Map.of(
                    "vacancyId", v.getId(),
                    "jobTitle", v.getJobTitle() != null ? v.getJobTitle() : "",
                    "postulados", postulados,
                    "conectados", conectados,
                    "rechazados", rechazados,
                    "sinResponder", sinResponder,
                    "compatibilidadProm", contV > 0 ? Math.round(sumaV / contV) : 0
            ));

            totPostulados += postulados;
            totConectados += conectados;
            totRechazados += rechazados;
            totSinResponder += sinResponder;
            sumaCompat += sumaV;
            contCompat += contV;
        }

        Map<String, Object> resumen = new java.util.HashMap<>();
        resumen.put("totalVacantes", myVacancies.size());
        resumen.put("postulados", totPostulados);
        resumen.put("conectados", totConectados);
        resumen.put("rechazados", totRechazados);
        resumen.put("sinResponder", totSinResponder);
        resumen.put("postulacionesDelMes", totMes);
        resumen.put("compatibilidadPromedio", contCompat > 0 ? (int) Math.round(sumaCompat / contCompat) : 0);

        // Ordenar los postulantes por compatibilidad descendente (los más afines primero)
        postulantes.sort((a, b) -> Double.compare(
                ((Number) b.get("score")).doubleValue(), ((Number) a.get("score")).doubleValue()));

        return ResponseEntity.ok(Map.of(
                "resumen", resumen,
                "porVacante", porVacante,
                "sinResponderLista", sinResponderLista,
                "postulantes", postulantes
        ));
    }

    /** Explicación del match en lenguaje natural (generada por LLM, on-demand y cacheada) */
    @GetMapping("/{matchId}/explanation")
    public ResponseEntity<?> getExplanation(@PathVariable String matchId) {
        try {
            String text = matchExplanationService.getOrGenerateExplanation(matchId);
            return ResponseEntity.ok(Map.of("explanation", text));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
