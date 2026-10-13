package com.leadscope.backend.controller;

import com.leadscope.backend.entity.Lead;
import com.leadscope.backend.service.PlacesService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private static final int DAILY_LIMIT = 10;   // searches per user per day (protects the Google bill)

    private final PlacesService placesService;
    private final Map<String, Integer> searchesToday = new ConcurrentHashMap<>();
    private LocalDate today = LocalDate.now();

    public SearchController(PlacesService placesService) {
        this.placesService = placesService;
    }

    // POST /api/search   body: { "city": "Noida", "category": "Gynecologist" }
    // Returns scored businesses. They are NOT saved until the user clicks "Add to My Leads".
    @PostMapping
    public List<Lead> search(@RequestBody Map<String, String> body, Authentication auth) {
        String city = body.getOrDefault("city", "").trim();
        String category = body.getOrDefault("category", "").trim();
        if (city.isEmpty() || category.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "City and business type are required");
        }

        checkDailyLimit(auth.getName());

        try {
            return placesService.search(category, city);
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Business search is unavailable right now. Please try again later.");
        }
    }

    private synchronized void checkDailyLimit(String email) {
        if (!LocalDate.now().equals(today)) {   // new day -> reset everyone's count
            searchesToday.clear();
            today = LocalDate.now();
        }
        int used = searchesToday.merge(email, 1, Integer::sum);
        if (used > DAILY_LIMIT) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Daily search limit reached (" + DAILY_LIMIT + " per day). Please try again tomorrow.");
        }
    }
}