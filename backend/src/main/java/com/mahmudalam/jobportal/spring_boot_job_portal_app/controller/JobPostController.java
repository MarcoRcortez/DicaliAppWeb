package com.mahmudalam.jobportal.spring_boot_job_portal_app.controller;

import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.JobPostModel;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.repository.JobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobPosts")
@CrossOrigin(origins = "http://localhost:5173")
public class JobPostController {

    @Autowired
    private JobRepository repository;

    // Usado por Feed.jsx, JobBoard.jsx y AdminJobs.jsx
    @GetMapping("/all")
    public List<JobPostModel> getAllJobs() {
        return repository.findAll();
    }

    // Usado por PostJob.jsx (publicación simple desde una empresa ya registrada)
    @PostMapping("/register")
    public ResponseEntity<JobPostModel> register(@RequestBody @NonNull JobPostModel job) {
        return ResponseEntity.ok(repository.save(job));
    }

    // Usado por CreatePost.jsx (publicación auditada tras verificar el NIT)
    @PostMapping("/add")
    public ResponseEntity<JobPostModel> add(@RequestBody @NonNull JobPostModel job) {
        return ResponseEntity.ok(repository.save(job));
    }

    // Usado por AdminDashboard.jsx para crear/editar filas de la bolsa de trabajo
    @PostMapping("/save")
    public ResponseEntity<JobPostModel> saveOrUpdate(@RequestBody @NonNull JobPostModel job) {
        try {
            return ResponseEntity.ok(repository.save(job));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Usado por AdminJobs.jsx y AdminDashboard.jsx
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable @NonNull String id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
