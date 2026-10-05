package com.leadscope.backend.controller;

import com.leadscope.backend.repository.LeadRepository;
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

    // GET /api/dashboard/summary -> all dashboard numbers
    @GetMapping("/summary")
    public Map<String, Object> getSummary() {
        Map<String, Object> summary = new LinkedHashMap<>();

        summary.put("totalLeads", leadRepository.count());
        summary.put("highPriority", leadRepository.countByPriority("HIGH"));
        summary.put("noWebsite", leadRepository.countByWebsiteIsNull());
        summary.put("lowRatings", leadRepository.countByRatingLessThan(3.5));
        summary.put("contacted", leadRepository.countByStatus("CONTACTED"));
        summary.put("won", leadRepository.countByStatus("WON"));

        Map<String, Long> leadsByCity = new LinkedHashMap<>();
        for (Object[] row : leadRepository.countLeadsByCity()) {
            leadsByCity.put((String) row[0], (Long) row[1]);
        }
        summary.put("leadsByCity", leadsByCity);

        return summary;
    }
}