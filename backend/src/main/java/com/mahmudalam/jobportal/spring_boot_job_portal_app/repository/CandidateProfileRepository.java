package com.mahmudalam.jobportal.spring_boot_job_portal_app.repository;

import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.CandidateProfileModel;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface CandidateProfileRepository extends MongoRepository<CandidateProfileModel, String> {
    Optional<CandidateProfileModel> findByUserId(String userId);
    List<CandidateProfileModel> findByProfileCompleteTrue();
}
