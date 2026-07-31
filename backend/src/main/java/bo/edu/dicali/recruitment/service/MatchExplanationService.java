package bo.edu.dicali.recruitment.service;

import bo.edu.dicali.recruitment.model.CandidateProfileModel;
import bo.edu.dicali.recruitment.model.MatchBreakdown;
import bo.edu.dicali.recruitment.model.MatchModel;
import bo.edu.dicali.recruitment.model.VacancyModel;
import bo.edu.dicali.recruitment.repository.CandidateProfileRepository;
import bo.edu.dicali.recruitment.repository.MatchRepository;
import bo.edu.dicali.recruitment.repository.VacancyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Genera (y cachea) la explicación en lenguaje natural de un match.
 *
 * Estrategia on-demand con caché lazy: la explicación se calcula la primera vez
 * que alguien la pide y se persiste en el MatchModel. Se regenera si el match se
 * recalculó después de la última explicación (explanationGeneratedAt < calculatedAt).
 * Si Ollama no está disponible se devuelve un fallback determinístico SIN persistir,
 * para reintentar la próxima vez.
 */
@Service
@RequiredArgsConstructor
public class MatchExplanationService {

    private final MatchRepository matchRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final VacancyRepository vacancyRepository;
    private final MatchingEngine matchingEngine;
    private final OllamaService ollamaService;

    public String getOrGenerateExplanation(String matchId) {
        MatchModel match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match no encontrado."));

        boolean upToDate = match.getExplanation() != null
                && match.getExplanationGeneratedAt() != null
                && match.getCalculatedAt() != null
                && !match.getExplanationGeneratedAt().isBefore(match.getCalculatedAt());
        if (upToDate) {
            return match.getExplanation();
        }

        CandidateProfileModel candidate = match.getCandidateId() == null ? null
                : candidateProfileRepository.findById(match.getCandidateId()).orElse(null);
        VacancyModel vacancy = match.getVacancyId() == null ? null
                : vacancyRepository.findById(match.getVacancyId()).orElse(null);
        if (candidate == null || vacancy == null) {
            return "Match directo, sin comparación detallada disponible.";
        }

        MatchBreakdown b = matchingEngine.calculateBreakdown(candidate, vacancy);

        String system = "Eres un asistente de reclutamiento. Responde siempre en español, "
                + "en 3-4 frases como máximo. Usa únicamente los datos proporcionados, "
                + "no inventes habilidades ni cifras.";
        String user = buildPrompt(b, vacancy.getJobTitle());

        Optional<String> llmResult = ollamaService.complete(system, user);
        if (llmResult.isPresent()) {
            match.setExplanation(llmResult.get());
            match.setExplanationGeneratedAt(LocalDateTime.now());
            matchRepository.save(match);
            return llmResult.get();
        }

        // Ollama no disponible: fallback determinístico, no se persiste.
        return buildFallback(b);
    }

    private String buildPrompt(MatchBreakdown b, String jobTitle) {
        StringBuilder sb = new StringBuilder();
        sb.append("Explica en lenguaje natural por qué este candidato es (o no) compatible ")
          .append("con la vacante \"").append(jobTitle != null ? jobTitle : "sin título").append("\".\n\n");
        sb.append("Puntaje total de compatibilidad: ").append(Math.round(b.totalScore())).append("%.\n");
        sb.append("Afinidad vocacional con el rubro (").append(Math.round(b.affinityScore() * 100))
          .append("%, actúa como filtro que ajusta la compatibilidad): su trayectoria coincide en ")
          .append(fmt(b.matchedRoleKeywords())).append("; el rol menciona ")
          .append(fmt(b.missingRoleKeywords())).append(" que no aparecen en su experiencia/estudios.\n");
        sb.append("Habilidades técnicas coincidentes: ").append(fmt(b.matchedTechnicalSkills())).append(".\n");
        sb.append("Habilidades técnicas faltantes: ").append(fmt(b.missingTechnicalSkills())).append(".\n");
        sb.append("Habilidades blandas coincidentes: ").append(fmt(b.matchedSoftSkills())).append(".\n");
        sb.append("Habilidades blandas faltantes: ").append(fmt(b.missingSoftSkills())).append(".\n");
        sb.append("Años de experiencia del candidato: ")
          .append(String.format("%.1f", b.candidateYearsExperience()));
        if (b.minYearsRequired() != null) {
            sb.append(" (la vacante pide ").append(b.minYearsRequired()).append(" años)");
        }
        sb.append(".\n");
        sb.append("Idiomas coincidentes: ").append(fmt(b.matchedLanguages())).append(".\n");
        sb.append("Idiomas faltantes: ").append(fmt(b.missingLanguages())).append(".\n");
        sb.append("Compatibilidad de ubicación: ").append(Math.round(b.locationScore() * 100)).append("%.\n");
        return sb.toString();
    }

    private String buildFallback(MatchBreakdown b) {
        StringBuilder sb = new StringBuilder();
        sb.append("Compatibilidad del ").append(Math.round(b.totalScore())).append("%. ");
        if (!b.matchedRoleKeywords().isEmpty()) {
            sb.append("Afinidad con el rubro: ").append(fmt(b.matchedRoleKeywords())).append(". ");
        }
        if (!b.matchedTechnicalSkills().isEmpty()) {
            sb.append("Coincide en: ").append(fmt(b.matchedTechnicalSkills())).append(". ");
        }
        if (!b.missingTechnicalSkills().isEmpty()) {
            sb.append("Le faltan: ").append(fmt(b.missingTechnicalSkills())).append(". ");
        }
        if (b.minYearsRequired() != null) {
            sb.append("Experiencia: ").append(String.format("%.1f", b.candidateYearsExperience()))
              .append(" de ").append(b.minYearsRequired()).append(" años requeridos. ");
        }
        if (!b.missingLanguages().isEmpty()) {
            sb.append("Idiomas pendientes: ").append(fmt(b.missingLanguages())).append(". ");
        }
        if (b.locationScore() < 1.0) {
            sb.append("Ubicación: ")
              .append(b.locationScore() >= 0.5 ? "cercana (área metropolitana La Paz–El Alto)" : "en otra ciudad")
              .append(". ");
        }
        return sb.toString().trim();
    }

    private String fmt(List<String> items) {
        return (items == null || items.isEmpty()) ? "ninguna" : String.join(", ", items);
    }
}
