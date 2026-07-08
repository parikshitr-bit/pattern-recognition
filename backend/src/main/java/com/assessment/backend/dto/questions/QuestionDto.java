package com.assessment.backend.dto.questions;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.UUID;

@Data
@AllArgsConstructor
public class QuestionDto {
    private UUID id;
    private String questionText;
    private String questionType;
    private Object patternData;
    private Object options;
    private String difficulty;
}