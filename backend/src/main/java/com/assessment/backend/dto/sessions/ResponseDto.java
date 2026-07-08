// ResponseDto.java  (one question's response in submit payload)
package com.assessment.backend.dto.sessions;

import lombok.Data;
import java.util.UUID;

@Data
public class ResponseDto {
    private UUID questionId;
    private Integer selectedOptionIndex;  // null if skipped
    private Integer timeTakenSeconds;
    private Integer attemptCount;
}