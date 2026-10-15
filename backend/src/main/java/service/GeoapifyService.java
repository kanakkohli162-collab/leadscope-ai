package com.leadscope.backend.service;

import com.leadscope.backend.entity.Lead;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

/**
 * Finds REAL businesses for free with the Geoapify Places API (OpenStreetMap data).
 * Free plan: 3,000 credits/day, no credit card. One search = 2 calls (city + places).
 */
@Service
public class GeoapifyService {

    private static final String GEOCODE_URL = "https://api.geoapify.com/v1/geocode/search";
    private static final String PLACES_URL = "https://api.geoapify.com/v2/places";

    // What the user types  ->  Geoapify category (first match wins)
    private static final Map<String, String> CATEGORY_MAP = new LinkedHashMap<>();
    static {
        CATEGORY_MAP.put("gym", "sport.fitness");
        CATEGORY_MAP.put("fitness", "sport.fitness");
        CATEGORY_MAP.put("dent", "healthcare.dentist");
        CATEGORY_MAP.put("clinic", "healthcare.clinic_or_praxis");
        CATEGORY_MAP.put("doctor", "healthcare.clinic_or_praxis");
        CATEGORY_MAP.put("hospital", "healthcare.hospital");
        CATEGORY_MAP.put("pharma", "healthcare.pharmacy");
        CATEGORY_MAP.put("chemist", "healthcare.pharmacy");
        CATEGORY_MAP.put("medical", "healthcare.pharmacy");
        CATEGORY_MAP.put("cafe", "catering.cafe");
        CATEGORY_MAP.put("coffee", "catering.cafe");
        CATEGORY_MAP.put("restaurant", "catering.restaurant");
        CATEGORY_MAP.put("food", "catering.restaurant");
        CATEGORY_MAP.put("bakery", "commercial.food_and_drink.bakery");
        CATEGORY_MAP.put("cake", "commercial.food_and_drink.bakery");
        CATEGORY_MAP.put("salon", "service.beauty");
        CATEGORY_MAP.put("parlour", "service.beauty");
        CATEGORY_MAP.put("parlor", "service.beauty");
        CATEGORY_MAP.put("beauty", "service.beauty");
        CATEGORY_MAP.put("spa", "service.beauty");
        CATEGORY_MAP.put("barber", "service.beauty");
        CATEGORY_MAP.put("hotel", "accommodation.hotel");
        CATEGORY_MAP.put("school", "education.school");
        CATEGORY_MAP.put("college", "education.college");
        CATEGORY_MAP.put("real estate", "office.estate_agent");
        CATEGORY_MAP.put("property", "office.estate_agent");
        CATEGORY_MAP.put("lawyer", "office.lawyer");
        CATEGORY_MAP.put("advocate", "office.lawyer");
        CATEGORY_MAP.put("cloth", "commercial.clothing");
        CATEGORY_MAP.put("boutique", "commercial.clothing");
        CATEGORY_MAP.put("fashion", "commercial.clothing");
        CATEGORY_MAP.put("supermarket", "commercial.supermarket");
        CATEGORY_MAP.put("grocery", "commercial.supermarket");
        CATEGORY_MAP.put("jewel", "commercial.jewelry");
        CATEGORY_MAP.put("pet", "pet");
        CATEGORY_MAP.put("vet", "pet");
    }
    private static final String DEFAULT_CATEGORY = "commercial";

    private final String apiKey;
    private final LeadScoringService scoringService;
    private final RestClient restClient = RestClient.create();

    public GeoapifyService(@Value("${geoapify.key:}") String apiKey, LeadScoringService scoringService) {
        this.apiKey = apiKey;
        this.scoringService = scoringService;
    }

    public boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    public List<Lead> search(String category, String city) {
        String cityId = findCityId(city);
        if (cityId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "City not found: " + city + ". Please check the spelling.");
        }

        String geoCategory = toGeoapifyCategory(category);
        List<Map<String, Object>> features;
        try {
            features = findPlaces(geoCategory, cityId);
        } catch (HttpClientErrorException e) {
            features = findPlaces(DEFAULT_CATEGORY, cityId);   // unknown category -> broad search
        }

        List<Lead> results = new ArrayList<>();
        for (Map<String, Object> feature : features) {
            Map<String, Object> p = asMap(feature.get("properties"));
            String name = str(p.get("name"));
            if (name == null) continue;                          // skip places without a name

            Map<String, Object> contact = asMap(p.get("contact"));
            Map<String, Object> raw = asMap(asMap(p.get("datasource")).get("raw"));

            String phone = first(str(contact.get("phone")), str(raw.get("phone")), str(raw.get("contact:phone")));
            String website = first(str(p.get("website")), str(raw.get("website")), str(raw.get("contact:website")));
            String hours = first(str(p.get("opening_hours")), str(raw.get("opening_hours")));

            Lead lead = new Lead();
            lead.setBusinessName(name);
            lead.setCategory(category);
            lead.setCity(city);
            lead.setAddress(first(str(p.get("formatted")), str(p.get("address_line2"))));
            lead.setPhone(phone);
            lead.setWebsite(website);
            lead.setLatitude(number(p.get("lat")));                // used later by Nearby Competitor Check
            lead.setLongitude(number(p.get("lon")));
            lead.setSource("Geoapify / OpenStreetMap");          // attribution required by the free plan
            // OpenStreetMap has no ratings/reviews -> left empty; scoring skips those rules
            scoringService.score(lead, hours != null);
            results.add(lead);
        }

