package com.leadscope.backend.controller;

import com.leadscope.backend.entity.Lead;
import com.leadscope.backend.entity.User;
import com.leadscope.backend.repository.LeadRepository;
import com.leadscope.backend.repository.UserRepository;
import com.leadscope.backend.service.MessageService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/leads")
public class MessageController {

    private final LeadRepository leadRepository;
    private final UserRepository userRepository;
    private final MessageService messageService;

    public MessageController(LeadRepository leadRepository, UserRepository userRepository, MessageService messageService) {
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
        this.messageService = messageService;
    }

    // POST /api/leads/1/message   body: { "service": "Website Development", "channel": "email" }
    @PostMapping("/{id}/message")
    public Map<String, String> writeMessage(@PathVariable Long id,
                                            @RequestBody Map<String, String> body,
                                            Authentication auth) {
        Lead lead = leadRepository.findByIdAndOwnerEmail(id, auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lead not found"));
        User sender = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in to continue."));

        String service = body.getOrDefault("service", "Website Development");
        String channel = body.getOrDefault("channel", "email");
        return messageService.write(lead, sender, service, channel);
    }
}