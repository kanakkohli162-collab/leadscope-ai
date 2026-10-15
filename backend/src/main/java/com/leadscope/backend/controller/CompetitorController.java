package com.leadscope.backend.controller;

import com.leadscope.backend.entity.Lead;
import com.leadscope.backend.repository.LeadRepository;
import com.leadscope.backend.service.CompetitorService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/leads")
public class CompetitorController {

    private final LeadRepository leadRepository;
    private final CompetitorService competitorService;

    public CompetitorController(LeadRepository leadRepository, CompetitorService competitorService) {
        this.leadRepository = leadRepository;
        this.competitorService = competitorService;
    }

    // GET /api/leads/1/competitors  -> how this lead compares with similar businesses within 1 km
    @GetMapping("/{id}/competitors")
    public Map<String, Object> competitors(@PathVariable Long id, Authentication auth) {
        Lead lead = leadRepository.findByIdAndOwnerEmail(id, auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lead not found"));
        return competitorService.compare(lead);
    }
}
