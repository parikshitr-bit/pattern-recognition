SET client_encoding = 'UTF8';

-- Insert a candidate. The password is seeded in plain text ('test123'); on first
-- backend startup PasswordHashMigration re-hashes any plaintext password to bcrypt.
INSERT INTO candidates (username, email, password_hash, name)
VALUES ('candidate1', 'candidate1@example.com', 'test123', 'John Doe');

-- Insert questions (20 questions so backend can pick 10 randomly)
INSERT INTO questions (question_text, question_type, pattern_data, options, correct_option_index, difficulty)
VALUES
-- Number sequences
('What comes next in the sequence?',
 'number_sequence',
 '{"sequence": [2, 4, 8, 16, "?"]}',
 '["24", "28", "32", "36"]',
 2, 'easy'),

('Identify the missing number.',
 'number_sequence',
 '{"sequence": [3, 6, 11, 18, "?"]}',
 '["25", "27", "29", "31"]',
 1, 'medium'),

('What is the next number?',
 'number_sequence',
 '{"sequence": [100, 50, 25, "?"]}',
 '["10", "12", "12.5", "15"]',
 2, 'medium'),

('Which number continues the pattern?',
 'number_sequence',
 '{"sequence": [5, 10, 20, 40, "?"]}',
 '["60", "70", "75", "80"]',
 3, 'easy'),

('Find the pattern and choose the missing value.',
 'number_sequence',
 '{"sequence": [1, 1, 2, 3, 5, 8, "?"]}',
 '["11", "12", "13", "14"]',
 2, 'medium'),

('Spot the rule and find the next term.',
 'number_sequence',
 '{"sequence": [144, 121, 100, 81, "?"]}',
 '["64", "72", "68", "60"]',
 0, 'hard'),

('What value replaces the question mark?',
 'number_sequence',
 '{"sequence": [7, 14, 28, 56, "?"]}',
 '["96", "108", "112", "120"]',
 2, 'hard'),

('Find the next number in the series.',
 'number_sequence',
 '{"sequence": [1, 4, 9, 16, 25, "?"]}',
 '["30", "36", "42", "49"]',
 1, 'medium'),

('What comes next?',
 'number_sequence',
 '{"sequence": [0, 1, 3, 6, 10, "?"]}',
 '["13", "14", "15", "16"]',
 2, 'hard'),

('Identify the next value.',
 'number_sequence',
 '{"sequence": [2, 6, 18, 54, "?"]}',
 '["108", "148", "162", "172"]',
 2, 'medium'),

-- Shape patterns
('How many shapes come next?',
 'shape_pattern',
 '{"sequence": [{"shape": "▲", "count": 1}, {"shape": "▲", "count": 2}, {"shape": "▲", "count": 4}, {"shape": "?", "count": 0}]}',
 '["6", "7", "8", "9"]',
 2, 'easy'),

('How many shapes come next in the sequence?',
 'shape_pattern',
 '{"sequence": [{"shape": "●", "count": 1}, {"shape": "●", "count": 3}, {"shape": "●", "count": 6}, {"shape": "?", "count": 0}]}',
 '["8", "9", "10", "12"]',
 2, 'medium'),

('What is the next count in this shape pattern?',
 'shape_pattern',
 '{"sequence": [{"shape": "■", "count": 2}, {"shape": "■", "count": 4}, {"shape": "■", "count": 6}, {"shape": "?", "count": 0}]}',
 '["7", "8", "9", "10"]',
 1, 'easy'),

('Complete the shape sequence.',
 'shape_pattern',
 '{"sequence": [{"shape": "★", "count": 1}, {"shape": "★", "count": 4}, {"shape": "★", "count": 9}, {"shape": "?", "count": 0}]}',
 '["12", "14", "16", "18"]',
 2, 'hard'),

-- Matrix patterns
('Complete the matrix pattern.',
 'matrix',
 '{"grid": [[1, 2, 3], [4, 5, 6], [7, 8, "?"]]}',
 '["7", "8", "9", "10"]',
 2, 'easy'),

('Find the missing value in the matrix.',
 'matrix',
 '{"grid": [[2, 4, 8], [3, 9, 27], [4, 16, "?"]]}',
 '["32", "48", "56", "64"]',
 3, 'hard'),

('What completes this matrix?',
 'matrix',
 '{"grid": [[1, 2, 3], [2, 4, 6], [3, 6, "?"]]}',
 '["7", "8", "9", "12"]',
 2, 'medium'),

-- More number sequences
('What number is missing?',
 'number_sequence',
 '{"sequence": [81, 27, 9, 3, "?"]}',
 '["0", "1", "2", "3"]',
 1, 'medium'),

('Find the next term.',
 'number_sequence',
 '{"sequence": [2, 3, 5, 7, 11, "?"]}',
 '["12", "13", "14", "15"]',
 1, 'hard'),

('What comes next in this pattern?',
 'number_sequence',
 '{"sequence": [1, 2, 4, 7, 11, "?"]}',
 '["14", "15", "16", "17"]',
 2, 'medium');

