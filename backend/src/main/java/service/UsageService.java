package com.leadscope.backend.service;

import com.leadscope.backend.entity.User;
import com.leadscope.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * "Usage this month" counters on the user: searches, AI messages, website checks.
 * The counters start at 0 when a new month begins. Counting never blocks the real action.
 */
@Service
public class UsageService {

    public enum Kind { SEARCH, AI_MESSAGE, WEBSITE_CHECK }

    private final UserRepository userRepository;

    public UsageService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public void record(String email, Kind kind) {
        if (email == null) return;
        try {
            userRepository.findByEmail(email).ifPresent(user -> {
                resetIfNewMonth(user);
                switch (kind) {
                    case SEARCH -> user.setSearchesThisMonth(n(user.getSearchesThisMonth()) + 1);
                    case AI_MESSAGE -> user.setAiMessagesThisMonth(n(user.getAiMessagesThisMonth()) + 1);
                    case WEBSITE_CHECK -> user.setWebsiteChecksThisMonth(n(user.getWebsiteChecksThisMonth()) + 1);
                }
                userRepository.save(user);
            });
        } catch (RuntimeException ignored) {
            // a missed count must never break a search / message / check
        }
    }

    /** { month, searches, aiMessages, websiteChecks } for this month (0 if nothing yet). */
    public Map<String, Object> thisMonth(User user) {
        boolean current = YearMonth.now().toString().equals(user.getUsageMonth());
        Map<String, Object> u = new LinkedHashMap<>();
        u.put("month", YearMonth.now().toString());
        u.put("searches", current ? n(user.getSearchesThisMonth()) : 0);
        u.put("aiMessages", current ? n(user.getAiMessagesThisMonth()) : 0);
        u.put("websiteChecks", current ? n(user.getWebsiteChecksThisMonth()) : 0);
        return u;
    }

    private void resetIfNewMonth(User user) {
        String month = YearMonth.now().toString();
        if (!month.equals(user.getUsageMonth())) {
            user.setUsageMonth(month);
            user.setSearchesThisMonth(0);
            user.setAiMessagesThisMonth(0);
            user.setWebsiteChecksThisMonth(0);
        }
    }

    private static int n(Integer v) {
        return v == null ? 0 : v;
    }
}
