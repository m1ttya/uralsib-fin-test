-- Creating test results table
CREATE TABLE IF NOT EXISTS test_results (
  result_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  test_id VARCHAR(255) NOT NULL,
  test_title VARCHAR(255),
  test_category VARCHAR(100),
  percentage DECIMAL(5,2) NOT NULL,
  total_questions INTEGER,
  correct_answers INTEGER,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  is_completed BOOLEAN DEFAULT FALSE,
  answers JSONB
);

CREATE INDEX IF NOT EXISTS idx_test_results_user ON test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_date ON test_results(completed_at);
CREATE INDEX IF NOT EXISTS idx_test_results_category ON test_results(test_category);
