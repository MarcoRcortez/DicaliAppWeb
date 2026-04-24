package com.mahmudalam.jobportal.spring_boot_job_portal_app.model;

public class CandidateMatchDTO {
    private CandidateModel candidate;
    private double matchPercentage;

    public CandidateMatchDTO(CandidateModel candidate, double matchPercentage) {
        this.candidate = candidate;
        this.matchPercentage = matchPercentage;
    }

    public CandidateModel getCandidate() {
        return candidate;
    }

    public void setCandidate(CandidateModel candidate) {
        this.candidate = candidate;
    }

    public double getMatchPercentage() {
        return matchPercentage;
    }

    public void setMatchPercentage(double matchPercentage) {
        this.matchPercentage = matchPercentage;
    }
}