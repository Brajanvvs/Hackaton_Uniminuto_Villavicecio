ALTER TABLE recommendations
  ADD COLUMN chosen_tutor_id INT NULL AFTER ranking,
  ADD COLUMN chosen_tutor_name VARCHAR(120) NULL AFTER chosen_tutor_id,
  ADD COLUMN chosen_score DECIMAL(5,2) NULL AFTER chosen_tutor_name,
  ADD COLUMN chosen_rank TINYINT NULL AFTER chosen_score,
  ADD COLUMN chosen_at TIMESTAMP NULL AFTER chosen_rank,
  ADD CONSTRAINT fk_recommendations_chosen_tutor FOREIGN KEY (chosen_tutor_id) REFERENCES tutors(id);
