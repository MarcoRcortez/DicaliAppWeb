package com.mahmudalam.jobportal.spring_boot_job_portal_app.controller;

import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.CompanyModel;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.repository.CompanyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/companies")
public class CompanyController {

    @Autowired
    private CompanyRepository companyRepo;

    @PostMapping("/verify-nit")
    public boolean verifyNit(@RequestBody String nit) {
        CompanyModel company = companyRepo.findByNit(nit);
        return company != null && company.isVerified();
    }

    @PostMapping("/register")
    public CompanyModel registerCompany(@RequestBody CompanyModel company) {
        company.setVerified(false);
        return companyRepo.save(company);
    }

    @GetMapping("/all")
    public List<CompanyModel> getAllCompanies() {
        return companyRepo.findAll();
    }

    @GetMapping("/pending")
    public List<CompanyModel> getPendingCompanies() {
        return companyRepo.findAll().stream()
                .filter(c -> !c.isVerified())
                .collect(Collectors.toList());
    }

    @PutMapping("/verify/{id}")
    public CompanyModel verifyCompany(@PathVariable String id) {
        CompanyModel company = companyRepo.findById(id).orElse(null);
        if (company != null) {
            company.setVerified(true);
            return companyRepo.save(company);
        }
        return null;
    }

    @GetMapping("/search/{nit}")
    public CompanyModel getCompanyByNit(@PathVariable String nit) {
        return companyRepo.findByNit(nit);
    }
}