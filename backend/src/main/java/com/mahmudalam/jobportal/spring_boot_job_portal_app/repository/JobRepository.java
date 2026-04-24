package com.mahmudalam.jobportal.spring_boot_job_portal_app.repository;

import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.JobPostModel;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JobRepository extends MongoRepository<JobPostModel, String> {
}