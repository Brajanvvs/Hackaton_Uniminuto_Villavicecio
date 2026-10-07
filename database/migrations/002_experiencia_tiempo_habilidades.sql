ALTER TABLE tutors
  ADD COLUMN experience_semesters TINYINT NOT NULL DEFAULT 0 AFTER experience_level,
  ADD COLUMN weekly_hours TINYINT NOT NULL DEFAULT 4 AFTER experience_semesters,
  ADD CONSTRAINT chk_tutor_semesters CHECK (experience_semesters BETWEEN 0 AND 20),
  ADD CONSTRAINT chk_tutor_weekly_hours CHECK (weekly_hours BETWEEN 1 AND 40);

CREATE TABLE IF NOT EXISTS skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tutor_skills (
  tutor_id INT NOT NULL,
  skill_id INT NOT NULL,
  PRIMARY KEY (tutor_id, skill_id),
  CONSTRAINT fk_tutor_skills_tutor FOREIGN KEY (tutor_id) REFERENCES tutors(id) ON DELETE CASCADE,
  CONSTRAINT fk_tutor_skills_skill FOREIGN KEY (skill_id) REFERENCES skills(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE requests ADD COLUMN skills JSON NULL AFTER end_time;

ALTER TABLE settings
  ADD COLUMN weight_time DECIMAL(6,2) NOT NULL DEFAULT 10 AFTER weight_experience,
  ADD CONSTRAINT chk_weight_time CHECK (weight_time >= 0);

UPDATE settings
SET weight_mastery = 35, weight_schedule = 30, weight_experience = 15, weight_time = 10, weight_preference = 10
WHERE id = 1
  AND weight_mastery = 40 AND weight_schedule = 35 AND weight_experience = 15 AND weight_preference = 10;

-- Datos de demostración: solo afecta a los seis tutores de seed.sql.
INSERT IGNORE INTO skills (name) VALUES
  ('Paciencia'),
  ('Ejemplos prácticos'),
  ('Preparación de parciales'),
  ('Resolución de ejercicios'),
  ('Ritmo ágil'),
  ('Temas avanzados'),
  ('Conversación'),
  ('Proyectos prácticos'),
  ('Problemas de aplicación');

UPDATE tutors SET experience_semesters = 6, weekly_hours = 8 WHERE email = 'laura.gomez@ejemplo.com';
UPDATE tutors SET experience_semesters = 2, weekly_hours = 6 WHERE email = 'andres.castillo@ejemplo.com';
UPDATE tutors SET experience_semesters = 4, weekly_hours = 10 WHERE email = 'valentina.rojas@ejemplo.com';
UPDATE tutors SET experience_semesters = 1, weekly_hours = 4 WHERE email = 'mariana.duarte@ejemplo.com';
UPDATE tutors SET experience_semesters = 7, weekly_hours = 12 WHERE email = 'camilo.herrera@ejemplo.com';
UPDATE tutors SET experience_semesters = 5, weekly_hours = 6 WHERE email = 'santiago.pena@ejemplo.com';

INSERT IGNORE INTO tutor_skills (tutor_id, skill_id)
SELECT t.id, s.id
FROM tutors t
JOIN skills s ON (
  (t.email = 'laura.gomez@ejemplo.com' AND s.name IN ('Paciencia', 'Ejemplos prácticos', 'Preparación de parciales'))
  OR (t.email = 'andres.castillo@ejemplo.com' AND s.name IN ('Resolución de ejercicios', 'Preparación de parciales'))
  OR (t.email = 'valentina.rojas@ejemplo.com' AND s.name IN ('Ritmo ágil', 'Temas avanzados'))
  OR (t.email = 'mariana.duarte@ejemplo.com' AND s.name IN ('Paciencia', 'Conversación'))
  OR (t.email = 'camilo.herrera@ejemplo.com' AND s.name IN ('Proyectos prácticos', 'Ejemplos prácticos'))
  OR (t.email = 'santiago.pena@ejemplo.com' AND s.name IN ('Problemas de aplicación', 'Resolución de ejercicios'))
);
