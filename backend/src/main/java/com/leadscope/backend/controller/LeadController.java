package com.leadscope.backend.controller;

import com.leadscope.backend.entity.Lead;
import com.leadscope.backend.repository.LeadRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;

import java.util.List;

@RestController
@RequestMapping("/api/leads")
public class LeadController {

    private final LeadRepository leadRepository;

    public LeadController(LeadRepository leadRepository) {
        this.leadRepository = leadRepository;
    }

    // GET /api/leads                      -> all leads
    // GET /api/leads?city=Noida           -> filter by city
    // GET /api/leads?status=NEW           -> filter by status
    // GET /api/leads?city=Noida&status=NEW -> both
    // GET /api/leads?search=care          -> search by business name
    @GetMapping
    public List<Lead> getAllLeads(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {

        if (search != null) {
            return leadRepository.findByBusinessNameContainingIgnoreCase(search);
        }
        if (city != null && status != null) {
            return leadRepository.findByCityIgnoreCaseAndStatus(city, status);
        }
        if (city != null) {
            return leadRepository.findByCityIgnoreCase(city);
        }
        if (status != null) {
            return leadRepository.findByStatus(status);
        }
        return leadRepository.findAll();
    }

    // GET /api/leads/1  -> one lead
    @GetMapping("/{id}")
    public Lead getLeadById(@PathVariable Long id) {
        return leadRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lead not found"));
    }

    // POST /api/leads  -> add a lead
    @PostMapping
    public Lead addLead(@RequestBody Lead lead) {
        return leadRepository.save(lead);
    }

    // PUT /api/leads/1/notes   body: { "notes": "Called once, call back Monday" }
    @PutMapping("/{id}/notes")
    public Lead updateNotes(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lead not found"));
        lead.setNotes(body.get("notes"));
        return leadRepository.save(lead);
    }

    // DELETE /api/leads/1  -> delete a lead
    @DeleteMapping("/{id}")
    public void deleteLead(@PathVariable Long id) {
        if (!leadRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lead not found");
        }
        leadRepository.deleteById(id);
    }
}
