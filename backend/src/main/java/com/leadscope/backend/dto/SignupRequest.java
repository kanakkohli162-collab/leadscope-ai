package com.leadscope.backend.dto;

import lombok.Data;

@Data
public class SignupRequest {
    private String name;
    private String email;
    private String password;      // plain text here, only for a moment
    private String agencyName;
}