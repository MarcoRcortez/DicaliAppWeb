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

    /** Empresa hace match directo con un candidato (sin match precalculado) */
    @PostMapping("/direct")
    public ResponseEntity<?> directMatch(@RequestBody Map<String, String> body) {
        String candidateId = body.get("candidateId");
        String recruiterId = body.get("recruiterId");
        String companyName = body.get("companyName");

        // Buscar si ya existe un match entre este candidato y alguna vacante del reclutador
        List<VacancyModel> myVacancies = vacancyRepository.findByRecruiterId(recruiterId);
        for (VacancyModel v : myVacancies) {
            var existing = matchRepository.findByCandidateIdAndVacancyId(candidateId, v.getId());
            if (existing.isPresent()) {
                MatchModel m = existing.get();
                m.setStatus("MATCHED");
                m.setActionAt(LocalDateTime.now());
                m.setCandidateNotified(false);
                matchRepository.save(m);
                return ResponseEntity.ok(Map.of("message", "Match confirmado.", "matchId", m.getId()));
            }
        }

        // Si no hay match previo, crear uno nuevo directamente
        MatchModel match = new MatchModel();
        match.setCandidateId(candidateId);
        match.setRecruiterId(recruiterId);
        match.setCompanyName(companyName != null ? companyName : "Empresa");
        match.setScore(100);
        match.setStatus("MATCHED");
        match.setCalculatedAt(LocalDateTime.now());
        match.setActionAt(LocalDateTime.now());
        match.setCandidateNotified(false);

        if (!myVacancies.isEmpty()) {
            VacancyModel v = myVacancies.get(0);
            match.setVacancyId(v.getId());
            match.setJobTitle(v.getJobTitle());
            match.setDepartment(v.getDepartment());
            match.setDescription(v.getDescription());
        } else {
            match.setJobTitle("Match directo");
            match.setDepartment("-");
        }

        matchRepository.save(match);
        return ResponseEntity.ok(Map.of("message", "Match directo creado.", "matchId", match.getId()));
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
