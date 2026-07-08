package com.assessment.backend.service;

import com.assessment.backend.dto.sessions.*;
import com.assessment.backend.model.*;
import com.assessment.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionRepository sessionRepository;
    private final ResponseRepository responseRepository;
    private final CandidateRepository candidateRepository;
    private final QuestionRepository questionRepository;
    private final ScoreService scoreService;

    private static final int MAX_ATTEMPTS = 3;

    // ── Start session ──────────────────────────────────────────────────────
    @Transactional
    public StartSessionResponse startSession(StartSessionRequest request) {

        // 1. Verify candidate exists
        Candidate candidate = candidateRepository.findById(request.getCandidateId())
                .orElseThrow(() -> new RuntimeException("Candidate not found"));

        // 2. Check attempt limit
        int completed = sessionRepository.countCompletedByCandidate(candidate.getId());
        if (completed >= MAX_ATTEMPTS) {
            throw new RuntimeException("You have used all " + MAX_ATTEMPTS + " attempts");
        }

        // 3. Create new session
        AssessmentSession session = new AssessmentSession();
        session.setCandidate(candidate);
        session.setAttemptNumber(sessionRepository.getNextAttemptNumber(candidate.getId()));
        session.setStatus("IN_PROGRESS");
        sessionRepository.save(session);

        return new StartSessionResponse(session.getId(), session.getAttemptNumber());
    }

    // ── Submit session ─────────────────────────────────────────────────────
    @Transactional
    public ResultResponse submitSession(UUID sessionId, SubmitRequest request) {

        // 1. Find session
        AssessmentSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        // 2. Save all responses
        List<Response> savedResponses = new ArrayList<>();

        for (ResponseDto dto : request.getResponses()) {
            Question question = questionRepository.findById(dto.getQuestionId())
                    .orElseThrow(() -> new RuntimeException("Question not found: " + dto.getQuestionId()));

            boolean isSkipped = dto.getSelectedOptionIndex() == null;
            boolean isCorrect = !isSkipped &&
                    dto.getSelectedOptionIndex().equals(question.getCorrectOptionIndex());

            Response response = new Response();
            response.setSession(session);
            response.setQuestion(question);
            response.setSelectedOptionIndex(dto.getSelectedOptionIndex());
            response.setIsCorrect(isCorrect);
            response.setTimeTakenSeconds(dto.getTimeTakenSeconds() != null ? dto.getTimeTakenSeconds() : 0);
            response.setAttemptCount(dto.getAttemptCount() != null ? dto.getAttemptCount() : 0);
            savedResponses.add(responseRepository.save(response));
        }

        // 3. Calculate score
        int total     = savedResponses.size();
        int correct   = (int) savedResponses.stream().filter(r -> Boolean.TRUE.equals(r.getIsCorrect())).count();
        int incorrect = (int) savedResponses.stream().filter(r -> !Boolean.TRUE.equals(r.getIsCorrect()) && r.getSelectedOptionIndex() != null).count();
        int skipped   = total - correct - incorrect;
        int score     = scoreService.calculateScore(correct);
        double accuracy = scoreService.calculateAccuracy(correct, total);

        // 4. Update session
        session.setStatus("COMPLETED");
        session.setCompletedAt(LocalDateTime.now());
        session.setTotalTimeSeconds(request.getTotalTimeSeconds());
        session.setFinalScore(score);
        session.setAccuracyPercentage(accuracy);
        sessionRepository.save(session);

        // 5. Build result response
        return buildResultResponse(session, savedResponses, correct, incorrect, skipped, score, accuracy);
    }

    // ── Get result ─────────────────────────────────────────────────────────
    public ResultResponse getResult(UUID sessionId) {
        AssessmentSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        List<Response> responses = responseRepository.findBySessionId(sessionId);

        int correct   = (int) responses.stream().filter(r -> Boolean.TRUE.equals(r.getIsCorrect())).count();
        int incorrect = (int) responses.stream().filter(r -> !Boolean.TRUE.equals(r.getIsCorrect()) && r.getSelectedOptionIndex() != null).count();
        int skipped   = responses.size() - correct - incorrect;

        return buildResultResponse(
                session, responses, correct, incorrect, skipped,
                session.getFinalScore(), session.getAccuracyPercentage()
        );
    }

    // ── Get analytics ──────────────────────────────────────────────────────
    public AnalyticsResponse getAnalytics(UUID sessionId) {
        AssessmentSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        List<Response> responses = responseRepository.findBySessionId(sessionId);

        int correct   = (int) responses.stream().filter(r -> Boolean.TRUE.equals(r.getIsCorrect())).count();
        int incorrect = (int) responses.stream().filter(r -> !Boolean.TRUE.equals(r.getIsCorrect()) && r.getSelectedOptionIndex() != null).count();
        int skipped   = responses.size() - correct - incorrect;
        int totalAttempts = responses.stream().mapToInt(r -> r.getAttemptCount() != null ? r.getAttemptCount() : 0).sum();
        int avgTime = responses.isEmpty() ? 0 :
                (int) responses.stream().mapToInt(r -> r.getTimeTakenSeconds() != null ? r.getTimeTakenSeconds() : 0).average().orElse(0);

        // Per question analytics
        List<AnalyticsResponse.QuestionAnalytics> perQuestion = new ArrayList<>();
        for (int i = 0; i < responses.size(); i++) {
            Response r = responses.get(i);
            boolean isSkipped = r.getSelectedOptionIndex() == null;
            String status = isSkipped ? "skipped" : Boolean.TRUE.equals(r.getIsCorrect()) ? "correct" : "incorrect";
            perQuestion.add(new AnalyticsResponse.QuestionAnalytics(
                    "Q" + (i + 1),
                    r.getQuestion().getQuestionText(),
                    r.getQuestion().getDifficulty(),
                    r.getTimeTakenSeconds() != null ? r.getTimeTakenSeconds() : 0,
                    r.getAttemptCount() != null ? r.getAttemptCount() : 0,
                    status
            ));
        }

        // Difficulty breakdown
        List<AnalyticsResponse.DifficultyBreakdown> diffBreakdown = new ArrayList<>();
        for (String diff : List.of("easy", "medium", "hard")) {
            List<Response> filtered = responses.stream()
                    .filter(r -> diff.equals(r.getQuestion().getDifficulty()))
                    .collect(Collectors.toList());
            if (!filtered.isEmpty()) {
                int c = (int) filtered.stream().filter(r -> Boolean.TRUE.equals(r.getIsCorrect())).count();
                int acc = (int) Math.round(c * 100.0 / filtered.size());
                diffBreakdown.add(new AnalyticsResponse.DifficultyBreakdown(diff, filtered.size(), c, acc));
            }
        }

        return new AnalyticsResponse(
                sessionId,
                session.getTotalTimeSeconds(),
                correct, incorrect, skipped,
                session.getAccuracyPercentage(),
                avgTime, totalAttempts,
                perQuestion, diffBreakdown
        );
    }

    // ── Get history (for dashboard) ────────────────────────────────────────
    public List<Map<String, Object>> getHistory(UUID candidateId) {
        List<AssessmentSession> sessions = sessionRepository
                .findCompletedByCandidate(candidateId);

        return sessions.stream().map(s -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("sessionId", s.getId());
            entry.put("attemptNumber", s.getAttemptNumber());
            entry.put("date", s.getCompletedAt());
            entry.put("score", s.getFinalScore());
            entry.put("maxScore", 100);
            entry.put("accuracy", s.getAccuracyPercentage());
            entry.put("totalTimeSeconds", s.getTotalTimeSeconds());
            entry.put("status", s.getStatus());
            return entry;
        }).collect(Collectors.toList());
    }

    // ── Helper ─────────────────────────────────────────────────────────────
    private ResultResponse buildResultResponse(
            AssessmentSession session,
            List<Response> responses,
            int correct, int incorrect, int skipped,
            int score, double accuracy) {

        List<ResultResponse.QuestionResult> questionResults = new ArrayList<>();
        for (int i = 0; i < responses.size(); i++) {
            Response r = responses.get(i);
            Question q = r.getQuestion();

            // options is stored as JSON array in DB
            List<?> opts = (List<?>) q.getOptions();
            String selectedOpt = r.getSelectedOptionIndex() != null
                    ? String.valueOf(opts.get(r.getSelectedOptionIndex())) : null;
            String correctOpt  = String.valueOf(opts.get(q.getCorrectOptionIndex()));

            questionResults.add(new ResultResponse.QuestionResult(
                    q.getId(),
                    q.getQuestionText(),
                    r.getSelectedOptionIndex(),
                    q.getCorrectOptionIndex(),
                    selectedOpt,
                    correctOpt,
                    r.getIsCorrect(),
                    r.getSelectedOptionIndex() == null,
                    r.getTimeTakenSeconds(),
                    r.getAttemptCount(),
                    q.getDifficulty()
            ));
        }

        return new ResultResponse(
                session.getId(),
                session.getCandidate().getName(),
                session.getAttemptNumber(),
                responses.size(),
                correct, incorrect, skipped,
                accuracy, score, 100,
                session.getTotalTimeSeconds(),
                questionResults
        );
    }
}