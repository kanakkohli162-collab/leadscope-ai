package com.leadscope.backend.dto;

import com.leadscope.backend.entity.Lead;

import java.util.List;

public record SearchResult(List<Lead> results, int duplicatesRemoved) {
}
