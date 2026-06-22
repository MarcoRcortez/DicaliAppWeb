package com.mahmudalam.jobportal.spring_boot_job_portal_app.controller;

import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.CompanyModel;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.repository.CompanyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/companies")
@CrossOrigin(origins = "http://localhost:5173") // Permitir conexión desde Vite
public class CompanyController {

    @Autowired
    private CompanyRepository repository;

    @GetMapping("/all")
    public List<CompanyModel> getAllCompanies() {
        return repository.findAll();
    }

    // Usado por RegisterCompany.jsx: alta de una empresa nueva, pendiente de auditoría
    @PostMapping("/register")
    public ResponseEntity<CompanyModel> register(@RequestBody @NonNull CompanyModel company) {
        try {
            company.setStatus("PENDIENTE");
            company.setVerified(false);
            return ResponseEntity.ok(repository.save(company));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/save")
    public ResponseEntity<CompanyModel> saveOrUpdate(@RequestBody @NonNull CompanyModel companyName) {
        try {
            // repository.save maneja creación y actualización automáticamente
            CompanyModel saved = repository.save(companyName);
            return ResponseEntity.ok().body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Usado por AuditCompanies.jsx para listar empresas a auditar
    @GetMapping("/pending")
    public List<CompanyModel> getPendingCompanies() {
        return repository.findAll().stream()
                .filter(c -> !c.isVerified())
                .toList();
    }

    // Usado por AuditCompanies.jsx para aprobar una empresa
    @PutMapping("/verify/{id}")
    public ResponseEntity<CompanyModel> verifyCompany(@PathVariable @NonNull String id) {
        return repository.findById(id).map(company -> {
            company.setVerified(true);
            company.setStatus("VERIFICADO");
            return ResponseEntity.ok(repository.save(company));
        }).orElse(ResponseEntity.notFound().build());
    }

    // Usado por CreatePost.jsx antes de permitir publicar una vacante: ¿esta empresa ya está verificada?
    @PostMapping(value = "/verify-nit", consumes = "text/plain")
    public ResponseEntity<Boolean> verifyNit(@RequestBody String nit) {
        CompanyModel company = repository.findByNit(nit.trim());
        return ResponseEntity.ok(company != null && company.isVerified());
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteCompany(@PathVariable String id) {
        try {
            if (id != null && repository.existsById(id)) {
                repository.deleteById(id);
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}