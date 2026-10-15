package com.leadscope.backend.controller;

import com.leadscope.backend.service.WebsiteCheckService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/tools")
public class WebsiteCheckController {

    private final WebsiteCheckService websiteCheckService;

    public WebsiteCheckController(WebsiteCheckService websiteCheckService) {
        this.websiteCheckService = websiteCheckService;
    }
    public record WebsiteCheckRequest(String url) {}

    @PostMapping("/website-check")
    public Map<String, Object> check(@RequestBody WebsiteCheckRequest request) {
        return websiteCheckService.check(request.url());
    }
}
