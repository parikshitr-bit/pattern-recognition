package com.assessment.backend.service;

import com.assessment.backend.dto.questions.QuestionDto;
import com.assessment.backend.dto.sessions.*;
import com.assessment.backend.model.*;
import com.assessment.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
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
    private static final int QUESTIONS_PER_ATTEMPT = 10;
    // Total wall-clock time allowed per attempt. Server-authoritative: measured from
    // the session's started_at, so closing the window does not pause the clock.
    private static final int TIME_LIMIT_SECONDS = 20 * 60; // 20 minutes

    // ── Start or resume an attempt ───────────────────────────────────────────
    @Transactional
    public SessionStartResponse startOrResume(UUID candidateId) {

        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));

        // Resume an existing in-progress attempt if one exists.
        Optional<AssessmentSession> existing = sessionRepository
                .findFirstByCandidate_IdAndStatusOrderByStartedAtDesc(candidateId, "IN_PROGRESS");

        if (existing.isPresent()) {
            AssessmentSession session = existing.get();
            List<Response> rows = responseRepository.findBySessionIdOrderById(session.getId());
            if (rows.isEmpty()) {
                // No pinned questions → an abandoned/legacy session, not a real attempt.
                // Discard it and start fresh rather than counting it as a completed attempt.
                sessionRepository.delete(session);
            } else {
                long remaining = remainingSeconds(session);
                if (remaining <= 0) {
                    // Time ran out while the candidate was away → finalize with whatever was saved.
                    finalizeSession(session, rows);
                    return SessionStartResponse.expired(session.getId());
                }
                return buildStartResponse(session, true, remaining);
            }
        }

        // No in-progress attempt → start a new one (enforce the attempt limit).
        int completed = sessionRepository.countCompletedByCandidate(candidateId);
        if (completed >= MAX_ATTEMPTS) {
            throw new RuntimeException("You have used all " + MAX_ATTEMPTS + " attempts");
        }

        AssessmentSession session = new AssessmentSession();
        session.setCandidate(candidate);
        session.setAttemptNumber(sessionRepository.getNextAttemptNumber(candidateId));
        session.setStatus("IN_PROGRESS");
        session.setStartedAt(LocalDateTime.now());
        sessionRepository.save(session);

        // Pin this attempt's questions by pre-creating (blank) response rows.
        for (Question q : pickQuestions(candidateId)) {
            Response r = new Response();
            r.setSession(session);
            r.setQuestion(q);
            r.setSelectedOptionIndex(null);
            r.setIsCorrect(null);
            r.setTimeTakenSeconds(0);
            r.setAttemptCount(0);
            responseRepository.save(r);
        }

        return buildStartResponse(session, false, TIME_LIMIT_SECONDS);
    }

    // ── Autosave a single answer during the attempt ──────────────────────────
    @Transactional
    public void saveResponse(UUID sessionId, AutosaveRequest req) {
        AssessmentSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        if (!"IN_PROGRESS".equals(session.getStatus())) {
            return; // ignore autosaves once the attempt is finalized
        }
        Response r = responseRepository
                .findBySession_IdAndQuestion_Id(sessionId, req.getQuestionId())
                .orElseThrow(() -> new RuntimeException("Question is not part of this attempt"));
        r.setSelectedOptionIndex(req.getSelectedOptionIndex());
        if (req.getTimeTakenSeconds() != null) r.setTimeTakenSeconds(req.getTimeTakenSeconds());
        if (req.getAttemptCount() != null) r.setAttemptCount(req.getAttemptCount());
        responseRepository.save(r);
    }

    // ── Submit / finalize an attempt ─────────────────────────────────────────
    @Transactional
    public ResultResponse submitSession(UUID sessionId, SubmitRequest request) {

        AssessmentSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        // Already finalized (e.g. auto-submitted on expiry) → just return the result.
        if ("COMPLETED".equals(session.getStatus())) {
            return getResult(sessionId);
        }

        // Apply the submitted answers onto the pinned response rows.
        Map<UUID, Response> byQuestion = responseRepository.findBySessionIdOrderById(sessionId)
                .stream().collect(Collectors.toMap(
                        r -> r.getQuestion().getId(), r -> r, (a, b) -> a, LinkedHashMap::new));

        if (request != null && request.getResponses() != null) {
            for (ResponseDto dto : request.getResponses()) {
                Response r = byQuestion.get(dto.getQuestionId());
                if (r == null) continue; // not part of this attempt
                r.setSelectedOptionIndex(dto.getSelectedOptionIndex());
                if (dto.getTimeTakenSeconds() != null) r.setTimeTakenSeconds(dto.getTimeTakenSeconds());
                if (dto.getAttemptCount() != null) r.setAttemptCount(dto.getAttemptCount());
            }
        }

        return finalizeSession(session, new ArrayList<>(byQuestion.values()));
    }

    // ── Get result ─────────────────────────────────────────────────────────
    public ResultResponse getResult(UUID sessionId) {
        AssessmentSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        List<Response> responses = responseRepository.findBySessionIdOrderById(sessionId);

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

        List<Response> responses = responseRepository.findBySessionIdOrderById(sessionId);

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

    // ── Helpers ──────────────────────────────────────────────────────────────

    /** Seconds left before the attempt's time limit, based on the server start time. */
    private long remainingSeconds(AssessmentSession session) {
        long elapsed = ChronoUnit.SECONDS.between(session.getStartedAt(), LocalDateTime.now());
        return TIME_LIMIT_SECONDS - elapsed;
    }

    /** Pick this attempt's questions: prefer unseen, fall back to a random 10. */
    private List<Question> pickQuestions(UUID candidateId) {
        List<Question> unseen = questionRepository.findUnseenQuestions(candidateId);
        return unseen.size() < QUESTIONS_PER_ATTEMPT
                ? questionRepository.findTenRandom()
                : unseen;
    }

    private QuestionDto toQuestionDto(Question q) {
        return new QuestionDto(
                q.getId(), q.getQuestionText(), q.getQuestionType(),
                q.getPatternData(), q.getOptions(), q.getDifficulty());
    }

    private SessionStartResponse buildStartResponse(AssessmentSession session, boolean resumed, long remaining) {
        List<Response> rows = responseRepository.findBySessionIdOrderById(session.getId());
        List<QuestionDto> questions = rows.stream()
                .map(r -> toQuestionDto(r.getQuestion()))
                .collect(Collectors.toList());
        List<SavedResponseDto> saved = rows.stream()
                .map(r -> new SavedResponseDto(
                        r.getQuestion().getId(),
                        r.getSelectedOptionIndex(),
                        r.getTimeTakenSeconds(),
                        r.getAttemptCount()))
                .collect(Collectors.toList());
        return new SessionStartResponse(
                session.getId(), session.getAttemptNumber(),
                TIME_LIMIT_SECONDS, Math.max(0, remaining), resumed, false,
                questions, saved);
    }

    private ResultResponse finalizeSession(AssessmentSession session, List<Response> rows) {
        // Grade every pinned response against the correct answer.
        for (Response r : rows) {
            Integer sel = r.getSelectedOptionIndex();
            boolean correct = sel != null && sel.equals(r.getQuestion().getCorrectOptionIndex());
            r.setIsCorrect(correct);
            responseRepository.save(r);
        }

        int total     = rows.size();
        int correct   = (int) rows.stream().filter(r -> Boolean.TRUE.equals(r.getIsCorrect())).count();
        int incorrect = (int) rows.stream().filter(r -> !Boolean.TRUE.equals(r.getIsCorrect()) && r.getSelectedOptionIndex() != null).count();
        int skipped   = total - correct - incorrect;
        int score     = scoreService.calculateScore(correct);
        double accuracy = scoreService.calculateAccuracy(correct, total);

        // Server-authoritative elapsed time, capped at the limit.
        long elapsed = ChronoUnit.SECONDS.between(session.getStartedAt(), LocalDateTime.now());
        int totalTime = (int) Math.min(Math.max(elapsed, 0), TIME_LIMIT_SECONDS);

        session.setStatus("COMPLETED");
        session.setCompletedAt(LocalDateTime.now());
        session.setTotalTimeSeconds(totalTime);
        session.setFinalScore(score);
        session.setAccuracyPercentage(accuracy);
        sessionRepository.save(session);

        return buildResultResponse(session, rows, correct, incorrect, skipped, score, accuracy);
    }

    private ResultResponse buildResultResponse(
            AssessmentSession session,
            List<Response> responses,
            int correct, int incorrect, int skipped,
            int score, double accuracy) {

        List<ResultResponse.QuestionResult> questionResults = new ArrayList<>();
        for (int i = 0; i < responses.size(); i++) {
            Response r = responses.get(i);
            Question q = r.getQuestion();

            // options is stored as a JSON array in the DB
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
