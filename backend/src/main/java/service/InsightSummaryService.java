package com.leadscope.backend.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.util.*;

/**
 * Insights "AI summary": Gemini reads the page's aggregated counts (totals, percentages, top categories / areas —
 * never names, phones or addresses) and returns a short paragraph + 3 recommendations.
 */
@Service
public class InsightSummaryService {

    private static final int MAX_INPUT_CHARS = 4000;
    private static final int MAX_DEPTH = 3;
    private static final JsonMapper JSON = JsonMapper.builder().build();

    private final GeminiClient gemini;

    public InsightSummaryService(GeminiClient gemini) {
        this.gemini = gemini;
    }

    public Map<String, Object> summarise(Map<String, Object> counts) {
        String data = JSON.writeValueAsString(clean(counts, 0));
        if (data.length() > MAX_INPUT_CHARS) data = data.substring(0, MAX_INPUT_CHARS);

        String prompt = "You are a sales analyst for a digital marketing agency in India that sells websites, "
                + "Google listing / social media and review management to local businesses.\n"
                + "Here are counts about the agency's saved leads (JSON): " + data + "\n"
                + "Write a short summary (2-3 simple sentences) of what the data shows, and exactly 3 practical "
                + "recommendations (one sentence each) for what to do next. Use the numbers. Plain words, no jargon.\n"
                + "Answer with JSON only: {\"summary\":\"...\",\"recommendations\":[\"...\",\"...\",\"...\"]}";
        try {
            String answer = gemini.ask(prompt, true).replaceAll("(?s)^```(?:json)?\\s*|\\s*```$", "");
            JsonNode node = JSON.readTree(answer);
            String summary = node.path("summary").asString("").trim();
            List<String> recs = new ArrayList<>();
            for (JsonNode r : node.path("recommendations")) {
                String t = r.asString("").trim();
                if (!t.isEmpty() && recs.size() < 3) recs.add(t);
            }
            if (summary.isEmpty() || recs.isEmpty()) throw new IllegalStateException("empty answer");
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("summary", summary);
            result.put("recommendations", recs);
            return result;
        } catch (GeminiClient.AiUnavailable e) {
            HttpStatus status = e.reason().equals("limit") ? HttpStatus.TOO_MANY_REQUESTS : HttpStatus.SERVICE_UNAVAILABLE;
            String message = e.reason().equals("off") ? "AI summary is not available right now (AI is not set up)." : e.getMessage();
            throw new ResponseStatusException(status, message);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "The AI is busy right now. Please try again in a minute.");
        }
    }

    /** Keeps only numbers, booleans, short text and small lists / maps (so nothing big or odd reaches the AI). */
    private Object clean(Object value, int depth) {
        if (value == null || value instanceof Number || value instanceof Boolean) return value;
        if (value instanceof String s) return s.length() > 60 ? s.substring(0, 60) : s;
        if (depth >= MAX_DEPTH) return null;
        if (value instanceof Map<?, ?> map) {
            Map<String, Object> out = new LinkedHashMap<>();
            map.entrySet().stream().limit(30).forEach(e -> out.put(String.valueOf(e.getKey()), clean(e.getValue(), depth + 1)));
            return out;
        }
        if (value instanceof Collection<?> list) {
            return list.stream().limit(12).map(v -> clean(v, depth + 1)).toList();
        }
        return null;
    }
}
