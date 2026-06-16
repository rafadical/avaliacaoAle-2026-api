# Dicionário de Dados

## Tabela `usuarios`

Cadastro de usuários da plataforma (alunos e administradores).

| Campo        | Tipo            | Nulo | Default            | Restrições                  | Descrição |
|--------------|-----------------|------|--------------------|-----------------------------|-----------|
| id           | INTEGER         | NÃO  | autoincrement      | PK                          | Identificador único. |
| nome         | VARCHAR(120)    | NÃO  | —                  | NOT NULL                    | Nome completo. |
| email        | VARCHAR(160)    | NÃO  | —                  | UNIQUE, NOT NULL, formato email | Login do usuário. |
| senha        | VARCHAR(255)    | NÃO  | —                  | NOT NULL, **bcrypt hash**   | Hash bcrypt (custo 10). Nunca em texto puro. |
| tipo         | ENUM            | NÃO  | `'aluno'`          | IN ('aluno', 'admin')       | Perfil de acesso. |
| created_at   | TIMESTAMPTZ     | NÃO  | CURRENT_TIMESTAMP  |                             | Data de criação. |
| updated_at   | TIMESTAMPTZ     | NÃO  | CURRENT_TIMESTAMP  |                             | Última atualização. |

**Índices:** `usuarios_email_uniq (UNIQUE)`, `usuarios_tipo_idx`.

---

## Tabela `categorias`

Categorização dos cursos.

| Campo      | Tipo            | Nulo | Default           | Restrições  | Descrição |
|------------|-----------------|------|-------------------|-------------|-----------|
| id         | INTEGER         | NÃO  | autoincrement     | PK          | Identificador único. |
| nome       | VARCHAR(80)     | NÃO  | —                 | UNIQUE      | Nome da categoria (ex: "Programação"). |
| descricao  | TEXT            | SIM  | NULL              |             | Texto livre opcional. |
| created_at | TIMESTAMPTZ     | NÃO  | CURRENT_TIMESTAMP |             | Criação. |
| updated_at | TIMESTAMPTZ     | NÃO  | CURRENT_TIMESTAMP |             | Atualização. |

**Índices:** `categorias_nome_uniq (UNIQUE)`.

---

## Tabela `cursos`

Catálogo de cursos oferecidos.

| Campo          | Tipo            | Nulo | Default           | Restrições                                          | Descrição |
|----------------|-----------------|------|-------------------|-----------------------------------------------------|-----------|
| id             | INTEGER         | NÃO  | autoincrement     | PK                                                  | Identificador único. |
| titulo         | VARCHAR(160)    | NÃO  | —                 | NOT NULL                                            | Nome do curso. |
| descricao      | TEXT            | SIM  | NULL              |                                                     | Descrição livre. |
| carga_horaria  | INTEGER         | NÃO  | —                 | NOT NULL, 1..1000                                   | Horas de conteúdo. |
| preco          | NUMERIC(10,2)   | NÃO  | 0                 | NOT NULL, >= 0                                      | Preço em BRL. |
| categoria_id   | INTEGER         | NÃO  | —                 | FK → categorias.id, ON DELETE RESTRICT              | Categoria do curso. |
| ativo          | BOOLEAN         | NÃO  | TRUE              |                                                     | Disponibilidade para matrícula. |
| created_at     | TIMESTAMPTZ     | NÃO  | CURRENT_TIMESTAMP |                                                     | Criação. |
| updated_at     | TIMESTAMPTZ     | NÃO  | CURRENT_TIMESTAMP |                                                     | Atualização. |

**Índices:** `cursos_categoria_idx`, `cursos_titulo_idx`, `cursos_ativo_idx`.

---

## Tabela `matriculas` (PIVÔ N:N)

Relacionamento N:N entre `usuarios` e `cursos` com atributos próprios.

