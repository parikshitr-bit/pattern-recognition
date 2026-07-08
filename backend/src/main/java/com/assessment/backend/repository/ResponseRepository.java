package com.assessment.backend.repository;

import com.assessment.backend.model.Response;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ResponseRepository extends JpaRepository<Response, UUID> {

    // Get all responses for a session — used for result and analytics
    List<Response> findBySessionId(UUID sessionId);
}