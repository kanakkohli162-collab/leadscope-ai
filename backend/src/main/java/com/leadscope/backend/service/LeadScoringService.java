package com.leadscope.backend.service;

import com.leadscope.backend.entity.Lead;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Scores a lead 0-100 based on digital gaps.
 *   No website                      +30
 *   Profile incomplete (no phone / no opening hours) +15
 *   Rating below 3.5                +15   (only if rating is known)
 *   Fewer than 20 reviews           +10   (only if review count is known)
 * Score = points / points-possible-for-this-lead * 100
 * (so leads without rating data, e.g. from OpenStreetMap, are scored fairly)
 *
 * Each rule is also written to lead.scoreBreakdown, so the search page can show "Why this score?".
 */
@Service
public class LeadScoringService {

    public void score(Lead lead, boolean hasOpeningHours) {
        int points = 0;
        int possible = 0;
        List<String> gaps = new ArrayList<>();
        List<Map<String, Object>> breakdown = new ArrayList<>();

        possible += 30;
        boolean noWebsite = lead.getWebsite() == null || lead.getWebsite().isBlank();
        if (noWebsite) {
            points += 30;
            gaps.add("No website");
        }
        breakdown.add(rule("No website", noWebsite, 30, noWebsite ? "No website found" : "Has a website"));

        possible += 15;
        boolean noPhone = lead.getPhone() == null || lead.getPhone().isBlank();
        boolean incomplete = noPhone || !hasOpeningHours;
        if (incomplete) {
            points += 15;
            gaps.add("Business profile incomplete");
        }
        List<String> missing = new ArrayList<>();
        if (noPhone) missing.add("phone");
        if (!hasOpeningHours) missing.add("opening hours");
        breakdown.add(rule("Profile incomplete (no phone or opening hours)", incomplete, 15,
                incomplete ? "Missing " + String.join(" and ", missing) : "Phone and opening hours listed"));

        if (lead.getRating() != null) {
            possible += 15;
            boolean low = lead.getRating() < 3.5;
            if (low) {
                points += 15;
                gaps.add("Low rating");
            }
            breakdown.add(rule("Rating below 3.5", low, 15, "Rating " + lead.getRating()));
        } else {
            breakdown.add(rule("Rating below 3.5", false, 0, "Not counted: no rating data"));
        }

        if (lead.getReviewCount() != null) {
            possible += 10;
            boolean few = lead.getReviewCount() < 20;
            if (few) {
                points += 10;
                gaps.add("Few reviews (weak online presence)");
            }
            breakdown.add(rule("Fewer than 20 reviews", few, 10, lead.getReviewCount() + " reviews"));
        } else {
            breakdown.add(rule("Fewer than 20 reviews", false, 0, "Not counted: no review data"));
        }

        int score = (int) Math.round(points * 100.0 / possible);
        lead.setScore(score);
        lead.setPriority(score >= 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW");
        lead.setOpportunities(String.join(", ", gaps));
        lead.setScoreBreakdown(breakdown);
    }

    /** One line of "Why this score?": rule, points earned, points possible (0 = not counted), plain-words detail. */
    private static Map<String, Object> rule(String name, boolean applied, int max, String detail) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("rule", name);
        r.put("points", applied ? max : 0);
        r.put("max", max);
        r.put("detail", detail);
        return r;
    }
}
