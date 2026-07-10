package com.assessment.backend.dto.sessions;

import lombok.Data;
import java.util.UUID;

/** Autosave payload for a single question during an in-progress attempt. */
@Data
public class AutosaveRequest {
    private UUID questionId;
    private Integer selectedOptionIndex; // null clears the answer
    private Integer timeTakenSeconds;
    private Integer attemptCount;
}
