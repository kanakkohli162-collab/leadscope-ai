package com.leadscope.backend.service;

import com.leadscope.backend.entity.Lead;
import com.leadscope.backend.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Writes a personalised outreach message for a lead.
 * Uses Gemini AI when a key is set; otherwise (or if Gemini fails) uses a smart template.
 */
@Service
public class MessageService {

    private final String apiKey;
    private final String model;
    private final RestClient restClient = RestClient.create();

    public MessageService(@Value("${gemini.key:}") String apiKey,
                          @Value("${gemini.model:gemini-2.5-flash}") String model) {
        this.apiKey = apiKey;
        this.model = model;
    }

    /** Returns { "message": "...", "source": "AI" or "Template" } */
    public Map<String, String> write(Lead lead, User sender, String service, String channel) {
        if (apiKey != null && !apiKey.isBlank()) {
            try {
                String text = askGemini(buildPrompt(lead, sender, service, channel));
                if (text != null && !text.isBlank()) {
                    return Map.of("message", text.trim(), "source", "AI");
                }
            } catch (Exception e) {
                // Gemini down / limit reached -> fall back to the template below
            }
        }
        return Map.of("message", template(lead, sender, service, channel), "source", "Template");
    }

    private String buildPrompt(Lead lead, User sender, String service, String channel) {
        String length = switch (channel) {
            case "whatsapp" -> "under 70 words, friendly, no subject line";
            case "linkedin" -> "under 90 words, professional, no subject line";
            default -> "under 140 words, start with a short 'Subject:' line";
        };
        return "Write a polite, personalised " + channel + " outreach message from a digital marketing agency "
                + "to a local business. Be specific and helpful, not pushy. " + length + ".\n"
                + "Business: " + lead.getBusinessName() + " (" + lead.getCategory() + ", " + lead.getCity() + ")\n"
                + "Rating: " + lead.getRating() + " from " + lead.getReviewCount() + " reviews\n"
                + "Problems we noticed: " + (lead.getOpportunities() == null ? "none" : lead.getOpportunities()) + "\n"
                + "Service we offer: " + service + "\n"
                + "Sign off as: " + signature(sender) + "\n"
                + "Return only the message text.";
    }

    @SuppressWarnings("unchecked")
    private String askGemini(String prompt) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent";
        Map<String, Object> body = Map.of("contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))));

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
        return (String) parts.get(0).get("text");
    }

    private String template(Lead lead, User sender, String service, String channel) {
        String problem = (lead.getOpportunities() == null || lead.getOpportunities().isBlank())
                ? "there may be room to grow your online presence"
                : "I noticed a few things that may be costing you customers: " + lead.getOpportunities().toLowerCase();
        String name = lead.getBusinessName();

        if ("whatsapp".equals(channel)) {
            return "Hi " + name + " team! I came across your business in " + lead.getCity() + " and " + problem
                    + ". We help businesses like yours with " + service
                    + ". Would you be open to a quick 10-minute call this week?\n\n- " + signature(sender);
        }
        if ("linkedin".equals(channel)) {
            return "Hello, I came across " + name + " in " + lead.getCity() + ". " + capitalise(problem) + ". "
                    + "Our team helps local businesses with " + service + ". "
                    + "Happy to share a few quick ideas if you're interested.\n\n" + signature(sender);
        }
        return "Subject: A few quick ideas for " + name + "\n\n"
                + "Hi,\n\n"
                + "I came across " + name + " while looking at " + lead.getCategory() + " businesses in " + lead.getCity() + ". "
                + capitalise(problem) + ".\n\n"
                + "We help businesses like yours with " + service + ", so more people can find and choose you online.\n\n"
                + "Would you be open to a quick 15-minute call this week?\n\n"
                + "Best regards,\n" + signature(sender);
    }

    private String signature(User sender) {
        String person = sender.getName() == null ? "" : sender.getName();
        String agency = sender.getAgencyName() == null ? "" : sender.getAgencyName();
        return agency.isBlank() ? person : person + ", " + agency;
    }

    private String capitalise(String s) {
        return s.isEmpty() ? s : Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }
}