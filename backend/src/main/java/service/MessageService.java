package com.leadscope.backend.service;

import com.leadscope.backend.entity.Lead;
import com.leadscope.backend.entity.User;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.util.*;

/**
 * Writes personalised outreach messages for a lead.
 * Uses Gemini AI when a key is set; otherwise (or if Gemini is busy / at its limit) uses a smart template
 * and says why in `note`.
 *
 * Options: channel (whatsapp / email / linkedin), tone (Friendly / Professional / Short),
 * language (English / Hindi / Hinglish). Email gets a subject + body; LinkedIn connection notes stay under 300 characters.
 */
@Service
public class MessageService {

    /** context = extra facts for the AI (e.g. Website Checker issues), optional, max 600 characters. */
    public record Options(String service, String channel, String tone, String language, String context) {
        public Options(String service, String channel, String tone, String language) {
            this(service, channel, tone, language, null);
        }

        public Options {
            context = context == null || context.isBlank() ? null
                    : context.trim().substring(0, Math.min(600, context.trim().length()));
            service = blankTo(service, "Website Development");
            channel = blankTo(channel, "email").toLowerCase(Locale.ROOT);
            if (!List.of("email", "whatsapp", "linkedin").contains(channel)) channel = "email";
            tone = pick(tone, List.of("Friendly", "Professional", "Short"), "Friendly");
            language = pick(language, List.of("English", "Hindi", "Hinglish"), "English");
        }
    }

    public static final int LINKEDIN_MAX_CHARS = 300;
    private static final JsonMapper JSON = JsonMapper.builder().build();

    private final GeminiClient gemini;

    public MessageService(GeminiClient gemini) {
        this.gemini = gemini;
    }

    /**
     * One or two versions (A / B) of a first message.
     * Returns { source, note, messages: [{ subject, body }], message (first one as plain text), used: {...} }
     */
    public Map<String, Object> write(Lead lead, User sender, Options o, int versions) {
        int count = versions >= 2 ? 2 : 1;
        List<Map<String, String>> messages = null;
        String note = null;
        try {
            String prompt = basePrompt(lead, sender, o)
                    + (count == 2
                    ? "Write TWO different versions (A and B): A opens with the problem we noticed, B opens with a compliment or a quick win.\n"
                    : "Write ONE message.\n")
                    + "Answer with JSON only: {\"messages\":[{\"subject\":\"...\",\"body\":\"...\"}]}"
                    + (o.channel().equals("email") ? "" : " (subject must be an empty string)") + ".";
            messages = parseList(gemini.ask(prompt, true), "messages", count);
            if (messages == null) note = "The AI answer was incomplete, so a ready-made template was used.";
        } catch (GeminiClient.AiUnavailable e) {
            note = e.getMessage();
        } catch (Exception e) {
            note = "The AI answer could not be read, so a ready-made template was used.";
        }
        String source = "AI";
        if (messages == null) {
            source = "Template";
            messages = new ArrayList<>();
            for (int i = 0; i < count; i++) messages.add(template(lead, sender, o, i));
        }
        messages.forEach(m -> fitChannel(m, o));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("source", source);
        result.put("note", note);
        result.put("messages", messages);
        result.put("message", asText(messages.get(0)));   // older pages read this
        result.put("used", used(lead));
        return result;
    }

    /** Day 1 message, Day 3 reminder, Day 7 final follow-up. Returns { source, note, steps: [{ day, label, subject, body }] } */
    public Map<String, Object> sequence(Lead lead, User sender, Options o) {
        List<Map<String, String>> steps = null;
        String note = null;
        try {
            String prompt = basePrompt(lead, sender, o)
                    + "Write a 3-step follow-up sequence: step 1 = first message (Day 1), "
                    + "step 2 = short friendly reminder (Day 3) that refers to the first message, "
                    + "step 3 = final polite follow-up (Day 7) that leaves the door open.\n"
                    + "Answer with JSON only: {\"steps\":[{\"subject\":\"...\",\"body\":\"...\"}]}"
                    + (o.channel().equals("email") ? "" : " (subject must be an empty string)") + ".";
            steps = parseList(gemini.ask(prompt, true), "steps", 3);
            if (steps == null) note = "The AI answer was incomplete, so a ready-made template was used.";
        } catch (GeminiClient.AiUnavailable e) {
            note = e.getMessage();
        } catch (Exception e) {
            note = "The AI answer could not be read, so a ready-made template was used.";
        }
        String source = "AI";
        if (steps == null) {
            source = "Template";
            steps = sequenceTemplate(lead, sender, o);
        }
        int[] days = { 1, 3, 7 };
        String[] labels = { "Day 1 · First message", "Day 3 · Reminder", "Day 7 · Final follow-up" };
        List<Map<String, Object>> out = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            fitChannel(steps.get(i), o);
            Map<String, Object> step = new LinkedHashMap<>(steps.get(i));
            step.put("day", days[i]);
            step.put("label", labels[i]);
            out.add(step);
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("source", source);
        result.put("note", note);
        result.put("steps", out);
        result.put("used", used(lead));
        return result;
    }

