package com.mahmudalam.jobportal.spring_boot_job_portal_app.repository;

import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.CandidateModel;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface CandidateRepository extends MongoRepository<CandidateModel, String> {
    // ESTA LÍNEA ES LA QUE FALTA Y CORRIGE EL ERROR
    Optional<CandidateModel> findByEmail(String email); 
}