package com.leadscope.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private String agencyName;

    private String defaultCity;
    private String defaultBusinessType;
    private String defaultTone;
    private String defaultLanguage;
    private String defaultChannel;

    public static UserResponse of(com.leadscope.backend.entity.User u) {
        return new UserResponse(u.getId(), u.getName(), u.getEmail(), u.getAgencyName(),
                u.getDefaultCity(), u.getDefaultBusinessType(), u.getDefaultTone(), u.getDefaultLanguage(), u.getDefaultChannel());
    }
}
