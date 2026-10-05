package com.leadscope.backend.repository;

import com.leadscope.backend.entity.Lead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface LeadRepository extends JpaRepository<Lead, Long> {

    // Search and filter
    List<Lead> findByCityIgnoreCase(String city);
    List<Lead> findByStatus(String status);
    List<Lead> findByCityIgnoreCaseAndStatus(String city, String status);
    List<Lead> findByBusinessNameContainingIgnoreCase(String keyword);

    // Dashboard counts
    long countByPriority(String priority);
    long countByStatus(String status);
    long countByWebsiteIsNull();
    long countByRatingLessThan(Double rating);

    @Query("SELECT l.city, COUNT(l) FROM Lead l GROUP BY l.city")
    List<Object[]> countLeadsByCity();
}