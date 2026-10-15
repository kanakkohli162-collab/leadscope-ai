package com.leadscope.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "leads")
@Data
public class Lead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Basic business details
    private String businessName;
    private String category;
    private String city;
    private String address;
    private String phone;
    private String website;

    // Map position (from search results, or geocoded once from the address). Null for old leads.
    private Double latitude;
    private Double longitude;

    // Google data
    private Double rating;
    private Integer reviewCount;

    // Scoring
    private Integer score;
    private String priority;          // HIGH, MEDIUM, LOW

    @Column(length = 1000)
    private String opportunities;     // e.g. "No website, Incomplete Google profile"

    // "Why this score?" rules, filled by LeadScoringService for search results. Not stored in the database.
    @Transient
    private List<Map<String, Object>> scoreBreakdown;

    // Last Review Sentiment result (null = never analysed)
    private String sentimentLabel;    // Positive, Neutral, Negative
    private Integer sentimentScore;   // -100 … +100

    // Last Website Checker result (null = never checked)
    private Integer websiteHealthScore; // 0 … 100
    private Boolean websiteOutdated;

    // CRM
    private String status = "NEW";    // NEW, CONTACTED, FOLLOW_UP, INTERESTED, WON, NOT_INTERESTED

    @Column(length = 2000)
    private String notes;

    private Boolean doNotContact = false;
    private String source = "Google";

    // Owner: which agency (user) this lead belongs to   (NEW)
    private String ownerEmail;

    // Automatic dates
    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}