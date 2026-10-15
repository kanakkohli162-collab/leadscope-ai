package com.leadscope.backend.service;

import com.leadscope.backend.entity.Lead;
import com.leadscope.backend.repository.LeadRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

/**
 * Nearby Competitor Check: compares a lead with similar businesses within 1 km.
 * e.g. "4 of 5 nearby cafes have a website. Cafe Mocha Point does not – a website would help it compete."
 * Uses Geoapify (OpenStreetMap). Leads without coordinates are geocoded once and saved.
 */
@Service
public class CompetitorService {

    private static final int RADIUS_METERS = 1000;
    private static final int LIMIT = 20;
    private static final int SHOW = 5;

    private final GeoapifyService geoapifyService;
    private final LeadRepository leadRepository;

    public CompetitorService(GeoapifyService geoapifyService, LeadRepository leadRepository) {
        this.geoapifyService = geoapifyService;
        this.leadRepository = leadRepository;
    }

    public Map<String, Object> compare(Lead lead) {
        if (!geoapifyService.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Nearby comparison is not available right now. The map service is not set up.");
        }

        List<Map<String, Object>> places;
        try {
            ensureCoordinates(lead);
            places = geoapifyService.nearby(lead.getCategory(), lead.getLatitude(), lead.getLongitude(), RADIUS_METERS, LIMIT);
        } catch (HttpClientErrorException.TooManyRequests e) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "The map service's daily limit is reached. Please try again tomorrow.");
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "The map service is not responding. Please try again in a minute.");
        }

        // Leave out the lead itself (same name), then nearest first
        String ownName = normalise(lead.getBusinessName());
        List<Map<String, Object>> others = new ArrayList<>();
        for (Map<String, Object> p : places) {
            if (normalise((String) p.get("name")).equals(ownName)) continue;
            int metres = (int) Math.round(distance(lead.getLatitude(), lead.getLongitude(),
                    (Double) p.get("lat"), (Double) p.get("lon")));
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("name", p.get("name"));
            item.put("distanceMeters", metres);
            item.put("hasWebsite", p.get("hasWebsite"));
            item.put("hasPhone", p.get("hasPhone"));
            others.add(item);
        }
        others.sort(Comparator.comparingInt(m -> (Integer) m.get("distanceMeters")));

        int total = others.size();
        int withWebsite = (int) others.stream().filter(m -> Boolean.TRUE.equals(m.get("hasWebsite"))).count();
        int withPhone = (int) others.stream().filter(m -> Boolean.TRUE.equals(m.get("hasPhone"))).count();
        boolean leadHasWebsite = lead.getWebsite() != null && !lead.getWebsite().isBlank();

        List<Map<String, Object>> nearest = new ArrayList<>();
        for (Map<String, Object> m : others.subList(0, Math.min(SHOW, total))) {
            Map<String, Object> item = new LinkedHashMap<>(m);
            item.remove("hasPhone");
            nearest.add(item);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalNearby", total);
        result.put("withWebsite", withWebsite);
        result.put("withoutWebsite", total - withWebsite);
        result.put("withPhone", withPhone);
        result.put("percentWithWebsite", total == 0 ? 0 : Math.round(withWebsite * 100f / total));
        result.put("leadHasWebsite", leadHasWebsite);
        result.put("radiusMeters", RADIUS_METERS);
        result.put("nearby", nearest);
        result.put("insight", insight(lead, total, withWebsite, leadHasWebsite));
        return result;
    }

    /** Old leads have no coordinates: geocode the address once and remember it. */
    private void ensureCoordinates(Lead lead) {
        if (lead.getLatitude() != null && lead.getLongitude() != null) return;

        String address = lead.getAddress();
        boolean usable = address != null && !address.isBlank() && !address.equals("—");
        String text = usable ? address : lead.getBusinessName();
        if (lead.getCity() != null && (text == null || !text.toLowerCase().contains(lead.getCity().toLowerCase()))) {
            text = (text == null ? "" : text + ", ") + lead.getCity();
        }
        if (text == null || text.isBlank()) throw noLocation();

        double[] point = geoapifyService.geocode(text);
        if (point == null) throw noLocation();
        lead.setLatitude(point[0]);
        lead.setLongitude(point[1]);
        leadRepository.save(lead);
    }

    private ResponseStatusException noLocation() {
        return new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                "We couldn't find this business on the map, so nearby businesses can't be compared.");
    }

    private String insight(Lead lead, int total, int withWebsite, boolean leadHasWebsite) {
        String name = lead.getBusinessName() == null ? "This business" : lead.getBusinessName();
        String kind = plural(lead.getCategory());
        if (total == 0) {
            return "No other " + kind + " found within 1 km. " + name + " has little direct competition nearby.";
        }
        String count = total == 1
                ? "The only nearby " + singular(lead.getCategory()) + (withWebsite == 1 ? " has a website." : " has no website.")
                : withWebsite + " of " + total + " nearby " + kind + (withWebsite == 1 ? " has" : " have") + " a website.";
        if (!leadHasWebsite && withWebsite == 0) {
            return (total == 1 ? count : "None of the " + total + " nearby " + kind + " have a website.") + " " + name
                    + " could be the first – an easy way to stand out.";
        }
        if (!leadHasWebsite) {
            return count + " " + name + " does not – a website would help it compete.";
        }
        if (withWebsite * 2 < total) {
            return count + " " + name + " has one, so it is ahead online. Offer SEO to stay ahead.";
        }
        return count + " " + name + " has one too – offer a better, faster website to beat them.";
    }

    /** "Cafe" -> "cafes", "Pharmacy" -> "pharmacies", empty -> "businesses" */
    private String plural(String category) {
        String c = category == null ? "" : category.trim().toLowerCase();
        if (c.isEmpty()) return "businesses";
        if (c.endsWith("s")) return c;
        if (c.endsWith("y") && !c.matches(".*[aeiou]y$")) return c.substring(0, c.length() - 1) + "ies";
        return c + "s";
    }

    private String singular(String category) {
        String c = category == null ? "" : category.trim().toLowerCase();
        return c.isEmpty() ? "business" : c;
    }

    private String normalise(String s) {
        return s == null ? "" : s.toLowerCase().replaceAll("[^a-z0-9]", "");
    }

    /** Straight-line distance in metres (haversine). */
    private double distance(double lat1, double lon1, double lat2, double lon2) {
        double r = 6_371_000;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return 2 * r * Math.asin(Math.sqrt(a));
    }
}
