package com.leadscope.backend.service;

import com.leadscope.backend.entity.Lead;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Contacts & social (lead enrichment).
 * Opens the business's OWN homepage (with WebsiteCheckService's safe fetch: public sites only,
 * 8 s timeout, max 1 MB) and reads only what the business shows publicly there:
 * up to 3 emails, the first Instagram / Facebook / LinkedIn / X / YouTube link, and a WhatsApp link.
 *
 * Social presence (Instagram, Facebook, LinkedIn, X, YouTube): Strong = 3+, Weak = 1–2, None = 0.
 * Weak / None adds the gap "Weak social presence" (the lead score itself is not changed).
 */
@Service
public class LeadEnrichmentService {

    public static final String WEAK_SOCIAL_GAP = "Weak social presence";
    private static final int MAX_EMAILS = 3;

    private static final Pattern MAILTO = Pattern.compile("mailto:([^\"'?<>\\s]+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern EMAIL = Pattern.compile("[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\\.[A-Za-z0-9-]+)*\\.[A-Za-z]{2,24}");
    // Any link in the page: href="…", JSON-LD "sameAs", plain text …
    private static final Pattern LINK = Pattern.compile("(?:https?:|whatsapp:)?//[^\\s\"'<>()\\\\]+", Pattern.CASE_INSENSITIVE);

    private static final Pattern INSTAGRAM = Pattern.compile(
            "^https?://(www\\.)?instagram\\.com/(?!p/|reel|explore|accounts|stories|share)[A-Za-z0-9._]+", Pattern.CASE_INSENSITIVE);
    private static final Pattern FACEBOOK = Pattern.compile(
            "^https?://(www\\.|m\\.|web\\.)?(facebook|fb)\\.com/(?!sharer|share|dialog|plugins|tr[/?]|login|v\\d)[^\\s]+", Pattern.CASE_INSENSITIVE);
    private static final Pattern LINKEDIN = Pattern.compile(
            "^https?://([a-z]{2,3}\\.)?linkedin\\.com/(company|in|school)/[^\\s]+", Pattern.CASE_INSENSITIVE);
    private static final Pattern TWITTER = Pattern.compile(
            "^https?://(www\\.|mobile\\.)?(twitter|x)\\.com/(?!intent|share|home|search|i/)[A-Za-z0-9_]{1,15}/?$", Pattern.CASE_INSENSITIVE);
    private static final Pattern YOUTUBE = Pattern.compile(
            "^https?://(www\\.|m\\.)?youtube\\.com/(channel/|c/|user/|@)[^\\s]+", Pattern.CASE_INSENSITIVE);
    private static final Pattern WHATSAPP = Pattern.compile(
            "^(https?://(wa\\.me/|api\\.whatsapp\\.com/send|web\\.whatsapp\\.com/send|chat\\.whatsapp\\.com/)|whatsapp://send)[^\\s]*",
            Pattern.CASE_INSENSITIVE);

    private static final Set<String> IMAGE_ENDINGS = Set.of(".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico");
    private static final List<String> FAKE_EMAIL_PARTS = List.of("example.", "sentry", "wixpress", "domain.com", "yourname", "email.com");

    private final WebsiteCheckService websiteCheckService;

    public LeadEnrichmentService(WebsiteCheckService websiteCheckService) {
        this.websiteCheckService = websiteCheckService;
    }

    /** Fills the lead's contact + social fields (caller saves it) and returns what was found. */
    public Map<String, Object> enrich(Lead lead) {
        if (lead.getWebsite() == null || lead.getWebsite().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This lead has no website, so there is nothing to scan.");
        }
        WebsiteCheckService.Page page = websiteCheckService.fetchPage(lead.getWebsite());
        if (!page.reachable()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "We couldn't open their website" + (page.problem() != null ? " (" + page.problem().toLowerCase(Locale.ROOT) + ")" : "")
                            + ". Please try again later.");
        }

        String html = page.html().replace("\\/", "/").replace("&amp;", "&");
        List<String> links = links(html);

        List<String> emails = emails(html);
        lead.setEmail(emails.isEmpty() ? null : String.join(", ", emails));
        lead.setInstagramUrl(firstMatch(links, INSTAGRAM));
        lead.setFacebookUrl(firstMatch(links, FACEBOOK));
        lead.setLinkedinUrl(firstMatch(links, LINKEDIN));
        lead.setTwitterUrl(firstMatch(links, TWITTER));
        lead.setYoutubeUrl(firstMatch(links, YOUTUBE));
        lead.setWhatsappUrl(firstMatch(links, WHATSAPP));

        int socialCount = (int) Arrays.stream(new String[] {lead.getInstagramUrl(), lead.getFacebookUrl(), lead.getLinkedinUrl(),
                lead.getTwitterUrl(), lead.getYoutubeUrl() }).filter(Objects::nonNull).count();
        String presence = socialCount >= 3 ? "Strong" : socialCount >= 1 ? "Weak" : "None";
        lead.setSocialPresence(presence);
        lead.setOpportunities(withSocialGap(lead.getOpportunities(), !presence.equals("Strong")));
        lead.setEnrichedAt(LocalDateTime.now());

        String[] best = bestChannel(lead);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("emails", emails);
        result.put("instagramUrl", lead.getInstagramUrl());
        result.put("facebookUrl", lead.getFacebookUrl());
        result.put("linkedinUrl", lead.getLinkedinUrl());
        result.put("twitterUrl", lead.getTwitterUrl());
        result.put("youtubeUrl", lead.getYoutubeUrl());
        result.put("whatsappUrl", lead.getWhatsappUrl());
        result.put("socialCount", socialCount);
        result.put("socialPresence", presence);
        result.put("bestChannel", best[0]);
        result.put("bestChannelReason", best[1]);
        return result;
    }

