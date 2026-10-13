package com.leadscope.backend.controller;

import com.leadscope.backend.entity.Lead;
import com.leadscope.backend.repository.LeadRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leads")
public class LeadController {

    private final LeadRepository leadRepository;

    public LeadController(LeadRepository leadRepository) {
        this.leadRepository = leadRepository;
    }

    @GetMapping
    public List<Lead> getAllLeads(@RequestParam(required = false) String city,
                                  @RequestParam(required = false) String status,
                                  @RequestParam(required = false) String search,
                                  Authentication auth) {
        String me = auth.getName();
        if (search != null) return leadRepository.findByOwnerEmailAndBusinessNameContainingIgnoreCase(me, search);
        if (city != null && status != null) return leadRepository.findByOwnerEmailAndCityIgnoreCaseAndStatus(me, city, status);
        if (city != null) return leadRepository.findByOwnerEmailAndCityIgnoreCase(me, city);
        if (status != null) return leadRepository.findByOwnerEmailAndStatus(me, status);
        return leadRepository.findByOwnerEmail(me);
    }

    @GetMapping("/{id}")
    public Lead getLeadById(@PathVariable Long id, Authentication auth) {
        return findMine(id, auth);
    }

    @PostMapping
    public Lead addLead(@RequestBody Lead lead, Authentication auth) {
        lead.setId(null);
        lead.setOwnerEmail(auth.getName());
        return leadRepository.save(lead);
    }

    @PutMapping("/{id}/status")
    public Lead updateStatus(@PathVariable Long id, @RequestParam String status, Authentication auth) {
        Lead lead = findMine(id, auth);
        lead.setStatus(status);
        return leadRepository.save(lead);
    }

    @PutMapping("/{id}/notes")
    public Lead updateNotes(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        Lead lead = findMine(id, auth);
        lead.setNotes(body.get("notes"));
        return leadRepository.save(lead);
    }

    @DeleteMapping("/{id}")
    public void deleteLead(@PathVariable Long id, Authentication auth) {
        leadRepository.delete(findMine(id, auth));
    }

    private Lead findMine(Long id, Authentication auth) {
        return leadRepository.findByIdAndOwnerEmail(id, auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lead not found"));
    }
}