-- ── Additional questions with graded difficulty (easy → medium → hard) ──
INSERT INTO questions (question_text, question_type, pattern_data, options, correct_option_index, difficulty)
VALUES
-- Number sequences
('What comes next in the sequence?',
 'number_sequence', '{"sequence": [5, 10, 15, 20, "?"]}',
 '["24", "25", "30", "35"]', 1, 'easy'),

('Find the next odd number.',
 'number_sequence', '{"sequence": [1, 3, 5, 7, "?"]}',
 '["8", "9", "10", "11"]', 1, 'easy'),

('What comes next as the numbers decrease?',
 'number_sequence', '{"sequence": [90, 80, 70, 60, "?"]}',
 '["40", "45", "50", "55"]', 2, 'easy'),

('Spot the rule and find the missing value.',
 'number_sequence', '{"sequence": [2, 5, 10, 17, "?"]}',
 '["24", "26", "28", "30"]', 1, 'medium'),

('The gap grows each step — what comes next?',
 'number_sequence', '{"sequence": [3, 4, 6, 9, 13, "?"]}',
 '["16", "17", "18", "19"]', 2, 'medium'),

('Each gap increases by two — find the next term.',
 'number_sequence', '{"sequence": [3, 6, 11, 18, 27, "?"]}',
 '["36", "38", "40", "42"]', 1, 'medium'),

('Each term multiplies by a growing factor — what is next?',
 'number_sequence', '{"sequence": [1, 2, 6, 24, "?"]}',
 '["96", "100", "120", "144"]', 2, 'hard'),

('Continue the Fibonacci sequence.',
 'number_sequence', '{"sequence": [1, 1, 2, 3, 5, 8, 13, "?"]}',
 '["18", "19", "20", "21"]', 3, 'hard'),

('These are perfect cubes — what comes next?',
 'number_sequence', '{"sequence": [1, 8, 27, 64, "?"]}',
 '["100", "121", "125", "216"]', 2, 'hard'),

('Identify the rule behind this series and continue it.',
 'number_sequence', '{"sequence": [2, 3, 5, 7, 11, 13, "?"]}',
 '["14", "15", "16", "17"]', 3, 'hard'),

-- Shape patterns (answer = how many shapes come next)
('How many shapes come next?',
 'shape_pattern',
 '{"sequence": [{"shape": "▲", "count": 1}, {"shape": "▲", "count": 2}, {"shape": "▲", "count": 3}, {"shape": "?", "count": 0}]}',
 '["3", "4", "5", "6"]', 1, 'easy'),

('How many shapes come next in the sequence?',
 'shape_pattern',
 '{"sequence": [{"shape": "●", "count": 5}, {"shape": "●", "count": 10}, {"shape": "●", "count": 15}, {"shape": "?", "count": 0}]}',
 '["18", "20", "25", "30"]', 1, 'easy'),

('The count doubles each step — how many come next?',
 'shape_pattern',
 '{"sequence": [{"shape": "■", "count": 1}, {"shape": "■", "count": 2}, {"shape": "■", "count": 4}, {"shape": "■", "count": 8}, {"shape": "?", "count": 0}]}',
 '["12", "14", "16", "18"]', 2, 'medium'),

('The gap between counts grows by one — how many come next?',
 'shape_pattern',
 '{"sequence": [{"shape": "★", "count": 2}, {"shape": "★", "count": 3}, {"shape": "★", "count": 5}, {"shape": "★", "count": 8}, {"shape": "?", "count": 0}]}',
 '["11", "12", "13", "14"]', 1, 'medium'),

('These are triangular numbers — how many shapes come next?',
 'shape_pattern',
 '{"sequence": [{"shape": "▲", "count": 1}, {"shape": "▲", "count": 3}, {"shape": "▲", "count": 6}, {"shape": "▲", "count": 10}, {"shape": "?", "count": 0}]}',
 '["13", "14", "15", "16"]', 2, 'hard'),

-- Matrix patterns
('Complete the matrix pattern.',
 'matrix', '{"grid": [[2, 4, 6], [8, 10, 12], [14, 16, "?"]]}',
 '["17", "18", "19", "20"]', 1, 'easy'),

('What completes this matrix?',
 'matrix', '{"grid": [[3, 6, 9], [12, 15, 18], [21, 24, "?"]]}',
 '["25", "26", "27", "28"]', 2, 'easy'),

('Every cell is a perfect square — find the missing value.',
 'matrix', '{"grid": [[1, 4, 9], [16, 25, 36], [49, 64, "?"]]}',
 '["72", "78", "81", "100"]', 2, 'medium'),

('The third column follows from the first two — what is missing?',
 'matrix', '{"grid": [[2, 3, 5], [4, 6, 10], [6, 9, "?"]]}',
 '["12", "14", "15", "18"]', 2, 'medium'),

('Two rules combine in this matrix — find the missing value.',
 'matrix', '{"grid": [[2, 3, 4], [4, 9, 16], [6, 27, "?"]]}',
 '["32", "36", "48", "64"]', 1, 'hard');