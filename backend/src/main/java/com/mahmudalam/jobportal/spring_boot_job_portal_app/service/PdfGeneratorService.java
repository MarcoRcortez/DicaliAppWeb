package com.mahmudalam.jobportal.spring_boot_job_portal_app.service;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.CandidateModel;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;

@Service
public class PdfGeneratorService {

    public byte[] generateCandidatePdf(CandidateModel candidate) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            PdfWriter writer = new PdfWriter(out);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            document.add(new Paragraph("CURRICULUM VITAE DIGITAL - DICALI").setFontSize(20).setBold());
            document.add(new Paragraph("Nombre: " + candidate.getFullName()));
            document.add(new Paragraph("Correo: " + candidate.getEmail()));
            document.add(new Paragraph("Educación: " + candidate.getEducation()));
            document.add(new Paragraph("Experiencia: " + candidate.getExperienceYears() + " años"));
            document.add(new Paragraph("Habilidades: " + String.join(", ", candidate.getSkills())));

            document.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return out.toByteArray();
    }
}