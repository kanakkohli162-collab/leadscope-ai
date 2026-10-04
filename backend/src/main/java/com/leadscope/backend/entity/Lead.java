package com.leadscope.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

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
    private String phone;
    private Integer score;
    private String status = "NEW";
}