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

    // POST /api/insights/summary  body: aggregated counts only (no names, phones or addresses)
    //   -> { summary, recommendations: [3] }
    @PostMapping("/summary")
    public Map<String, Object> summary(@RequestBody Map<String, Object> counts) {
        return summaryService.summarise(counts);
    }
}
