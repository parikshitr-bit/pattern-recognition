CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    pattern_data JSONB NOT NULL,
    options JSONB NOT NULL,
    correct_option_index INT NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE assessment_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id),
    attempt_number INT NOT NULL DEFAULT 1,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    total_time_seconds INT,
    final_score INT,
    accuracy_percentage DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'IN_PROGRESS'
);

CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES assessment_sessions(id),
    question_id UUID NOT NULL REFERENCES questions(id),
    selected_option_index INT,
    is_correct BOOLEAN,
    time_taken_seconds INT,
    attempt_count INT DEFAULT 0,
    answered_at TIMESTAMP DEFAULT NOW()
);