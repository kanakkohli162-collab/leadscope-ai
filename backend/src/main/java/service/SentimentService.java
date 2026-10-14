package com.leadscope.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

/**
 * Review Sentiment Analysis (Synopsis 6.3 / 8.6).
 * Gemini reads the reviews and COUNTS positive / neutral / negative ones.
 * Our code then applies the formula: Sentiment Score = Positive − Negative (as % of total).
 */
@Service
public class SentimentService {

    private final RestClient http = RestClient.create();

    @Value("${gemini.key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String model;

    public Map<String, Object> analyze(String reviews) {
        if (reviews == null || reviews.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please paste at least one review.");
        }
        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI key is not configured.");
        }

        // Keep the request small (fast + inside free limits)
        String text = reviews.length() > 6000 ? reviews.substring(0, 6000) : reviews;

        String prompt = """
                You are a sentiment analysis engine. Below are customer reviews of a local business.
                Classify EACH review as positive, neutral or negative, then reply in EXACTLY this format
                (5 lines, nothing else):
                POSITIVE: <number of positive reviews>
                NEUTRAL: <number of neutral reviews>
                NEGATIVE: <number of negative reviews>
                CONCERNS: <up to 5 short customer complaints, comma separated, or none>
                SUMMARY: <one short sentence about what customers feel>

                Reviews:
                """ + text;

        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of("temperature", 0)
        );

        String reply;
        try {
            Map<?, ?> res = http.post()
                    .uri("https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={k}", model, apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);
            reply = extractText(res);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "AI is busy right now. Please try again in a minute.");
        }
        return parse(reply);
    }

    /** Gemini response → candidates[0].content.parts[0].text */
    @SuppressWarnings("unchecked")
    private String extractText(Map<?, ?> res) {
        try {
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) res.get("candidates");
            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            return String.valueOf(parts.get(0).get("text"));
        } catch (Exception e) {
            return "";
        }
    }

    /** Read the 5 lines and apply the sentiment formula */
    private Map<String, Object> parse(String reply) {
        int pos = 0, neu = 0, neg = 0;
        String concerns = "", summary = "";

        for (String line : reply.split("\\R")) {
            String l = line.replace("*", "").trim();
            String up = l.toUpperCase();
            if (up.startsWith("POSITIVE:")) pos = number(l);
            else if (up.startsWith("NEUTRAL:")) neu = number(l);
            else if (up.startsWith("NEGATIVE:")) neg = number(l);
            else if (up.startsWith("CONCERNS:")) concerns = after(l);
            else if (up.startsWith("SUMMARY:")) summary = after(l);
        }

        int total = pos + neu + neg;
        if (total == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Couldn't find reviews in that text. Paste one review per line.");
        }

        // Synopsis 6.3: Sentiment Score = Positive − Negative  (scaled to −100 … +100)
        int score = Math.round((pos - neg) * 100f / total);
        String overall = score > 20 ? "Positive" : score < -20 ? "Negative" : "Neutral";

        List<String> concernList = (concerns.isBlank() || concerns.equalsIgnoreCase("none"))
                ? List.of()
                : Arrays.stream(concerns.split(",")).map(String::trim).filter(s -> !s.isEmpty()).limit(5).toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("positive", pos);
        result.put("neutral", neu);
        result.put("negative", neg);
        result.put("total", total);
        result.put("score", score);
        result.put("overall", overall);
        result.put("concerns", concernList);
        result.put("summary", summary);
        return result;
    }

    private int number(String line) {
        String digits = after(line).replaceAll("[^0-9]", "");
        return digits.isEmpty() ? 0 : Integer.parseInt(digits);
    }

    private String after(String line) {
        return line.substring(line.indexOf(':') + 1).trim();
    }
}