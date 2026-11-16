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

    @Column(length = 300)
    private String servicesOffered;
    private String senderName;
    private String senderPhone;
    private String senderWebsite;
    @Column(length = 500)
    private String signature;

    private String defaultCity;
    private String defaultBusinessType;
    private String defaultTone;
    private String defaultLanguage;
    private String defaultChannel;

    private LocalDateTime lastLoginAt;
    private LocalDateTime previousLoginAt;

    private String usageMonth;
    private Integer searchesThisMonth;
    private Integer aiMessagesThisMonth;
    private Integer websiteChecksThisMonth;

    @CreationTimestamp
    private LocalDateTime createdAt;
}