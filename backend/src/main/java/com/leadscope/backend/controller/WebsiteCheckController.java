package com.leadscope.backend.controller;

import com.leadscope.backend.repository.LeadRepository;
import com.leadscope.backend.service.WebsiteCheckService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/tools")
public class WebsiteCheckController {

    private final WebsiteCheckService websiteCheckService;
    private final LeadRepository leadRepository;

    public WebsiteCheckController(WebsiteCheckService websiteCheckService, LeadRepository leadRepository) {
        this.websiteCheckService = websiteCheckService;
        this.leadRepository = leadRepository;
    }
    // leadId is optional: when given (and it is the user's own lead), the result is saved on that lead for Insights
    public record WebsiteCheckRequest(String url, Long leadId) {}

    @PostMapping("/website-check")
    public Map<String, Object> check(@RequestBody WebsiteCheckRequest request, Authentication auth) {
        Map<String, Object> result = websiteCheckService.check(request.url());
        if (request.leadId() != null) {
            leadRepository.findByIdAndOwnerEmail(request.leadId(), auth.getName()).ifPresent(lead -> {
                lead.setWebsiteHealthScore((Integer) result.get("score"));
                lead.setWebsiteOutdated((Boolean) result.get("outdated"));
                leadRepository.save(lead);
            });
        }
        return result;
    }
}
