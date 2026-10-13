package com.leadscope.backend.controller;

import com.leadscope.backend.repository.LeadRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final LeadRepository leadRepository;

    public DashboardController(LeadRepository leadRepository) {
        this.leadRepository = leadRepository;
    }

    @GetMapping("/summary")
    public Map<String, Object> getSummary(Authentication auth) {
        String me = auth.getName();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalLeads", leadRepository.countByOwnerEmail(me));
        summary.put("highPriority", leadRepository.countByOwnerEmailAndPriority(me, "HIGH"));
        summary.put("noWebsite", leadRepository.countByOwnerEmailAndWebsiteIsNull(me));
        summary.put("lowRatings", leadRepository.countByOwnerEmailAndRatingLessThan(me, 3.5));
        summary.put("contacted", leadRepository.countByOwnerEmailAndStatus(me, "CONTACTED"));
        summary.put("won", leadRepository.countByOwnerEmailAndStatus(me, "WON"));

        Map<String, Long> leadsByCity = new LinkedHashMap<>();
        for (Object[] row : leadRepository.countLeadsByCity(me)) {
            leadsByCity.put((String) row[0], (Long) row[1]);
        }
        summary.put("leadsByCity", leadsByCity);

        return summary;
    }
}