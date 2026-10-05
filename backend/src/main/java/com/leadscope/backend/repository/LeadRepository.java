package com.leadscope.backend.repository;

import com.leadscope.backend.entity.Lead;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LeadRepository extends JpaRepository<Lead, Long> {

    List<Lead> findByCityIgnoreCase(String city);

    List<Lead> findByStatus(String status);

    List<Lead> findByCityIgnoreCaseAndStatus(String city, String status);

    List<Lead> findByBusinessNameContainingIgnoreCase(String keyword);
}