    // ---------- prompt ----------

    private String basePrompt(Lead lead, User sender, Options o) {
        String length = switch (o.channel()) {
            case "whatsapp" -> o.tone().equals("Short") ? "under 40 words, no subject line" : "under 70 words, no subject line";
            case "linkedin" -> "a LinkedIn connection note under " + LINKEDIN_MAX_CHARS + " characters in total, no subject line";
            default -> (o.tone().equals("Short") ? "body under 80 words" : "body under 140 words")
                    + ", plus a short subject line (under 60 characters)";
        };
        String tone = switch (o.tone()) {
            case "Professional" -> "professional and respectful";
            case "Short" -> "very short and direct";
            default -> "warm and friendly";
        };
        String language = switch (o.language()) {
            case "Hindi" -> "Write in Hindi (Devanagari script).";
            case "Hinglish" -> "Write in Hinglish: Hindi words in English (Roman) letters, mixed with simple English, as people text in India.";
            default -> "Write in simple English.";
        };
        return "You write outreach messages for a digital marketing agency in India, to a local business.\n"
                + "Channel: " + o.channel() + " (" + length + "). Tone: " + tone + ". " + language + "\n"
                + "Rules: use the business name; mention at least one problem we noticed; be helpful, not pushy; "
                + "end with one clear call to action as a question (e.g. a quick call or visit). No placeholders like [Name].\n"
                + "Business: " + lead.getBusinessName() + " (" + nz(lead.getCategory(), "local business") + ", " + nz(lead.getCity(), "") + ")\n"
                + (lead.getRating() != null ? "Rating: " + lead.getRating() + " from " + lead.getReviewCount() + " reviews\n" : "")
                + "Problems we noticed: " + nz(lead.getOpportunities(), "none found") + "\n"
                + "Service to offer: " + o.service() + "\n"
                + (servicesOffered(sender).isEmpty() ? ""
                    : "The agency ONLY offers: " + String.join(", ", servicesOffered(sender))
                    + ". Do not offer anything else; pick the closest of these to the service above.\n")
                + (o.context() != null ? "Extra facts we found (use them): " + o.context() + "\n" : "")
                + (hasOwnSignature(sender)
                    ? "End the message with exactly this signature, on its own lines:\n" + signature(sender) + "\n"
                    : "Sign off as: " + signature(sender) + "\n");
    }

    private List<Map<String, String>> parseList(String json, String field, int expected) {
        String clean = json.replaceAll("(?s)^```(?:json)?\\s*|\\s*```$", "");
        JsonNode list = JSON.readTree(clean).path(field);
        List<Map<String, String>> out = new ArrayList<>();
        for (JsonNode item : list) {
            String body = item.path("body").asString("").trim();
            if (body.isEmpty()) continue;
            Map<String, String> m = new LinkedHashMap<>();
            m.put("subject", item.path("subject").asString("").trim());
            m.put("body", body);
            out.add(m);
        }
        return out.size() >= expected ? new ArrayList<>(out.subList(0, expected)) : null;
    }

    /** No subject outside email; LinkedIn cut to 300 characters (at a word). */
    private void fitChannel(Map<String, String> m, Options o) {
        if (!o.channel().equals("email")) m.put("subject", "");
        if (o.channel().equals("linkedin") && m.get("body").length() > LINKEDIN_MAX_CHARS) {
            String cut = m.get("body").substring(0, LINKEDIN_MAX_CHARS - 1);
            int space = cut.lastIndexOf(' ');
            m.put("body", (space > 200 ? cut.substring(0, space) : cut).trim() + "…");
        }
    }

    private String asText(Map<String, String> m) {
        String subject = m.getOrDefault("subject", "");
        return subject.isBlank() ? m.get("body") : "Subject: " + subject + "\n\n" + m.get("body");
    }

    /** What the message was based on (shown as chips under the message). */
    private Map<String, Object> used(Lead lead) {
        Map<String, Object> u = new LinkedHashMap<>();
        u.put("businessName", lead.getBusinessName());
        u.put("category", lead.getCategory());
        u.put("city", lead.getCity());
        List<String> gaps = new ArrayList<>();
        if (lead.getOpportunities() != null) {
            for (String g : lead.getOpportunities().split(",")) if (!g.isBlank()) gaps.add(g.trim());
        }
        u.put("gaps", gaps);
        return u;
    }

    // ---------- templates (no AI key, or AI busy) — English ----------

