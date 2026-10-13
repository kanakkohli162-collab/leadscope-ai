package com.leadscope.backend.security;

import com.leadscope.backend.repository.UserRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

// Runs once before every request and checks the "Authorization: Bearer <token>" header.
// If the token is valid, it tells Spring Security who the user is.
// If not, it does nothing, and SecurityConfig rejects the request with 401.
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith(BEARER_PREFIX)) {
            String token = header.substring(BEARER_PREFIX.length());
            try {
                // Throws if the token is expired, changed, or not signed with our secret
                String email = jwtService.extractEmail(token);

                // The account must still exist (a deleted user's old token stops working)
                if (email != null && userRepository.existsByEmail(email)) {
                    // "This request belongs to <email>" - no password, no roles yet
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(email, null, List.of());
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (JwtException | IllegalArgumentException e) {
                // Bad or expired token: stay "not logged in"
                SecurityContextHolder.clearContext();
            }
        }

        // Always pass the request on to the next filter / the controller
        filterChain.doFilter(request, response);
    }
}
