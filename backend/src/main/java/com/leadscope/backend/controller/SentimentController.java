package com.leadscope.backend.controller;

import com.leadscope.backend.repository.LeadRepository;
import com.leadscope.backend.service.SentimentService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class SentimentController {

    private final SentimentService sentimentService;
    private final LeadRepository leadRepository;

    public SentimentController(SentimentService sentimentService, LeadRepository leadRepository) {
        this.sentimentService = sentimentService;
        this.leadRepository = leadRepository;
    }
    // leadId is optional: when given (and it is the user's own lead), the result is saved on that lead for Insights
    public record SentimentRequest(String reviews, Long leadId) {}

    @PostMapping("/sentiment")
    public Map<String, Object> analyze(@RequestBody SentimentRequest request, Authentication auth) {
        Map<String, Object> result = sentimentService.analyze(request.reviews());
        if (request.leadId() != null) {
            leadRepository.findByIdAndOwnerEmail(request.leadId(), auth.getName()).ifPresent(lead -> {
                lead.setSentimentLabel((String) result.get("overall"));
                lead.setSentimentScore((Integer) result.get("score"));
                leadRepository.save(lead);
            });
        }
        return result;
    }
}
