package com.leadscope.backend.controller;

import com.leadscope.backend.service.SentimentService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class SentimentController {

    private final SentimentService sentimentService;

    public SentimentController(SentimentService sentimentService) {
        this.sentimentService = sentimentService;
    }
    public record SentimentRequest(String reviews) {}

    @PostMapping("/sentiment")
    public Map<String, Object> analyze(@RequestBody SentimentRequest request) {
        return sentimentService.analyze(request.reviews());
    }
}

