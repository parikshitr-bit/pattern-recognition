// AnalyticsResponse.java
package com.assessment.backend.dto.sessions;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
public class AnalyticsResponse {

    private UUID sessionId;
    private Integer totalTimeSeconds;
    private Integer correct;
    private Integer incorrect;
    private Integer skipped;
    private Double accuracy;
    private Integer avgTimePerQuestion;
    private Integer totalAttempts;
    private List<QuestionAnalytics> perQuestion;
    private List<DifficultyBreakdown> difficultyBreakdown;

    @Data
    @AllArgsConstructor
    public static class QuestionAnalytics {
        private String label;
        private String questionText;
        private String difficulty;
        private Integer timeTaken;
        private Integer attempts;
        private String status; // correct / incorrect / skipped
    }

    @Data
    @AllArgsConstructor
    public static class DifficultyBreakdown {
        private String difficulty;
        private Integer total;
        private Integer correct;
        private Integer accuracy;
    }
}