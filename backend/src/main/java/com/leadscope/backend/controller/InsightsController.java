package com.leadscope.backend.controller;

import com.leadscope.backend.service.InsightSummaryService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/insights")
public class InsightsController {

    private final InsightSummaryService summaryService;

    public InsightsController(InsightSummaryService summaryService) {
        this.summaryService = summaryService;
    }

    @PostMapping("/summary")
    public Map<String, Object> summary(@RequestBody Map<String, Object> counts) {
        return summaryService.summarise(counts);
    }
}
