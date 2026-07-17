package com.mahmudalam.jobportal.spring_boot_job_portal_app.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuración del LLM local (Ollama).
 * Binding relajado: ollama.base-url, ollama.model, ollama.connect-timeout-ms, etc.
 */
@Component
@ConfigurationProperties(prefix = "ollama")
@Data
public class OllamaProperties {
    private String baseUrl = "http://localhost:11434";
    private String model = "gemma3:1b";
    private int connectTimeoutMs = 3000;
    /** Un modelo pequeño (p.ej. gemma3:1b) en CPU puede tardar ~15s por respuesta; margen amplio. */
    private int readTimeoutMs = 60000;
    private boolean enabled = true;
}
