-- ============================================================================
-- CRUD — Exemplos de operações básicas em SQL puro
-- ============================================================================
-- A aplicação Node faz tudo via Sequelize, mas estes SQLs equivalentes ajudam
-- na avaliação e no estudo pra apresentação.
-- ============================================================================

-- ====================================
-- USUARIOS
-- ====================================
-- CREATE
INSERT INTO usuarios (nome, email, senha, tipo)
VALUES ('Maria Silva', 'maria@cursos.com', '$2b$10$hashbcrypt_aqui', 'aluno')
RETURNING id, nome, email, tipo;

-- READ (lista paginada)
SELECT id, nome, email, tipo, created_at
FROM usuarios
ORDER BY id
LIMIT 20 OFFSET 0;

-- READ (por id)
SELECT * FROM usuarios WHERE id = 1;

-- UPDATE
UPDATE usuarios
SET nome = 'Maria Silva Santos', updated_at = CURRENT_TIMESTAMP
WHERE id = 1
RETURNING *;

-- DELETE
DELETE FROM usuarios WHERE id = 1;


-- ====================================
-- CATEGORIAS
-- ====================================
INSERT INTO categorias (nome, descricao) VALUES ('Programação', 'Cursos de dev.');
SELECT * FROM categorias ORDER BY nome;
UPDATE categorias SET descricao = 'Atualizado' WHERE id = 1;
DELETE FROM categorias WHERE id = 1;


-- ====================================
-- CURSOS
-- ====================================
INSERT INTO cursos (titulo, descricao, carga_horaria, preco, categoria_id, ativo)
VALUES ('Node.js Avançado', 'Curso completo.', 60, 199.90, 1, TRUE);

SELECT c.*, cat.nome AS categoria
FROM cursos c
JOIN categorias cat ON cat.id = c.categoria_id
ORDER BY c.id
LIMIT 20;

UPDATE cursos SET preco = 179.90 WHERE id = 1;
DELETE FROM cursos WHERE id = 1;


-- ====================================
-- MATRICULAS (PIVÔ)
-- ====================================
INSERT INTO matriculas (usuario_id, curso_id, status, progresso)
VALUES (1, 1, 'ativa', 0);

SELECT m.*, u.nome AS aluno, c.titulo AS curso
FROM matriculas m
JOIN usuarios u ON u.id = m.usuario_id
JOIN cursos c   ON c.id = m.curso_id
ORDER BY m.id
LIMIT 20;

UPDATE matriculas SET progresso = 50 WHERE id = 1;
DELETE FROM matriculas WHERE id = 1;


-- ====================================
-- AVALIACOES
-- ====================================
INSERT INTO avaliacoes (usuario_id, curso_id, nota, comentario)
VALUES (1, 1, 5, 'Excelente curso!');

SELECT a.*, u.nome AS aluno, c.titulo AS curso
FROM avaliacoes a
JOIN usuarios u ON u.id = a.usuario_id
JOIN cursos c   ON c.id = a.curso_id
ORDER BY a.created_at DESC
LIMIT 20;

UPDATE avaliacoes SET nota = 4, comentario = 'Atualizado' WHERE id = 1;
DELETE FROM avaliacoes WHERE id = 1;
