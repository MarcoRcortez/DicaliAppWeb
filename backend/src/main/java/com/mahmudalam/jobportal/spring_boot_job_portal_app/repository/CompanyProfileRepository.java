package com.mahmudalam.jobportal.spring_boot_job_portal_app.repository;

import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.CompanyProfileModel;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface CompanyProfileRepository extends MongoRepository<CompanyProfileModel, String> {
    Optional<CompanyProfileModel> findByUserId(String userId);
    boolean existsByUserId(String userId);
}
