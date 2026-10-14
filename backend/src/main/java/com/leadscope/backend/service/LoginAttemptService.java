package com.leadscope.backend.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Blocks an email for 15 minutes after 5 wrong passwords.
 * Stops "brute-force" attacks (guessing passwords again and again).
 */
@Service
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration LOCK_TIME = Duration.ofMinutes(15);

    private static class Attempt {
        int count = 0;
        Instant lockedUntil = null;
    }

    // email -> attempts (kept in memory; resets when the server restarts)
    private final Map<String, Attempt> attempts = new ConcurrentHashMap<>();

    private String key(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    /** Call BEFORE checking the password. Throws 429 if blocked. */
    public void checkBlocked(String email) {
        Attempt a = attempts.get(key(email));
        if (a != null && a.lockedUntil != null && Instant.now().isBefore(a.lockedUntil)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many failed attempts. Please try again in 15 minutes.");
        }
    }

    /** Call when the email or password is wrong. */
    public synchronized void recordFailure(String email) {
        Attempt a = attempts.computeIfAbsent(key(email), k -> new Attempt());
        if (a.lockedUntil != null && Instant.now().isAfter(a.lockedUntil)) {
            a.count = 0;            // old block expired -> start fresh
            a.lockedUntil = null;
        }
        a.count++;
        if (a.count >= MAX_ATTEMPTS) {
            a.lockedUntil = Instant.now().plus(LOCK_TIME);
        }
    }

    /** Call after a successful login. */
    public void reset(String email) {
        attempts.remove(key(email));
    }
}