    private Map<String, String> template(Lead lead, User sender, Options o, int variant) {
        String name = lead.getBusinessName();
        String city = nz(lead.getCity(), "your area");
        String gap = firstGap(lead);
        String service = serviceFor(sender, o.service());
        String problem = o.context() != null ? "I checked your website and noticed: " + o.context().toLowerCase(Locale.ROOT)
                : gap == null ? "there may be room to grow your online presence"
                : "I noticed one thing that may be costing you customers: " + gap.toLowerCase(Locale.ROOT);
        String opener = variant == 0
                ? "I came across " + name + " in " + city + " and " + problem + "."
                : name + " looks like a great place, and there is a quick win to get even more customers online"
                + (gap == null ? "." : ": fixing \"" + gap.toLowerCase(Locale.ROOT) + "\".");
        String ask = o.tone().equals("Professional") ? "Would you be open to a short 15-minute call this week?"
                : "Can I share a few quick ideas on a 10-minute call this week?";

        return switch (o.channel()) {
            case "whatsapp" -> msg("", "Hi " + name + " team! " + opener + " We help businesses like yours with "
                    + service + ". " + ask + signOff(sender, false));
            case "linkedin" -> msg("", "Hello! " + opener + " We help local businesses with " + service + ". " + ask);
            default -> msg(variant == 0 ? "A quick idea for " + name : "More customers for " + name + "?",
                    "Hi,\n\n" + opener + "\n\nWe help businesses like yours with " + service
                            + ", so more people can find and choose you online.\n\n"
                            + ask + signOff(sender, true));
        };
    }

    private List<Map<String, String>> sequenceTemplate(Lead lead, User sender, Options o) {
        String name = lead.getBusinessName();
        String gap = firstGap(lead);
        String reminder = "Hi " + name + " team, just following up on my message from a few days ago"
                + (gap == null ? "" : " about \"" + gap.toLowerCase(Locale.ROOT) + "\"")
                + ". Would a quick 10-minute call this week work for you?";
        String last = "Hi " + name + " team, I don't want to fill your inbox, so this is my last note. "
                + "If you'd like help with " + serviceFor(sender, o.service()) + " later, just reply here and I'll be happy to help.";
        boolean email = o.channel().equals("email");
        return new ArrayList<>(List.of(
                template(lead, sender, o, 0),
                msg(email ? "Following up: " + name : "", reminder + signOff(sender, email)),
                msg(email ? "Last note for " + name : "", last + signOff(sender, email))));
    }

    /** The agency's own signature as written; otherwise "Best regards," (email) or "- " before the name. */
    private String signOff(User sender, boolean email) {
        if (hasOwnSignature(sender)) return "\n\n" + signature(sender);
        return email ? "\n\nBest regards,\n" + signature(sender) : "\n\n- " + signature(sender);
    }

    /**
     * The service to name in a template: the requested one if the agency offers it (Settings),
     * otherwise the services the agency does offer. No services set in Settings = the requested one.
     */
    private static String serviceFor(User sender, String requested) {
        List<String> offered = servicesOffered(sender);
        if (offered.isEmpty()) return requested;
        String r = requested.toLowerCase(Locale.ROOT);
        String wanted = r.contains("social") ? "Social media"
                : r.contains("google") || r.contains("review") ? "Google listing"
                : r.contains("seo") && !r.contains("website") ? "SEO"
                : r.contains("ads") ? "Ads"
                : r.contains("brand") ? "Branding"
                : "Websites";
        if (offered.contains(wanted)) return requested;
        return offered.size() == 1 ? offered.get(0)
                : String.join(", ", offered.subList(0, offered.size() - 1)) + " and " + offered.get(offered.size() - 1);
    }

    // ---------- helpers ----------

    private static Map<String, String> msg(String subject, String body) {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("subject", subject);
        m.put("body", body);
        return m;
    }

    private static String firstGap(Lead lead) {
        if (lead.getOpportunities() == null) return null;
        for (String g : lead.getOpportunities().split(",")) if (!g.isBlank()) return g.trim();
        return null;
    }

    /** The agency's own signature (Settings), else "Name, Agency" (+ phone / website when set). */
    private String signature(User sender) {
        if (hasOwnSignature(sender)) return sender.getSignature().trim();
        String person = nz(sender.getSenderName(), nz(sender.getName(), ""));
        String agency = sender.getAgencyName() == null ? "" : sender.getAgencyName();
        String line = agency.isBlank() ? person : person + ", " + agency;
        if (sender.getSenderPhone() != null && !sender.getSenderPhone().isBlank()) line += "\n" + sender.getSenderPhone().trim();
        if (sender.getSenderWebsite() != null && !sender.getSenderWebsite().isBlank()) line += "\n" + sender.getSenderWebsite().trim();
        return line;
    }

    private static boolean hasOwnSignature(User sender) {
        return sender.getSignature() != null && !sender.getSignature().isBlank();
    }

    private static List<String> servicesOffered(User sender) {
        if (sender.getServicesOffered() == null) return List.of();
        return Arrays.stream(sender.getServicesOffered().split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    private static String nz(String s, String fallback) {
        return s == null || s.isBlank() ? fallback : s;
    }

    private static String blankTo(String s, String fallback) {
        return s == null || s.isBlank() ? fallback : s.trim();
    }

    private static String pick(String value, List<String> allowed, String fallback) {
        if (value == null) return fallback;
        for (String a : allowed) if (a.equalsIgnoreCase(value.trim())) return a;
        return fallback;
    }
}
