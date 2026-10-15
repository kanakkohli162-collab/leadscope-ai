package com.leadscope.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * One place that calls Google Gemini (same key + model settings as before: gemini.key, gemini.model).
 * Used by Write Message and the Insights "AI summary".
 */
@Service
public class GeminiClient {

    /** Why Gemini could not answer, in plain words for the page. */
    public static class AiUnavailable extends RuntimeException {
        private final String reason;   // "busy", "limit", "off"

        public AiUnavailable(String reason, String message) {
            super(message);
            this.reason = reason;
        }

        public String reason() {
            return reason;
        }
    }

    private final String apiKey;
    private final String model;
    private final RestClient restClient = RestClient.create();

    public GeminiClient(@Value("${gemini.key:}") String apiKey,
                        @Value("${gemini.model:gemini-2.5-flash}") String model) {
        this.apiKey = apiKey;
        this.model = model;
    }

    public boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    /** Sends a prompt, returns the text answer. `json` = ask Gemini to answer with JSON only. */
    @SuppressWarnings("unchecked")
    public String ask(String prompt, boolean json) {
        if (!isEnabled()) throw new AiUnavailable("off", "AI is not set up, so a ready-made template was used.");
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent";
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))));
        if (json) body.put("generationConfig", Map.of("responseMimeType", "application/json"));

        try {
            Map<String, Object> response = restClient.post()
                    .uri(url)
                    .header("x-goog-api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            String text = (String) parts.get(0).get("text");
            if (text == null || text.isBlank()) throw new AiUnavailable("busy", "The AI gave an empty answer. Please try again.");
            return text.trim();
        } catch (HttpStatusCodeException e) {
            if (e.getStatusCode().value() == 429) {
                throw new AiUnavailable("limit", "The AI's free limit is reached for now. Please try again in a minute.");
            }
            throw new AiUnavailable("busy", "The AI is busy right now. Please try again in a minute.");
        } catch (AiUnavailable e) {
            throw e;
        } catch (Exception e) {
            throw new AiUnavailable("busy", "The AI is busy right now. Please try again in a minute.");
        }
    }
}
