package com.leadscope.backend.service;

import com.leadscope.backend.entity.Lead;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Our scoring rules: each digital gap a business has earns points.
 * More gaps = bigger opportunity for the agency = higher score.
 */
@Service
public class LeadScoringService {

    private static final int MAX_POINTS = 70;   // 30 + 15 + 15 + 10

    public void score(Lead lead, boolean hasOpeningHours) {
        int points = 0;
        List<String> gaps = new ArrayList<>();

        if (lead.getWebsite() == null || lead.getWebsite().isBlank()) {
            points += 30;
            gaps.add("No website");
        }
        if (lead.getPhone() == null || !hasOpeningHours) {
            points += 15;
            gaps.add("Google profile incomplete");
        }
        if (lead.getRating() != null && lead.getRating() < 3.5) {
            points += 15;
            gaps.add("Low rating (below 3.5)");
        }
        if (lead.getReviewCount() == null || lead.getReviewCount() < 20) {
            points += 10;
            gaps.add("Few reviews (weak online presence)");
        }

        int score = Math.round(points * 100f / MAX_POINTS);   // scale to 0-100
        lead.setScore(score);
        lead.setPriority(score >= 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW");
        lead.setOpportunities(String.join(", ", gaps));
    }
}