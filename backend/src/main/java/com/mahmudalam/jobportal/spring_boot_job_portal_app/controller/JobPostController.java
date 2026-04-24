package com.mahmudalam.jobportal.spring_boot_job_portal_app.controller;

import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.JobPostModel;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.repository.JobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/jobPosts")
public class JobPostController {

    @Autowired
    private JobRepository repo;

    @GetMapping("/all")
    public List<JobPostModel> getAllPosts() {
        return repo.findAll();
    }

    @PostMapping("/add")
    public JobPostModel addPost(@RequestBody JobPostModel post) {
        return repo.save(post);
    }

    @GetMapping("/stats")
    public Map<String, Long> getStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("totalJobs", repo.count());
        return stats;
    }

    @PutMapping("/update/{id}")
    public JobPostModel updatePost(@PathVariable String id, @RequestBody JobPostModel updatedPost) {
        return repo.findById(id).map(post -> {
            post.setProfile(updatedPost.getProfile());
            post.setDesc(updatedPost.getDesc());
            post.setExp(updatedPost.getExp());
            post.setTechs(updatedPost.getTechs());
            post.setWhatsappLink(updatedPost.getWhatsappLink());
            return repo.save(post);
        }).orElse(null);
    }

    @DeleteMapping("/delete/{id}")
    public void deletePost(@PathVariable String id) {
        repo.deleteById(id);
    }
}