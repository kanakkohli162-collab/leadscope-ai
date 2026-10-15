package com.leadscope.backend.dto;

import com.leadscope.backend.entity.Lead;

import java.util.List;

/** POST /api/search response: scored businesses (not saved) + how many duplicate places were removed. */
public record SearchResult(List<Lead> results, int duplicatesRemoved) {
}
