package com.leadscope.backend.service;

import com.leadscope.backend.entity.Lead;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Scores a lead 0-100 based on digital gaps.
 *   No website                      +30
 *   Profile incomplete (no phone / no opening hours) +15
 *   Rating below 3.5                +15   (only if rating is known)
 *   Fewer than 20 reviews           +10   (only if review count is known)
 * Score = points / points-possible-for-this-lead * 100
 * (so leads without rating data, e.g. from OpenStreetMap, are scored fairly)
 */
@Service
public class LeadScoringService {

    public void score(Lead lead, boolean hasOpeningHours) {
        int points = 0;
        int possible = 0;
        List<String> gaps = new ArrayList<>();

        possible += 30;
        if (lead.getWebsite() == null || lead.getWebsite().isBlank()) {
            points += 30;
            gaps.add("No website");
        }

        possible += 15;
        boolean noPhone = lead.getPhone() == null || lead.getPhone().isBlank();
        if (noPhone || !hasOpeningHours) {
            points += 15;
            gaps.add("Business profile incomplete");
        }

        if (lead.getRating() != null) {
            possible += 15;
            if (lead.getRating() < 3.5) {
                points += 15;
                gaps.add("Low rating");
            }
        }

        if (lead.getReviewCount() != null) {
            possible += 10;
            if (lead.getReviewCount() < 20) {
                points += 10;
                gaps.add("Few reviews (weak online presence)");
            }
        }

        int score = (int) Math.round(points * 100.0 / possible);
        lead.setScore(score);
        lead.setPriority(score >= 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW");
        lead.setOpportunities(String.join(", ", gaps));
    }
}