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

    private String businessName;
    private String category;
    private String city;
    private String address;
    private String phone;
    private String website;

    private Double latitude;
    private Double longitude;
    private Boolean locationApproximate;

    private Double rating;
    private Integer reviewCount;

    private Integer score;
    private String priority;

    @Column(length = 1000)
    private String opportunities;

    @Transient
    private List<Map<String, Object>> scoreBreakdown;

    private String sentimentLabel;
    private Integer sentimentScore;

    private Integer websiteHealthScore;
    private Boolean websiteOutdated;

    @Column(length = 500)
    private String email;
    @Column(length = 500)
    private String instagramUrl;
    @Column(length = 500)
    private String facebookUrl;
    @Column(length = 500)
    private String linkedinUrl;
    @Column(length = 500)
    private String twitterUrl;
    @Column(length = 500)
    private String youtubeUrl;
    @Column(length = 500)
    private String whatsappUrl;
    private String socialPresence;
    private LocalDateTime enrichedAt;

    @Transient
    private Boolean alreadySaved;

    private Long dealValue;

    private String status = "NEW";

    @Column(length = 2000)
    private String notes;

    private Boolean doNotContact = false;
    private String source = "Google";

    private String ownerEmail;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}