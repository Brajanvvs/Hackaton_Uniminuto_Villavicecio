CREATE TABLE IF NOT EXISTS cancellations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recommendation_id INT NOT NULL,
  tutor_id INT NULL,
  tutor_name VARCHAR(120) NOT NULL,
  reason ENUM('tutor', 'estudiante', 'no_necesita') NOT NULL,
  note VARCHAR(300) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cancellations_recommendation FOREIGN KEY (recommendation_id) REFERENCES recommendations(id),
  CONSTRAINT fk_cancellations_tutor FOREIGN KEY (tutor_id) REFERENCES tutors(id) ON DELETE SET NULL,
  INDEX idx_cancellations_recommendation (recommendation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE recommendations
  ADD COLUMN closed_at TIMESTAMP NULL AFTER chosen_at;
