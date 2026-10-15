package com.leadscope.backend.service;

import com.leadscope.backend.dto.SearchResult;
import com.leadscope.backend.entity.Lead;

import java.util.*;

/**
 * Removes duplicate places from search results: same place id, or same name + address
 * (compared without case, spaces or punctuation). Of two duplicates, the one with more details is kept.
 */
public final class SearchDeduplicator {

    private SearchDeduplicator() {
    }

    /** @param placeIds the data source's place id for each lead (same order), or null if there are none */
    public static SearchResult dedupe(List<Lead> leads, List<String> placeIds) {
        List<Lead> kept = new ArrayList<>();
        Map<String, Integer> slotByKey = new HashMap<>();   // key -> index in `kept`

        for (int i = 0; i < leads.size(); i++) {
            Lead lead = leads.get(i);
            List<String> keys = new ArrayList<>(2);
            String id = placeIds == null ? null : placeIds.get(i);
            if (id != null) keys.add("id:" + id);
            keys.add("na:" + normalise(lead.getBusinessName()) + "|" + normalise(lead.getAddress()));

            Integer slot = null;
            for (String k : keys) {
                if (slotByKey.containsKey(k)) {
                    slot = slotByKey.get(k);
                    break;
                }
            }
            if (slot == null) {
                slot = kept.size();
                kept.add(lead);
            } else if (details(lead) > details(kept.get(slot))) {
                kept.set(slot, lead);
            }
            for (String k : keys) slotByKey.put(k, slot);
        }
        return new SearchResult(kept, leads.size() - kept.size());
    }

    /** "Café  Mocha, M.G. Road" -> "cafémochamgroad" */
    public static String normalise(String text) {
        return text == null ? "" : text.toLowerCase(Locale.ROOT).replaceAll("[^\\p{L}\\p{N}]", "");
    }

    private static int details(Lead l) {
        int n = 0;
        if (l.getPhone() != null) n++;
        if (l.getWebsite() != null) n++;
        if (l.getAddress() != null) n++;
        if (l.getLatitude() != null) n++;
        if (l.getRating() != null) n++;
        // Fewer gaps = more details listed (e.g. opening hours)
        return n * 10 - (l.getOpportunities() == null ? 0 : l.getOpportunities().length() / 20);
    }
}
