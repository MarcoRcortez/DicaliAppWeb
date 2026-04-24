package com.mahmudalam.jobportal.spring_boot_job_portal_app.controller;

import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.CandidateModel;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.CandidateMatchDTO;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.JobPostModel;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.repository.CandidateRepository;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.repository.JobRepository;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.service.MatchingService;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.service.PdfGeneratorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/candidates")
public class CandidateController {

    @Autowired
    private CandidateRepository repo;

    @Autowired
    private MatchingService matchingService;

    @Autowired
    private JobRepository jobRepo;

    @Autowired
    private PdfGeneratorService pdfService;

    @GetMapping("/all")
    public List<CandidateModel> getAllCandidates() {
        return repo.findAll();
    }

    @PostMapping("/register")
    public CandidateModel saveCandidate(@RequestBody CandidateModel candidate) {
        return repo.save(candidate);
    }

    @GetMapping("/profile/{email}")
    public CandidateModel getCandidateByEmail(@PathVariable String email) {
        return repo.findAll().stream()
                .filter(c -> c.getEmail().equalsIgnoreCase(email))
                .findFirst()
                .orElse(null);
    }

    @GetMapping("/match/{jobId}")
    public List<CandidateMatchDTO> getBestCandidates(@PathVariable String jobId) {
        JobPostModel job = jobRepo.findById(jobId).orElse(null);
        List<CandidateModel> allCandidates = repo.findAll();
        
        return allCandidates.stream()
            .map(c -> new CandidateMatchDTO(c, matchingService.calculateMatchScore(c, job)))
            .filter(dto -> dto.getMatchPercentage() > 50)
            .sorted((a, b) -> Double.compare(b.getMatchPercentage(), a.getMatchPercentage()))
            .collect(Collectors.toList());
    }

    @GetMapping("/download/{email}")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable String email) {
        CandidateModel candidate = getCandidateByEmail(email);
        if (candidate == null) return ResponseEntity.notFound().build();

        byte[] pdfBytes = pdfService.generateCandidatePdf(candidate);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=CV_" + candidate.getName() + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}