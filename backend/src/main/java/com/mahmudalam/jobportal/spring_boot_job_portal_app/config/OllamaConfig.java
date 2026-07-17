package com.mahmudalam.jobportal.spring_boot_job_portal_app.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * Bean RestTemplate dedicado a las llamadas a Ollama, con timeouts propios
 * para que una demora del LLM no afecte al resto de la aplicación.
 */
@Configuration
@RequiredArgsConstructor
public class OllamaConfig {

    private final OllamaProperties props;

    @Bean
    public RestTemplate ollamaRestTemplate(RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(Duration.ofMillis(props.getConnectTimeoutMs()))
                .setReadTimeout(Duration.ofMillis(props.getReadTimeoutMs()))
                .build();
    }
}
