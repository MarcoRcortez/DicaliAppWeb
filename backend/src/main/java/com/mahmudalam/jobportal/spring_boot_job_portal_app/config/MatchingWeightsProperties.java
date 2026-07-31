package com.mahmudalam.jobportal.spring_boot_job_portal_app.config;

import jakarta.annotation.PostConstruct;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Pesos del motor de matching. Deben sumar 1.0.
 * Si no suman ~1.0 se registra un WARN al arrancar (no se lanza excepción ni se
 * normaliza en silencio: un typo de configuración no debe tumbar el matching).
 */
@Component
@ConfigurationProperties(prefix = "matching.weights")
@Data
@Slf4j
public class MatchingWeightsProperties {
    /** Afinidad con el rubro/trayectoria profesional (cargo, educación, certificaciones) */
    private double affinity = 0.30;
    private double technical = 0.30;
    private double soft = 0.15;
    private double experience = 0.10;
    private double salary = 0.05;
    private double workType = 0.05;
    private double language = 0.05;

    @PostConstruct
    public void validateSum() {
        double sum = affinity + technical + soft + experience + salary + workType + language;
        if (Math.abs(sum - 1.0) > 0.005) {
            log.warn("matching.weights.* no suman 1.0 (suman {}). Los scores pueden exceder o no alcanzar el 100%.", sum);
        }
    }
}
