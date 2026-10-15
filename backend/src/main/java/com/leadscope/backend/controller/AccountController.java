package com.leadscope.backend.controller;

import com.leadscope.backend.dto.UserResponse;
import com.leadscope.backend.entity.User;
import com.leadscope.backend.repository.LeadRepository;
import com.leadscope.backend.repository.UserRepository;
import com.leadscope.backend.service.UsageService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.YearMonth;
import java.util.*;

/**
 * Settings page: the logged-in user's own account only (the user comes from the token, never from the request).
 *   GET    /api/account              -> profile, agency profile, defaults, last login, usage this month
 *   PUT    /api/account/profile      { name, agencyName }
 *   PUT    /api/account/password     { currentPassword, newPassword }
 *   PUT    /api/account/agency       { servicesOffered[], senderName, senderPhone, senderWebsite, signature }
 *   PUT    /api/account/preferences  { defaultCity, defaultBusinessType, defaultTone, defaultLanguage, defaultChannel }
 *   DELETE /api/account              { confirm: "DELETE" } -> deletes all leads + the account
 */
@RestController
@RequestMapping("/api/account")
public class AccountController {

    public static final List<String> SERVICES = List.of("Websites", "SEO", "Social media", "Google listing", "Ads", "Branding");
    private static final List<String> TONES = List.of("Friendly", "Professional", "Short");
    private static final List<String> LANGUAGES = List.of("English", "Hindi", "Hinglish");
    private static final List<String> CHANNELS = List.of("whatsapp", "email", "linkedin");

    private final UserRepository userRepository;
    private final LeadRepository leadRepository;
    private final PasswordEncoder passwordEncoder;
    private final UsageService usageService;

    public AccountController(UserRepository userRepository, LeadRepository leadRepository,
                             PasswordEncoder passwordEncoder, UsageService usageService) {
        this.userRepository = userRepository;
        this.leadRepository = leadRepository;
        this.passwordEncoder = passwordEncoder;
        this.usageService = usageService;
    }

    @GetMapping
    public Map<String, Object> account(Authentication auth) {
        User u = me(auth);
        Map<String, Object> agency = new LinkedHashMap<>();
        agency.put("servicesOffered", splitServices(u.getServicesOffered()));
        agency.put("senderName", u.getSenderName());
        agency.put("senderPhone", u.getSenderPhone());
        agency.put("senderWebsite", u.getSenderWebsite());
        agency.put("signature", u.getSignature());

        Map<String, Object> usage = usageService.thisMonth(u);
        usage.put("leadsSaved", leadRepository.countByOwnerEmailAndCreatedAtAfter(u.getEmail(),
                YearMonth.now().atDay(1).atStartOfDay()));
        usage.put("totalLeads", leadRepository.countByOwnerEmail(u.getEmail()));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("user", UserResponse.of(u));
        result.put("agency", agency);
        result.put("serviceOptions", SERVICES);
        result.put("lastLoginAt", u.getPreviousLoginAt());   // the login before this session
        result.put("currentLoginAt", u.getLastLoginAt());
        result.put("memberSince", u.getCreatedAt());
        result.put("usage", usage);
        return result;
    }

    @PutMapping("/profile")
    public UserResponse updateProfile(@RequestBody Map<String, String> body, Authentication auth) {
        User u = me(auth);
        String name = clean(body.get("name"), 80);
        if (name == null) throw bad("Please enter your name.");
        u.setName(name);
        u.setAgencyName(clean(body.get("agencyName"), 120));
        return UserResponse.of(userRepository.save(u));
    }

    @PutMapping("/password")
    public Map<String, String> changePassword(@RequestBody Map<String, String> body, Authentication auth) {
        User u = me(auth);
        String current = body.get("currentPassword");
        String next = body.get("newPassword");
        if (current == null || !passwordEncoder.matches(current, u.getPassword())) {
            throw bad("Your current password is not correct.");
        }
        if (next == null || next.length() < 8 || !next.matches(".*[A-Za-z].*") || !next.matches(".*\\d.*")) {
            throw bad("The new password needs at least 8 characters, with a letter and a number.");
        }
        if (next.length() > 72) throw bad("Please use a password of 72 characters or less.");   // BCrypt limit
        if (passwordEncoder.matches(next, u.getPassword())) throw bad("The new password must be different from the current one.");
        u.setPassword(passwordEncoder.encode(next));
        userRepository.save(u);
        return Map.of("message", "Password changed.");
    }

    @PutMapping("/agency")
    public Map<String, Object> updateAgency(@RequestBody Map<String, Object> body, Authentication auth) {
        User u = me(auth);
        List<String> chosen = new ArrayList<>();
        if (body.get("servicesOffered") instanceof Collection<?> list) {
            for (Object o : list) {
                String s = String.valueOf(o);
                if (SERVICES.contains(s) && !chosen.contains(s)) chosen.add(s);
            }
        }
        u.setServicesOffered(chosen.isEmpty() ? null : String.join(", ", chosen));
        u.setSenderName(clean(text(body.get("senderName")), 80));
        u.setSenderPhone(clean(text(body.get("senderPhone")), 30));
        u.setSenderWebsite(clean(text(body.get("senderWebsite")), 200));
        u.setSignature(clean(text(body.get("signature")), 500));
        userRepository.save(u);
        return account(auth);
    }

    @PutMapping("/preferences")
    public UserResponse updatePreferences(@RequestBody Map<String, String> body, Authentication auth) {
        User u = me(auth);
        u.setDefaultCity(clean(body.get("defaultCity"), 60));
        u.setDefaultBusinessType(clean(body.get("defaultBusinessType"), 60));
        u.setDefaultTone(oneOf(body.get("defaultTone"), TONES));
        u.setDefaultLanguage(oneOf(body.get("defaultLanguage"), LANGUAGES));
        u.setDefaultChannel(oneOf(body.get("defaultChannel"), CHANNELS));
        return UserResponse.of(userRepository.save(u));
    }

    @DeleteMapping
    @Transactional
    public Map<String, String> deleteAccount(@RequestBody Map<String, String> body, Authentication auth) {
        if (!"DELETE".equals(body.get("confirm"))) throw bad("Type DELETE to confirm.");
        User u = me(auth);
        leadRepository.deleteByOwnerEmail(u.getEmail());
        userRepository.delete(u);
        return Map.of("message", "Your account and all your leads were deleted.");
    }

    // ---------- helpers ----------

    private User me(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in to continue."));
    }

    /** "Websites, SEO" -> ["Websites", "SEO"] */
    public static List<String> splitServices(String text) {
        if (text == null || text.isBlank()) return List.of();
        return Arrays.stream(text.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    private static String text(Object o) {
        return o == null ? null : o.toString();
    }

    private static String clean(String s, int max) {
        if (s == null || s.isBlank()) return null;
        String t = s.trim();
        return t.length() > max ? t.substring(0, max) : t;
    }

    private static String oneOf(String value, List<String> allowed) {
        if (value == null) return null;
        for (String a : allowed) if (a.equalsIgnoreCase(value.trim())) return a;
        return null;
    }

    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