    /** { channel, one-line reason }: WhatsApp if phone / WhatsApp link, else Email if found, else visit in person. */
    public static String[] bestChannel(Lead lead) {
        if (lead.getWhatsappUrl() != null) {
            return new String[] { "WhatsApp", "Their website has a WhatsApp chat link, so they expect messages there." };
        }
        if (lead.getPhone() != null && !lead.getPhone().isBlank()) {
            return new String[] { "WhatsApp", "They list a phone number, and most local businesses reply fastest on WhatsApp." };
        }
        if (lead.getEmail() != null) {
            return new String[] { "Email", "No phone found, but their website shows an email address." };
        }
        return new String[] { "Visit in person", "No phone, WhatsApp or email is shown online, so a short visit works best." };
    }

    // ---------- extraction ----------

    private List<String> links(String html) {
        List<String> out = new ArrayList<>();
        Matcher m = LINK.matcher(html);
        while (m.find()) {
            String url = m.group().replaceAll("[.,;:]+$", "");
            if (url.startsWith("//")) url = "https:" + url;
            out.add(url);
        }
        return out;
    }

    private String firstMatch(List<String> links, Pattern pattern) {
        for (String url : links) {
            if (pattern.matcher(url).find()) return url.length() > 500 ? url.substring(0, 500) : url;
        }
        return null;
    }

    private List<String> emails(String html) {
        Set<String> found = new LinkedHashSet<>();
        Matcher m = MAILTO.matcher(html);                        // mailto: links first
        while (m.find() && found.size() < MAX_EMAILS) {
            String decoded = URLDecoder.decode(m.group(1), StandardCharsets.UTF_8);
            for (String part : decoded.split("[,;]")) addEmail(found, part);
        }
        String text = html.replaceAll("(?is)<(script|style)[^>]*>.*?</\\1>", " ").replaceAll("<[^>]+>", " ");
        Matcher t = EMAIL.matcher(text);                         // then emails written on the page
        while (t.find() && found.size() < MAX_EMAILS) addEmail(found, t.group());
        return new ArrayList<>(found);
    }

    private void addEmail(Set<String> found, String raw) {
        if (found.size() >= MAX_EMAILS) return;
        String email = raw.trim().toLowerCase(Locale.ROOT);
        if (!EMAIL.matcher(email).matches()) return;
        for (String end : IMAGE_ENDINGS) if (email.endsWith(end)) return;   // e.g. logo@2x.png
        for (String fake : FAKE_EMAIL_PARTS) if (email.contains(fake)) return;
        found.add(email);
    }

    /** Adds or removes "Weak social presence" in the comma-separated gaps text. */
    private static String withSocialGap(String opportunities, boolean weak) {
        List<String> gaps = new ArrayList<>();
        if (opportunities != null) {
            for (String g : opportunities.split(",")) {
                if (!g.isBlank() && !g.trim().equals(WEAK_SOCIAL_GAP)) gaps.add(g.trim());
            }
        }
        if (weak) gaps.add(WEAK_SOCIAL_GAP);
        return String.join(", ", gaps);
    }
}
