package com.mahmudalam.jobportal.spring_boot_job_portal_app.repository;

import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.VacancyModel;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface VacancyRepository extends MongoRepository<VacancyModel, String> {
    List<VacancyModel> findByStatus(String status);
    List<VacancyModel> findByRecruiterId(String recruiterId);
    List<VacancyModel> findByStatusNot(String status);
}
