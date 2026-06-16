-- ============================================================================
-- CONSULTAS CRÍTICAS — 5+ queries relevantes do sistema
-- ============================================================================
-- Cada query traz: contexto de negócio, query, EXPLAIN sugerido e justificativa
-- da otimização (índice usado).
-- ============================================================================


-- ============================================================================
-- QUERY 1 — Top 10 cursos mais matriculados (com nome da categoria)
-- ----------------------------------------------------------------------------
-- POR QUE É CRÍTICA: home page exibe ranking; é a consulta de maior visibilidade
-- e a mais cacheada no Redis. JOIN entre 3 tabelas + agregação + ordenação.
-- ÍNDICES USADOS: matriculas_curso_idx, cursos_categoria_idx
-- ============================================================================
SELECT
    c.id,
    c.titulo,
    cat.nome           AS categoria,
    COUNT(m.id)        AS total_matriculas
FROM cursos c
JOIN categorias cat ON cat.id = c.categoria_id
LEFT JOIN matriculas m ON m.curso_id = c.id
WHERE c.ativo = TRUE
GROUP BY c.id, c.titulo, cat.nome
ORDER BY total_matriculas DESC
LIMIT 10;

-- EXPLAIN ANALYZE da query acima (rodar pra anexar evidência):
-- EXPLAIN (ANALYZE, BUFFERS) <query>;


-- ============================================================================
-- QUERY 2 — Média de notas por categoria (relatório executivo)
-- ----------------------------------------------------------------------------
-- POR QUE É CRÍTICA: dashboard administrativo de qualidade. Agregação dupla
-- (média + count) com 3 JOINs. Identifica categorias com queda de satisfação.
-- ÍNDICES USADOS: avaliacoes_curso_idx, cursos_categoria_idx
-- ============================================================================
SELECT
    cat.nome                       AS categoria,
    COUNT(a.id)                    AS total_avaliacoes,
    ROUND(AVG(a.nota)::numeric, 2) AS media_nota,
    MIN(a.nota)                    AS pior_nota,
    MAX(a.nota)                    AS melhor_nota
FROM categorias cat
JOIN cursos c    ON c.categoria_id = cat.id
JOIN avaliacoes a ON a.curso_id = c.id
GROUP BY cat.id, cat.nome
HAVING COUNT(a.id) >= 3
ORDER BY media_nota DESC;


-- ============================================================================
-- QUERY 3 — Alunos com matrículas no último mês (filtro por data)
-- ----------------------------------------------------------------------------
-- POR QUE É CRÍTICA: retenção. Time de marketing puxa essa lista pra disparar
-- campanhas. Filtro temporal exige índice em coluna de data.
-- ÍNDICES USADOS: matriculas_data_idx, matriculas_usuario_idx
-- ============================================================================
SELECT DISTINCT
    u.id,
    u.nome,
    u.email,
    COUNT(m.id)         OVER (PARTITION BY u.id) AS cursos_matriculados_mes
FROM usuarios u
JOIN matriculas m ON m.usuario_id = u.id
WHERE m.data_matricula >= CURRENT_DATE - INTERVAL '30 days'
  AND u.tipo = 'aluno'
ORDER BY cursos_matriculados_mes DESC, u.nome;


-- ============================================================================
-- QUERY 4 — Alunos que se matricularam mas nunca avaliaram (LEFT JOIN crítico)
-- ----------------------------------------------------------------------------
-- POR QUE É CRÍTICA: identifica alunos "silenciosos" que devem ser convidados
-- a avaliar. JOIN ANTI-pattern (LEFT JOIN + WHERE IS NULL) é típico em
-- entrevistas técnicas de BD e exige índices nas duas FKs envolvidas.
-- ÍNDICES USADOS: matriculas_usuario_idx, avaliacoes (uniq composto)
-- ============================================================================
SELECT
    u.id,
    u.nome,
    u.email,
    c.titulo            AS curso_sem_avaliacao,
    m.progresso,
    m.status
FROM matriculas m
JOIN usuarios u ON u.id = m.usuario_id
JOIN cursos c   ON c.id = m.curso_id
LEFT JOIN avaliacoes a
       ON a.usuario_id = m.usuario_id
      AND a.curso_id = m.curso_id
WHERE a.id IS NULL
  AND m.status IN ('ativa', 'concluida')
  AND m.progresso >= 50
ORDER BY m.progresso DESC, u.nome
LIMIT 50;


-- ============================================================================
-- QUERY 5 — Receita estimada por categoria (agregação financeira)
-- ----------------------------------------------------------------------------
-- POR QUE É CRÍTICA: relatório executivo de faturamento. Soma o preço dos
-- cursos vezes a contagem de matrículas ativas/concluídas. Usado pelo time
-- comercial pra priorizar produção de conteúdo.
-- ÍNDICES USADOS: cursos_categoria_idx, matriculas_status_idx
-- ============================================================================
SELECT
    cat.nome                                AS categoria,
    COUNT(DISTINCT c.id)                    AS qtd_cursos,
    COUNT(m.id)                             AS matriculas_pagas,
    SUM(c.preco)                            AS receita_bruta,
    ROUND(SUM(c.preco) / NULLIF(COUNT(m.id), 0), 2) AS ticket_medio
FROM categorias cat
JOIN cursos c     ON c.categoria_id = cat.id
JOIN matriculas m ON m.curso_id = c.id
WHERE m.status IN ('ativa', 'concluida')
GROUP BY cat.id, cat.nome
ORDER BY receita_bruta DESC;


-- ============================================================================
-- QUERY 6 (BÔNUS) — Cursos com avaliação média alta mas poucas matrículas
-- ----------------------------------------------------------------------------
-- POR QUE É CRÍTICA: "joias escondidas" — cursos bem avaliados mas com pouca
-- visibilidade. Útil pra time de marketing impulsionar.
-- USA: subquery + JOIN + HAVING + ORDER BY composto
-- ============================================================================
SELECT
    c.id,
    c.titulo,
    cat.nome                       AS categoria,
    COUNT(DISTINCT m.id)           AS total_matriculas,
    COUNT(DISTINCT a.id)           AS total_avaliacoes,
    ROUND(AVG(a.nota)::numeric, 2) AS media_nota
FROM cursos c
JOIN categorias cat ON cat.id = c.categoria_id
LEFT JOIN matriculas m ON m.curso_id = c.id
LEFT JOIN avaliacoes a ON a.curso_id = c.id
WHERE c.ativo = TRUE
GROUP BY c.id, c.titulo, cat.nome
HAVING AVG(a.nota) >= 4.5
   AND COUNT(DISTINCT m.id) < 5
ORDER BY media_nota DESC, total_matriculas ASC;
