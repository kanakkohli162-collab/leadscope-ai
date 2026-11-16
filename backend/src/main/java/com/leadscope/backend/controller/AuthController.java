package com.leadscope.backend.controller;

import com.leadscope.backend.dto.AuthResponse;
import com.leadscope.backend.dto.LoginRequest;
import com.leadscope.backend.dto.SignupRequest;
import com.leadscope.backend.dto.UserResponse;
import com.leadscope.backend.entity.User;
import com.leadscope.backend.repository.UserRepository;
import com.leadscope.backend.security.JwtService;
import com.leadscope.backend.service.LoginAttemptService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LoginAttemptService loginAttempts;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder,
                          JwtService jwtService, LoginAttemptService loginAttempts) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.loginAttempts = loginAttempts;
    }

    @PostMapping("/signup")
    public UserResponse signup(@RequestBody SignupRequest request) {
        String email = request.getEmail() == null ? "" : request.getEmail().trim();

        if (email.isBlank() || !email.contains("@")
                || request.getPassword() == null || request.getPassword().length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A valid email and a password of at least 6 characters are required");
        }
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "An account with this email already exists. Please sign in instead.");
        }
        User user = new User();
        user.setName(request.getName());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setAgencyName(request.getAgencyName());
        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        String email = request.getEmail() == null ? "" : request.getEmail().trim();

        loginAttempts.checkBlocked(email);

        Optional<User> found = userRepository.findByEmail(email);
        boolean ok = found.isPresent()
                && request.getPassword() != null
                && passwordEncoder.matches(request.getPassword(), found.get().getPassword());

        if (!ok) {
            loginAttempts.recordFailure(email);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }

        loginAttempts.reset(email);
        User user = found.get();
        user.setPreviousLoginAt(user.getLastLoginAt());
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);
        String token = jwtService.generateToken(user.getEmail());
        return new AuthResponse(token, toResponse(user));
    }

    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in to continue."));
        return toResponse(user);
    }

    private UserResponse toResponse(User user) {
        return UserResponse.of(user);
    }
}