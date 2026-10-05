package com.leadscope.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

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

    // Google data
    private Double rating;
    private Integer reviewCount;

    // Scoring
    private Integer score;
    private String priority;          // HIGH, MEDIUM, LOW

    @Column(length = 1000)
    private String opportunities;     // e.g. "No website, Incomplete Google profile"

    // CRM
    private String status = "NEW";    // NEW, CONTACTED, FOLLOW_UP, INTERESTED, WON, NOT_INTERESTED

    @Column(length = 2000)
    private String notes;

    private Boolean doNotContact = false;
    private String source = "Google";

    // Automatic dates
    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}