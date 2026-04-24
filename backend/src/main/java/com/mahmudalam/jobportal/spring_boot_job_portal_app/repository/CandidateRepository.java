package com.mahmudalam.jobportal.spring_boot_job_portal_app.repository;

import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.CandidateModel;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CandidateRepository extends MongoRepository<CandidateModel, String> {
    // Aquí podremos añadir búsquedas personalizadas más adelante para el algoritmo de matching
}