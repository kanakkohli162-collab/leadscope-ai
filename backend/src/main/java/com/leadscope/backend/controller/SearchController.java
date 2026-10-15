package com.leadscope.backend.controller;

import com.leadscope.backend.entity.Lead;
import com.leadscope.backend.service.GeoapifyService;
import com.leadscope.backend.service.PlacesService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * POST /api/search  { "city": "...", "category": "...", "area": "..." (optional), "limit": 50 (optional, 1-500) }
 *                                                         -> scored businesses (not saved), each with a scoreBreakdown
 * GET  /api/search/status                                 -> data source + searches left today
 *
 * Data source (pluggable):  Google key -> Google Places,  else Geoapify key -> Geoapify (free),  else Demo.
 * No per-user limit. One app-wide safety cap per day keeps us inside the free API quota.
 */
@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final PlacesService placesService;
    private final GeoapifyService geoapifyService;
    private final String googleKey;
    private final int dailyCap;          // 0 = no cap

    private LocalDate day = LocalDate.now();
    private int usedToday = 0;

    public SearchController(PlacesService placesService,
                            GeoapifyService geoapifyService,
                            @Value("${google.places.key:}") String googleKey,
                            @Value("${app.search.daily-cap:1000}") int dailyCap) {
        this.placesService = placesService;
        this.geoapifyService = geoapifyService;
        this.googleKey = googleKey;
        this.dailyCap = dailyCap;
    }

    private String provider() {
        if (googleKey != null && !googleKey.isBlank()) return "Google";
        if (geoapifyService.isEnabled()) return "Geoapify";
        return "Demo";
    }

    @PostMapping
    public List<Lead> search(@RequestBody Map<String, Object> body) {
        String city = text(body.get("city"));
        String category = text(body.get("category"));
        String area = text(body.get("area"));
        int limit = number(body.get("limit"), GeoapifyService.MAX_RESULTS);
        if (city.isEmpty() || category.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please enter a city and a business type");
        }

        String provider = provider();
        if (!provider.equals("Demo")) useOneSearch();      // demo searches are free -> not counted

        try {
            return switch (provider) {
                case "Geoapify" -> geoapifyService.search(category, city, area, limit);
                default -> placesService.search(category, city, area, limit);   // Google, or demo if no key
            };
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "The business search service is not responding. Please try again in a minute.");
        }
    }

    @GetMapping("/status")
    public synchronized Map<String, Object> status() {
        resetIfNewDay();
        String provider = provider();
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("provider", provider);
        s.put("demoMode", provider.equals("Demo"));
        s.put("dailyLimit", dailyCap);
        s.put("remainingToday", dailyCap > 0 ? Math.max(0, dailyCap - usedToday) : -1);
        return s;
    }

    private synchronized void useOneSearch() {
        resetIfNewDay();
        if (dailyCap > 0 && usedToday >= dailyCap) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Today's search limit for the app is reached. Please try again tomorrow.");
        }
        usedToday++;
    }

    private void resetIfNewDay() {
        LocalDate today = LocalDate.now();
        if (!today.equals(day)) {
            day = today;
            usedToday = 0;
        }
    }

    private static String text(Object o) {
        return o == null ? "" : o.toString().trim();
    }

    private static int number(Object o, int fallback) {
        if (o instanceof Number n) return n.intValue();
        try {
            return o == null ? fallback : Integer.parseInt(o.toString().trim());
        } catch (NumberFormatException e) {
            return fallback;
        }
    }
}
