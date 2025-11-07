-- Creating user courses table
CREATE TABLE IF NOT EXISTS user_courses (
  course_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  course_name VARCHAR(255) NOT NULL,
  course_category VARCHAR(100),
  enrolled_at TIMESTAMP DEFAULT NOW(),
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  last_accessed_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_user_courses_user ON user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_category ON user_courses(course_category);
