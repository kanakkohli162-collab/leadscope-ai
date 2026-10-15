package com.leadscope.backend.controller;

import com.leadscope.backend.entity.Lead;
import com.leadscope.backend.repository.LeadRepository;
import com.leadscope.backend.service.LeadEnrichmentService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/leads")
public class EnrichmentController {

    private final LeadRepository leadRepository;
    private final LeadEnrichmentService enrichmentService;

    public EnrichmentController(LeadRepository leadRepository, LeadEnrichmentService enrichmentService) {
        this.leadRepository = leadRepository;
        this.enrichmentService = enrichmentService;
    }

    // POST /api/leads/1/enrich -> emails, social links, WhatsApp, socialPresence, bestChannel (+ the updated lead)
    @PostMapping("/{id}/enrich")
    public Map<String, Object> enrich(@PathVariable Long id, Authentication auth) {
        Lead lead = leadRepository.findByIdAndOwnerEmail(id, auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lead not found"));
        Map<String, Object> result = enrichmentService.enrich(lead);
        result.put("lead", leadRepository.save(lead));
        return result;
    }
}
