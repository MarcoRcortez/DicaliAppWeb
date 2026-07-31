package com.mahmudalam.jobportal.spring_boot_job_portal_app.service;

import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.CandidateProfileModel;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.CompanyProfileModel;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.VacancyModel;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.util.TextFormat;
import org.springframework.stereotype.Service;

/**
 * Normaliza mayúsculas de los "campos clave" antes de guardar (y en la migración).
 * Alcance: títulos de puesto, áreas, nombre de empresa, nombre de persona, educación
 * y certificaciones. NO toca habilidades técnicas, correos ni descripciones.
 */
@Service
public class NormalizationService {

    public void normalize(VacancyModel v) {
        v.setJobTitle(TextFormat.smartTitleCase(v.getJobTitle()));
        v.setDepartment(TextFormat.smartTitleCase(v.getDepartment()));
    }

    public void normalize(CompanyProfileModel c) {
        c.setCompanyName(TextFormat.smartTitleCase(c.getCompanyName()));
    }

    public void normalize(CandidateProfileModel p) {
        p.setFullName(TextFormat.smartTitleCase(p.getFullName()));
        if (p.getEducations() != null) {
            for (CandidateProfileModel.EducationEntry e : p.getEducations()) {
                e.setDegree(TextFormat.smartTitleCase(e.getDegree()));
                e.setInstitution(TextFormat.smartTitleCase(e.getInstitution()));
            }
        }
        if (p.getCertifications() != null) {
            for (CandidateProfileModel.CertificationEntry c : p.getCertifications()) {
                c.setName(TextFormat.smartTitleCase(c.getName()));
                c.setInstitution(TextFormat.smartTitleCase(c.getInstitution()));
            }
        }
    }
}
