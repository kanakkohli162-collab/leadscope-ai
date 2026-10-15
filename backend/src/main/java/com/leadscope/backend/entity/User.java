package com.leadscope.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String agencyName;

    // Agency profile, used by Write Message (all optional)
    @Column(length = 300)
    private String servicesOffered;   // comma-separated, e.g. "Websites, SEO, Google listing"
    private String senderName;
    private String senderPhone;
    private String senderWebsite;
    @Column(length = 500)
    private String signature;         // ends every AI message when set

    // Default choices that pre-fill Find Leads and Write Message
    private String defaultCity;
    private String defaultBusinessType;
    private String defaultTone;       // Friendly, Professional, Short
    private String defaultLanguage;   // English, Hindi, Hinglish
    private String defaultChannel;    // whatsapp, email, linkedin

    // Security: this login and the one before it
    private LocalDateTime lastLoginAt;
    private LocalDateTime previousLoginAt;

    // Usage this month (simple counters; reset when a new month starts, see UsageService)
    private String usageMonth;        // e.g. "2026-10"
    private Integer searchesThisMonth;
    private Integer aiMessagesThisMonth;
    private Integer websiteChecksThisMonth;

    @CreationTimestamp
    private LocalDateTime createdAt;
}