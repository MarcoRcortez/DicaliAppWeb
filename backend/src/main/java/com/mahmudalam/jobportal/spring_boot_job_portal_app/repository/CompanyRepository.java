package com.mahmudalam.jobportal.spring_boot_job_portal_app.repository;

import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.CompanyModel;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CompanyRepository extends MongoRepository<CompanyModel, String> {
    CompanyModel findByNit(String nit);
}