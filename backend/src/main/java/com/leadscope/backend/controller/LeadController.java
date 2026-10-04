package com.leadscope.backend.controller;

import com.leadscope.backend.entity.Lead;
import com.leadscope.backend.repository.LeadRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leads")
public class LeadController {

    private final LeadRepository leadRepository;

    public LeadController(LeadRepository leadRepository) {
        this.leadRepository = leadRepository;
    }

    @GetMapping
    public List<Lead> getAllLeads() {
        return leadRepository.findAll();
    }

    @PostMapping
    public Lead addLead(@RequestBody Lead lead) {
        return leadRepository.save(lead);
    }
}

