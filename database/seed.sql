INSERT IGNORE INTO subjects (id, name) VALUES
  (1, 'Cálculo'),
  (2, 'Programación'),
  (3, 'Física'),
  (4, 'Estadística'),
  (5, 'Inglés'),
  (6, 'Álgebra lineal');

INSERT IGNORE INTO tutors (id, name, email, experience_level, bio) VALUES
  (1, 'Laura Gómez', 'laura.gomez@ejemplo.com', 5, 'Es paciente y explica con muchos ejemplos. Acompaña cálculo desde lo básico hasta parciales.'),
  (2, 'Andrés Castillo', 'andres.castillo@ejemplo.com', 3, 'Resuelve ejercicios de cálculo y estadística con foco en resultados.'),
  (3, 'Valentina Rojas', 'valentina.rojas@ejemplo.com', 4, 'Prefiere estudiantes avanzados y un ritmo ágil.'),
  (4, 'Mariana Duarte', 'mariana.duarte@ejemplo.com', 2, 'Empieza como tutora y se le facilita el inglés conversacional.'),
  (5, 'Camilo Herrera', 'camilo.herrera@ejemplo.com', 5, 'Domina programación y explica con proyectos cortos.'),
  (6, 'Santiago Peña', 'santiago.pena@ejemplo.com', 4, 'Trabaja física y estadística con énfasis en problemas de aplicación.');

INSERT IGNORE INTO tutor_subjects (tutor_id, subject_id, mastery) VALUES
  (1, 1, 5),
  (1, 6, 4),
  (2, 1, 4),
  (2, 4, 3),
  (3, 1, 5),
  (3, 3, 4),
  (4, 1, 2),
  (4, 5, 4),
  (5, 2, 5),
  (6, 3, 5),
  (6, 4, 4);

INSERT IGNORE INTO tutor_schedules (id, tutor_id, day_of_week, start_time, end_time) VALUES
  (1, 1, 2, '14:00:00', '17:00:00'),
  (2, 1, 4, '10:00:00', '12:00:00'),
  (3, 2, 2, '08:00:00', '10:00:00'),
  (4, 2, 1, '14:00:00', '16:00:00'),
  (5, 3, 2, '15:00:00', '18:00:00'),
  (6, 4, 2, '14:00:00', '16:00:00'),
  (7, 5, 1, '16:00:00', '18:00:00'),
  (8, 5, 3, '16:00:00', '18:00:00'),
  (9, 6, 5, '09:00:00', '12:00:00');
