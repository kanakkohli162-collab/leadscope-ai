package com.leadscope.backend.controller;

import com.leadscope.backend.dto.SignupRequest;
import com.leadscope.backend.dto.UserResponse;
import com.leadscope.backend.entity.User;
import com.leadscope.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // POST /api/auth/signup  -> create a new account
    @PostMapping("/signup")
    public UserResponse signup(@RequestBody SignupRequest request) {

        // 1. Check the input
        if (request.getEmail() == null || request.getEmail().isBlank()
                || request.getPassword() == null || request.getPassword().length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Email and a password of at least 6 characters are required");
        }

        // 2. Stop duplicate accounts
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        // 3. Create the user with a scrambled password
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setAgencyName(request.getAgencyName());

        // 4. Save and reply WITHOUT the password
        User saved = userRepository.save(user);
        return new UserResponse(saved.getId(), saved.getName(), saved.getEmail(), saved.getAgencyName());
    }
}