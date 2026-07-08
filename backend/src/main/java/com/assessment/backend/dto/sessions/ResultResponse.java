// ResultResponse.java
package com.assessment.backend.dto.sessions;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
public class ResultResponse {

    private UUID sessionId;
    private String candidateName;
    private Integer attemptNumber;
    private Integer totalQuestions;
    private Integer correct;
    private Integer incorrect;
    private Integer skipped;
    private Double accuracy;
    private Integer finalScore;
    private Integer maxScore;
    private Integer totalTimeSeconds;
    private List<QuestionResult> responses;

    @Data
    @AllArgsConstructor
    public static class QuestionResult {
        private UUID questionId;
        private String questionText;
        private Integer selectedOptionIndex;
        private Integer correctOptionIndex;
        private String selectedOption;
        private String correctOption;
        private Boolean isCorrect;
        private Boolean isSkipped;
        private Integer timeTakenSeconds;
        private Integer attemptCount;
        private String difficulty;
    }
}