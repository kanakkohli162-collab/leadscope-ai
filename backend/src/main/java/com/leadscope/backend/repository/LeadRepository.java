package com.leadscope.backend.repository;

import com.leadscope.backend.entity.Lead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LeadRepository extends JpaRepository<Lead, Long> {

    List<Lead> findByOwnerEmail(String ownerEmail);
    List<Lead> findByOwnerEmailAndCityIgnoreCase(String ownerEmail, String city);
    List<Lead> findByOwnerEmailAndStatus(String ownerEmail, String status);
    List<Lead> findByOwnerEmailAndCityIgnoreCaseAndStatus(String ownerEmail, String city, String status);
    List<Lead> findByOwnerEmailAndBusinessNameContainingIgnoreCase(String ownerEmail, String keyword);

    List<Lead> findByOwnerEmailAndBusinessNameIgnoreCase(String ownerEmail, String businessName);

    @org.springframework.transaction.annotation.Transactional
    long deleteByOwnerEmail(String ownerEmail);

    long countByOwnerEmailAndCreatedAtAfter(String ownerEmail, java.time.LocalDateTime after);

    Optional<Lead> findByIdAndOwnerEmail(Long id, String ownerEmail);

    long countByOwnerEmail(String ownerEmail);
    long countByOwnerEmailAndPriority(String ownerEmail, String priority);
    long countByOwnerEmailAndStatus(String ownerEmail, String status);
    long countByOwnerEmailAndWebsiteIsNull(String ownerEmail);
    long countByOwnerEmailAndRatingLessThan(String ownerEmail, Double rating);

    @Query("SELECT l.city, COUNT(l) FROM Lead l WHERE l.ownerEmail = :owner GROUP BY l.city")
    List<Object[]> countLeadsByCity(@Param("owner") String ownerEmail);
}