| Campo          | Tipo            | Nulo | Default           | Restrições                                                              | Descrição |
|----------------|-----------------|------|-------------------|-------------------------------------------------------------------------|-----------|
| id             | INTEGER         | NÃO  | autoincrement     | PK                                                                      | Identificador único. |
| usuario_id     | INTEGER         | NÃO  | —                 | FK → usuarios.id, ON DELETE CASCADE                                     | Aluno matriculado. |
| curso_id       | INTEGER         | NÃO  | —                 | FK → cursos.id, ON DELETE CASCADE                                       | Curso alvo da matrícula. |
| data_matricula | TIMESTAMPTZ     | NÃO  | CURRENT_TIMESTAMP |                                                                         | Quando matriculou. |
| status         | ENUM            | NÃO  | `'ativa'`         | IN ('ativa', 'concluida', 'cancelada')                                  | Estado atual. |
| progresso      | INTEGER         | NÃO  | 0                 | CHECK 0..100                                                            | Percentual concluído. |
| created_at     | TIMESTAMPTZ     | NÃO  | CURRENT_TIMESTAMP |                                                                         | Criação. |
| updated_at     | TIMESTAMPTZ     | NÃO  | CURRENT_TIMESTAMP |                                                                         | Atualização. |

**Índices:** `matriculas_usuario_idx`, `matriculas_curso_idx`, `uniq_matricula_usuario_curso (UNIQUE)`, `matriculas_status_idx`, `matriculas_data_idx`.

---

## Tabela `avaliacoes`

Notas e comentários dos alunos sobre os cursos.

| Campo       | Tipo            | Nulo | Default           | Restrições                                                              | Descrição |
|-------------|-----------------|------|-------------------|-------------------------------------------------------------------------|-----------|
| id          | INTEGER         | NÃO  | autoincrement     | PK                                                                      | Identificador único. |
| usuario_id  | INTEGER         | NÃO  | —                 | FK → usuarios.id, ON DELETE CASCADE                                     | Aluno autor. |
| curso_id    | INTEGER         | NÃO  | —                 | FK → cursos.id, ON DELETE CASCADE                                       | Curso avaliado. |
| nota        | INTEGER         | NÃO  | —                 | CHECK 1..5                                                              | Nota de 1 a 5. |
| comentario  | TEXT            | SIM  | NULL              |                                                                         | Comentário opcional. |
| created_at  | TIMESTAMPTZ     | NÃO  | CURRENT_TIMESTAMP |                                                                         | Criação. |
| updated_at  | TIMESTAMPTZ     | NÃO  | CURRENT_TIMESTAMP |                                                                         | Atualização. |

**Índices:** `avaliacoes_usuario_idx`, `avaliacoes_curso_idx`, `uniq_avaliacao_usuario_curso (UNIQUE)`, `avaliacoes_nota_idx`.

---

## Resumo de Índices

| Tabela | Índice | Tipo | Motivo |
|--------|--------|------|--------|
| usuarios | `usuarios_email_uniq` | B-Tree UNIQUE | Login (busca por email é o caminho crítico). |
| usuarios | `usuarios_tipo_idx` | B-Tree | Filtro por tipo (ex: listar admins). |
| categorias | `categorias_nome_uniq` | B-Tree UNIQUE | Evita duplicatas + busca por nome. |
| cursos | `cursos_categoria_idx` | B-Tree | JOIN com categorias é frequente. |
| cursos | `cursos_titulo_idx` | B-Tree | Buscas por título (autocomplete, filtros). |
| cursos | `cursos_ativo_idx` | B-Tree | Listar apenas cursos ativos. |
| matriculas | `matriculas_usuario_idx` | B-Tree | "Meus cursos" do aluno. |
| matriculas | `matriculas_curso_idx` | B-Tree | "Alunos deste curso". |
| matriculas | `uniq_matricula_usuario_curso` | B-Tree UNIQUE | Garante 1 matrícula por par. |
| matriculas | `matriculas_status_idx` | B-Tree | Relatórios por status (ativas, concluídas). |
| matriculas | `matriculas_data_idx` | B-Tree | Filtros por período (consultas de relatório). |
| avaliacoes | `avaliacoes_usuario_idx` | B-Tree | "Minhas avaliações". |
| avaliacoes | `avaliacoes_curso_idx` | B-Tree | "Avaliações deste curso". |
| avaliacoes | `uniq_avaliacao_usuario_curso` | B-Tree UNIQUE | 1 avaliação por par. |
| avaliacoes | `avaliacoes_nota_idx` | B-Tree | Filtro por nota mínima/máxima. |
