package com.leadscope.backend.controller;

import com.leadscope.backend.entity.Lead;
import com.leadscope.backend.entity.User;
import com.leadscope.backend.repository.LeadRepository;
import com.leadscope.backend.repository.UserRepository;
import com.leadscope.backend.service.MessageService;
import com.leadscope.backend.service.UsageService;
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
    private final UsageService usageService;

    public MessageController(LeadRepository leadRepository, UserRepository userRepository, MessageService messageService,
                             UsageService usageService) {
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
        this.messageService = messageService;
        this.usageService = usageService;
    }

    /**
     * POST /api/leads/1/message
     * body: { "service": "...", "channel": "email|whatsapp|linkedin", "tone": "Friendly|Professional|Short",
     *         "language": "English|Hindi|Hinglish", "versions": 1|2,
 *         "context": "extra facts for the AI, e.g. website problems from the Website Checker" (optional) }
     */
    @PostMapping("/{id}/message")
    public Map<String, Object> writeMessage(@PathVariable Long id,
                                            @RequestBody Map<String, Object> body,
                                            Authentication auth) {
        int versions = "2".equals(String.valueOf(body.get("versions"))) ? 2 : 1;
        Map<String, Object> result = messageService.write(findLead(id, auth), findSender(auth), options(body), versions);
        usageService.record(auth.getName(), UsageService.Kind.AI_MESSAGE);
        return result;
    }

    // POST /api/leads/1/message/sequence  same body -> Day 1 / Day 3 / Day 7 messages
    @PostMapping("/{id}/message/sequence")
    public Map<String, Object> writeSequence(@PathVariable Long id,
                                             @RequestBody Map<String, Object> body,
                                             Authentication auth) {
        Map<String, Object> result = messageService.sequence(findLead(id, auth), findSender(auth), options(body));
        usageService.record(auth.getName(), UsageService.Kind.AI_MESSAGE);
        return result;
    }

    private MessageService.Options options(Map<String, Object> body) {
        return new MessageService.Options(text(body.get("service")), text(body.get("channel")),
                text(body.get("tone")), text(body.get("language")), text(body.get("context")));
    }

    private Lead findLead(Long id, Authentication auth) {
        return leadRepository.findByIdAndOwnerEmail(id, auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lead not found"));
    }

    private User findSender(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in to continue."));
    }

    private static String text(Object o) {
        return o == null ? null : o.toString();
    }
}