        results.sort(Comparator.comparing(Lead::getScore).reversed());   // best opportunities first
        return results;
    }

    // Step 1: city name -> Geoapify place id (prefers Indian cities)
    @SuppressWarnings("unchecked")
    private String findCityId(String city) {
        Map<String, Object> res = restClient.get()
                .uri(GEOCODE_URL + "?text={t}&type=city&format=json&limit=1&bias=countrycode:in&apiKey={k}", city, apiKey)
                .retrieve()
                .body(Map.class);
        List<Map<String, Object>> list = res == null ? List.of()
                : (List<Map<String, Object>>) res.getOrDefault("results", List.of());
        return list.isEmpty() ? null : str(list.get(0).get("place_id"));
    }

    // Step 2: businesses of that category inside the city
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> findPlaces(String geoCategory, String cityId) {
        Map<String, Object> res = restClient.get()
                .uri(PLACES_URL + "?categories={c}&filter=place:{p}&limit=500&apiKey={k}", geoCategory, cityId, apiKey)
                .retrieve()
                .body(Map.class);
        return res == null ? List.of() : (List<Map<String, Object>>) res.getOrDefault("features", List.of());
    }

    // ---- Nearby Competitor Check ----

    /** Address text -> { lat, lon }, or null if Geoapify can't find it. */
    @SuppressWarnings("unchecked")
    public double[] geocode(String text) {
        Map<String, Object> res = restClient.get()
                .uri(GEOCODE_URL + "?text={t}&format=json&limit=1&bias=countrycode:in&apiKey={k}", text, apiKey)
                .retrieve()
                .body(Map.class);
        List<Map<String, Object>> list = res == null ? List.of()
                : (List<Map<String, Object>>) res.getOrDefault("results", List.of());
        if (list.isEmpty()) return null;
        Double lat = number(list.get(0).get("lat"));
        Double lon = number(list.get(0).get("lon"));
        return lat == null || lon == null ? null : new double[] { lat, lon };
    }

    /**
     * Businesses of the same category within `radiusMeters` of a point (max `limit`).
     * Each item: name, lat, lon, hasWebsite, hasPhone.
     */
    public List<Map<String, Object>> nearby(String category, double lat, double lon, int radiusMeters, int limit) {
        List<Map<String, Object>> features;
        try {
            features = findPlacesAround(toGeoapifyCategory(category), lat, lon, radiusMeters, limit);
        } catch (HttpClientErrorException.BadRequest e) {
            features = findPlacesAround(DEFAULT_CATEGORY, lat, lon, radiusMeters, limit);   // unknown category -> broad search
        }

        List<Map<String, Object>> places = new ArrayList<>();
        for (Map<String, Object> feature : features) {
            Map<String, Object> p = asMap(feature.get("properties"));
            String name = str(p.get("name"));
            Double pLat = number(p.get("lat"));
            Double pLon = number(p.get("lon"));
            if (name == null || pLat == null || pLon == null) continue;

            Map<String, Object> contact = asMap(p.get("contact"));
            Map<String, Object> raw = asMap(asMap(p.get("datasource")).get("raw"));
            String phone = first(str(contact.get("phone")), str(raw.get("phone")), str(raw.get("contact:phone")));
            String website = first(str(p.get("website")), str(raw.get("website")), str(raw.get("contact:website")));

            Map<String, Object> place = new LinkedHashMap<>();
            place.put("name", name);
            place.put("lat", pLat);
            place.put("lon", pLon);
            place.put("hasWebsite", website != null);
            place.put("hasPhone", phone != null);
            places.add(place);
        }
        return places;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> findPlacesAround(String geoCategory, double lat, double lon, int radius, int limit) {
        // Geoapify wants lon,lat (in that order) for circle filters
        Map<String, Object> res = restClient.get()
                .uri(PLACES_URL + "?categories={c}&filter=circle:{lon},{lat},{r}&bias=proximity:{lon2},{lat2}&limit={l}&apiKey={k}",
                        geoCategory, lon, lat, radius, lon, lat, limit, apiKey)
                .retrieve()
                .body(Map.class);
        return res == null ? List.of() : (List<Map<String, Object>>) res.getOrDefault("features", List.of());
    }

    private String toGeoapifyCategory(String category) {
        String c = category == null ? "" : category.toLowerCase();
        for (Map.Entry<String, String> e : CATEGORY_MAP.entrySet()) {
            if (c.contains(e.getKey())) return e.getValue();
        }
        return DEFAULT_CATEGORY;
    }

    // ---- small helpers ----
    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object o) {
        return o instanceof Map ? (Map<String, Object>) o : Map.of();
    }

    private static String str(Object o) {
        if (o == null) return null;
        String s = o.toString().trim();
        return s.isEmpty() ? null : s;
    }

    private static Double number(Object o) {
        if (o instanceof Number n) return n.doubleValue();
        try {
            return o == null ? null : Double.valueOf(o.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static String first(String... values) {
        for (String v : values) if (v != null) return v;
        return null;
    }
}