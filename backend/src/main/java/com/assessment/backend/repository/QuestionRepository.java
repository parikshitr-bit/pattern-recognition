package com.assessment.backend.repository;

import com.assessment.backend.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface QuestionRepository extends JpaRepository<Question, UUID> {

    // Fetch 10 random from unseen questions (only excludes COMPLETED sessions)
    @Query(value = """
        SELECT * FROM questions
        WHERE id NOT IN (
            SELECT DISTINCT r.question_id
            FROM responses r
            JOIN assessment_sessions s ON r.session_id = s.id
            WHERE s.candidate_id = :candidateId
            AND s.status = 'COMPLETED'
        )
        ORDER BY RANDOM()
        LIMIT 10
        """, nativeQuery = true)
    List<Question> findUnseenQuestions(@Param("candidateId") UUID candidateId);

    @Query(value = "SELECT * FROM questions ORDER BY RANDOM() LIMIT 10",
           nativeQuery = true)
    List<Question> findTenRandom();

    // Count how many unseen questions remain for a candidate
    @Query(value = """
        SELECT COUNT(*) FROM questions
        WHERE id NOT IN (
            SELECT DISTINCT r.question_id
            FROM responses r
            JOIN assessment_sessions s ON r.session_id = s.id
            WHERE s.candidate_id = :candidateId
            AND s.status = 'COMPLETED'
        )
        """, nativeQuery = true)
    int countUnseenQuestions(@Param("candidateId") UUID candidateId);
}