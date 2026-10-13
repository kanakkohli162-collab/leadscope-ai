package com.leadscope.backend.service;

import com.leadscope.backend.entity.Lead;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

/**
 * Finds businesses with the Google Places API (Text Search).
 * If no API key is set, it returns sample businesses (demo mode)
 * so the app still works for development and demos.
 */
@Service
public class PlacesService {

    private static final String URL = "https://places.googleapis.com/v1/places:searchText";
    // Only the fields we need (Google charges by the fields requested)
    private static final String FIELDS = "places.displayName,places.formattedAddress,places.nationalPhoneNumber,"
            + "places.websiteUri,places.rating,places.userRatingCount,places.regularOpeningHours";

    private final String apiKey;
    private final LeadScoringService scoringService;
    private final RestClient restClient = RestClient.create();

    public PlacesService(@Value("${google.places.key:}") String apiKey, LeadScoringService scoringService) {
        this.apiKey = apiKey;
        this.scoringService = scoringService;
    }

    @SuppressWarnings("unchecked")
    public List<Lead> search(String category, String city) {
        if (apiKey == null || apiKey.isBlank()) {
            return demoResults(category, city);
        }

        Map<String, Object> requestBody = Map.of("textQuery", category + " in " + city, "pageSize", 20);

        Map<String, Object> response = restClient.post()
                .uri(URL)
                .header("X-Goog-Api-Key", apiKey)
                .header("X-Goog-FieldMask", FIELDS)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        List<Map<String, Object>> places = response == null
                ? List.of()
                : (List<Map<String, Object>>) response.getOrDefault("places", List.of());

        List<Lead> results = new ArrayList<>();
        for (Map<String, Object> place : places) {
            Lead lead = new Lead();
            Map<String, Object> displayName = (Map<String, Object>) place.get("displayName");
            lead.setBusinessName(displayName != null ? (String) displayName.get("text") : "Unnamed business");
            lead.setCategory(category);
            lead.setCity(city);
            lead.setAddress((String) place.get("formattedAddress"));
            lead.setPhone((String) place.get("nationalPhoneNumber"));
            lead.setWebsite((String) place.get("websiteUri"));
            if (place.get("rating") instanceof Number rating) lead.setRating(rating.doubleValue());
            if (place.get("userRatingCount") instanceof Number count) lead.setReviewCount(count.intValue());
            lead.setSource("Google");

            scoringService.score(lead, place.get("regularOpeningHours") != null);
            results.add(lead);
        }

        results.sort(Comparator.comparing(Lead::getScore).reversed());   // best opportunities first
        return results;
    }

    // Sample businesses used when no Google key is configured
    private List<Lead> demoResults(String category, String city) {
        Object[][] samples = {
                // name, website, phone, rating, reviews, hasHours
                {"Smile Care " + category, null, "+91 98765 43210", 4.4, 18, false},
                {"City " + category + " Centre", "www.citycentre.in", "+91 98765 43211", 3.2, 210, true},
                {"Sunrise " + category, null, "+91 98765 43212", 4.1, 145, true},
                {"Green Life " + category, "www.greenlife.in", null, 4.5, 12, false},
                {"Prime " + category + " Clinic", "www.primeclinic.in", "+91 98765 43214", 4.7, 320, true},
        };

        List<Lead> results = new ArrayList<>();
        for (Object[] s : samples) {
            Lead lead = new Lead();
            lead.setBusinessName((String) s[0]);
            lead.setCategory(category);
            lead.setCity(city);
            lead.setAddress("Sample address, " + city);
            lead.setWebsite((String) s[1]);
            lead.setPhone((String) s[2]);
            lead.setRating((Double) s[3]);
            lead.setReviewCount((Integer) s[4]);
            lead.setSource("Demo");
            scoringService.score(lead, (Boolean) s[5]);
            results.add(lead);
        }
        results.sort(Comparator.comparing(Lead::getScore).reversed());
        return results;
    }
}