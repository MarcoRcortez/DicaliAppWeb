package com.mahmudalam.jobportal.spring_boot_job_portal_app.repository;

import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.MatchModel;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface MatchRepository extends MongoRepository<MatchModel, String> {
    List<MatchModel> findByCandidateIdOrderByScoreDesc(String candidateId);
    List<MatchModel> findByVacancyIdOrderByScoreDesc(String vacancyId);
    List<MatchModel> findByCandidateIdAndStatus(String candidateId, String status);
    List<MatchModel> findByVacancyIdAndStatus(String vacancyId, String status);
    Optional<MatchModel> findByCandidateIdAndVacancyId(String candidateId, String vacancyId);
    List<MatchModel> findByCandidateIdAndStatusAndCandidateNotifiedFalse(String candidateId, String status);
    long countByStatus(String status);
}
