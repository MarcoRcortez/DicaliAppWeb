package com.mahmudalam.jobportal.spring_boot_job_portal_app.service;

import com.mahmudalam.jobportal.spring_boot_job_portal_app.config.OllamaProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Cliente del LLM local (Ollama).
 *
 * Contrato clave: NUNCA lanza excepción. Ante cualquier fallo (Ollama apagado,
 * timeout, JSON inesperado) devuelve Optional.empty(), de modo que el motor de
 * matching y los scores sigan funcionando sin el LLM.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OllamaService {

    private final RestTemplate ollamaRestTemplate;
    private final OllamaProperties props;

    public Optional<String> complete(String systemPrompt, String userPrompt) {
        if (!props.isEnabled()) {
            return Optional.empty();
        }
        try {
            Map<String, Object> body = Map.of(
                    "model", props.getModel(),
                    "stream", false,
                    "messages", List.of(
                            Map.of("role", "system", "content", systemPrompt),
                            Map.of("role", "user", "content", userPrompt)
                    )
            );

            Map<?, ?> responseBody = ollamaRestTemplate.postForObject(
                    props.getBaseUrl() + "/api/chat", body, Map.class);
            if (responseBody == null) {
                return Optional.empty();
            }
            Object messageObj = responseBody.get("message");
            if (!(messageObj instanceof Map<?, ?> message)) {
                return Optional.empty();
            }
            Object content = message.get("content");
            if (content == null || content.toString().isBlank()) {
                return Optional.empty();
            }
            return Optional.of(content.toString().trim());
        } catch (Exception e) {
            log.warn("Llamada a Ollama falló, se continúa sin salida del LLM: {}", e.getMessage());
            return Optional.empty();
        }
    }
}
