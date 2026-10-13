package com.leadscope.backend.controller;

import com.leadscope.backend.dto.AuthResponse;
import com.leadscope.backend.dto.LoginRequest;
import com.leadscope.backend.dto.SignupRequest;
import com.leadscope.backend.dto.UserResponse;
import com.leadscope.backend.entity.User;
import com.leadscope.backend.repository.UserRepository;
import com.leadscope.backend.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/signup")
    public UserResponse signup(@RequestBody SignupRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()
                || request.getPassword() == null || request.getPassword().length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Email and a password of at least 6 characters are required");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "An account with this email already exists. Please sign in instead.");
        }
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setAgencyName(request.getAgencyName());
        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        // 404 = we don't know this email at all
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No account found with this email. Please sign up first."));

        // 401 = the email exists but the password doesn't match the BCrypt hash
        if (request.getPassword() == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect password. Please try again.");
        }

        String token = jwtService.generateToken(user.getEmail());
        return new AuthResponse(token, toResponse(user));
    }

    // GET /api/auth/me -> the logged-in user (needs a valid token)
    // JwtAuthFilter already checked the token and stored the email; getName() gives it back
    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in to continue."));
        return toResponse(user);
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getAgencyName());
    }
}