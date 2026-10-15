package com.leadscope.backend.controller;

import com.leadscope.backend.dto.SearchResult;
import com.leadscope.backend.service.GeoapifyService;
import com.leadscope.backend.service.PlacesService;
import com.leadscope.backend.service.SearchDeduplicator;
import com.leadscope.backend.service.UsageService;
import org.springframework.security.core.Authentication;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * POST /api/search  { "city": "...", "category": "...", "area": "..." (optional), "limit": 50 (optional, 1-500) }
 *     -> { results: scored businesses (not saved, each with a scoreBreakdown), duplicatesRemoved }
 * Map search ("Find businesses here"): { "category": "...", "lat": 22.7, "lon": 75.8, "radius": 1500 } (city not needed,
 * radius 500-5000 m, Geoapify only)
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
    private final UsageService usageService;
    private final String googleKey;
    private final int dailyCap;          // 0 = no cap

    private LocalDate day = LocalDate.now();
    private int usedToday = 0;

    public SearchController(PlacesService placesService,
                            GeoapifyService geoapifyService,
                            UsageService usageService,
                            @Value("${google.places.key:}") String googleKey,
                            @Value("${app.search.daily-cap:1000}") int dailyCap) {
        this.placesService = placesService;
        this.geoapifyService = geoapifyService;
        this.usageService = usageService;
        this.googleKey = googleKey;
        this.dailyCap = dailyCap;
    }

    private String provider() {
        if (googleKey != null && !googleKey.isBlank()) return "Google";
        if (geoapifyService.isEnabled()) return "Geoapify";
        return "Demo";
    }

    @PostMapping
    public SearchResult search(@RequestBody Map<String, Object> body, Authentication auth) {
        SearchResult result = runSearch(body);
        usageService.record(auth == null ? null : auth.getName(), UsageService.Kind.SEARCH);   // "Usage this month"
        return result;
    }

    private SearchResult runSearch(Map<String, Object> body) {
        String city = text(body.get("city"));
        String category = text(body.get("category"));
        String area = text(body.get("area"));
        int limit = number(body.get("limit"), GeoapifyService.MAX_RESULTS);
        Double lat = decimal(body.get("lat"));
        Double lon = decimal(body.get("lon"));
        boolean around = lat != null && lon != null;
        if (category.isEmpty() || (!around && city.isEmpty())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please enter a city and a business type");
        }
        if (around && (Math.abs(lat) > 90 || Math.abs(lon) > 180)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That map position is not valid. Please move the map and try again.");
        }

        String provider = provider();
        if (around && !provider.equals("Geoapify")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Searching around the map needs the free Geoapify data source. Please use Find Leads instead.");
        }
        if (around) {
            int radius = Math.max(500, Math.min(number(body.get("radius"), 1500), 5000));
            useOneSearch();
            try {
                return geoapifyService.searchAround(category, lat, lon, radius, limit);
            } catch (RestClientException e) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "The business search service is not responding. Please try again in a minute.");
            }
        }

        if (!provider.equals("Demo")) useOneSearch();      // demo searches are free -> not counted

        try {
            return switch (provider) {
                case "Geoapify" -> geoapifyService.search(category, city, area, limit);
                default -> SearchDeduplicator.dedupe(placesService.search(category, city, area, limit), null);   // Google, or demo
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

    private static Double decimal(Object o) {
        if (o instanceof Number n) return n.doubleValue();
        try {
            return o == null || o.toString().isBlank() ? null : Double.valueOf(o.toString().trim());
        } catch (NumberFormatException e) {
            return null;
        }
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
