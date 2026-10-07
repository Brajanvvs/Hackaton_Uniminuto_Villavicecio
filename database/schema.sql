-- Días: 1 lunes, 2 martes, 3 miércoles, 4 jueves, 5 viernes, 6 sábado.

CREATE TABLE IF NOT EXISTS subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tutors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NULL,
  experience_level TINYINT NOT NULL,
  bio VARCHAR(500) NULL,
  CONSTRAINT chk_tutor_experience CHECK (experience_level BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tutor_subjects (
  tutor_id INT NOT NULL,
  subject_id INT NOT NULL,
  mastery TINYINT NOT NULL,
  PRIMARY KEY (tutor_id, subject_id),
  CONSTRAINT fk_tutor_subjects_tutor FOREIGN KEY (tutor_id) REFERENCES tutors(id) ON DELETE CASCADE,
  CONSTRAINT fk_tutor_subjects_subject FOREIGN KEY (subject_id) REFERENCES subjects(id),
  CONSTRAINT chk_subject_mastery CHECK (mastery BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tutor_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tutor_id INT NOT NULL,
  day_of_week TINYINT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  CONSTRAINT fk_schedules_tutor FOREIGN KEY (tutor_id) REFERENCES tutors(id) ON DELETE CASCADE,
  CONSTRAINT chk_schedule_day CHECK (day_of_week BETWEEN 1 AND 6),
  CONSTRAINT chk_schedule_time CHECK (end_time > start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_name VARCHAR(120) NOT NULL,
  subject_id INT NOT NULL,
  day_of_week TINYINT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  preference VARCHAR(300) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_requests_subject FOREIGN KEY (subject_id) REFERENCES subjects(id),
  CONSTRAINT chk_request_day CHECK (day_of_week BETWEEN 1 AND 6),
  CONSTRAINT chk_request_time CHECK (end_time > start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY,
  weight_mastery DECIMAL(6,2) NOT NULL,
  weight_schedule DECIMAL(6,2) NOT NULL,
  weight_experience DECIMAL(6,2) NOT NULL,
  weight_preference DECIMAL(6,2) NOT NULL,
  CONSTRAINT chk_weights_non_negative CHECK (
    weight_mastery >= 0
    AND weight_schedule >= 0
    AND weight_experience >= 0
    AND weight_preference >= 0
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO settings (id, weight_mastery, weight_schedule, weight_experience, weight_preference)
VALUES (1, 40, 35, 15, 10)
ON DUPLICATE KEY UPDATE id = id;

CREATE TABLE IF NOT EXISTS recommendations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL UNIQUE,
  tutor_id INT NULL,
  tutor_name VARCHAR(120) NULL,
  score DECIMAL(5,2) NOT NULL,
  justification TEXT NOT NULL,
  breakdown JSON NOT NULL,
  ranking JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_recommendations_request FOREIGN KEY (request_id) REFERENCES requests(id),
  CONSTRAINT fk_recommendations_tutor FOREIGN KEY (tutor_id) REFERENCES tutors(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
