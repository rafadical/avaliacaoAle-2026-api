# Justificativa Técnica da Arquitetura de Banco de Dados

## 1. Escolha Tecnológica

### Tipo: **SQL (Relacional)**
### Provedor: **PostgreSQL 17**

### Justificativa técnica

| Critério | Decisão | Por quê |
|----------|---------|---------|
| **Modelo de dados** | Relacional | O domínio tem relacionamentos explícitos (1:N e N:N) e exige integridade referencial forte. Modelar isso em NoSQL exigiria denormalização agressiva ou referenciamento manual, perdendo as garantias do RDBMS. |
| **Transações** | ACID | Operações como "matricular aluno + criar avaliação" precisam de atomicidade. PostgreSQL oferece transações ACID nativas. |
| **Consultas analíticas** | SQL declarativo | As 5 consultas críticas (top cursos, média por categoria, receita por categoria, etc) são naturalmente expressas em SQL com JOINs e agregações — em NoSQL exigiriam pipelines complexos. |
| **Maturidade** | Postgres 17 | Tipos ENUM nativos, CHECK constraints, índices parciais, EXPLAIN robusto, ecossistema estabelecido. |
| **Custo** | Zero | Open-source, sem licença. |
| **Integração** | Driver `pg` + Sequelize | Stack canônica do Node.js. |

### Por que NÃO MongoDB / NoSQL?

- O sistema é **fortemente relacional** (5 entidades, 6 chaves estrangeiras).
- Não há requisito de **escalabilidade horizontal extrema** (estamos pensando em ~10k usuários, não 10 milhões).
- Os dados são **estruturados e estáveis** (não há atributos dinâmicos).
- **Consultas críticas usam JOIN** — algo que NoSQL faz mal por design.

---

## 2. Requisitos do Sistema

| Item | Valor |
|------|-------|
| **Objetivo** | API REST de uma plataforma de cursos online com cadastro de usuários, catálogo de cursos por categoria, matrículas com controle de progresso, e avaliações com nota 1–5. |
| **Entidades principais** | Usuários, Categorias, Cursos, Matrículas (pivô N:N), Avaliações |
| **Volume estimado em produção** | 10k usuários, 500 cursos, 20 categorias, 100k matrículas/ano, 50k avaliações/ano |
| **Volume nos testes (seed)** | 30 usuários, 8 categorias, 25 cursos, 80 matrículas, 60 avaliações (**total 203 registros**) |
| **Usuários simultâneos esperados** | 100–500 simultâneos no pico (não é Netflix nem AWS) |
| **Principais consultas** | Top cursos, ranking, média de notas, alunos ativos do mês, relatórios financeiros (ver `queries/consultas_criticas.sql`) |

---

## 3. Normalização

### 1FN — Forma Normal Atômica
Atendida. Todos os atributos das 5 tabelas são atômicos. Não há listas, arrays ou JSONs aninhados como valor de coluna. Por exemplo, `usuarios.email` é uma única string, não uma lista de emails.

### 2FN — Sem dependências parciais
Atendida. Todas as tabelas têm chave primária simples (`id SERIAL`), então não há possibilidade de dependência parcial (que só ocorre com PK composta). As tabelas pivô (`matriculas`, `avaliacoes`) têm PK simples + UNIQUE composto, evitando o problema.

### 3FN — Sem dependências transitivas
Atendida. Nenhum atributo não-chave depende de outro atributo não-chave. Exemplo: `cursos.preco` depende apenas de `cursos.id`, não de `cursos.titulo`. O nome da categoria não está duplicado em `cursos` — está apenas em `categorias` e referenciado via `categoria_id`.

### Desnormalizações intencionais

Não houve desnormalização no escopo atual. Todos os JOINs são feitos em tempo de consulta.

**Quando faria sentido desnormalizar no futuro:**
- Cache do `total_matriculas` em `cursos` se o ranking virar a query mais quente do sistema (lido bilhões de vezes, escrito milhares). Hoje resolvemos isso com **cache no Redis** em vez de desnormalizar no Postgres.
- Cache da `media_nota` em `cursos` pelo mesmo motivo.

A decisão arquitetural foi: **manter normalização forte no banco + cache no Redis pra consultas quentes**. Isso preserva a integridade do dado-fonte e dá performance onde precisa.

---

## 4. Estratégia de Indexação

### Princípios aplicados

1. **Toda chave primária** já é índice automaticamente (B-Tree).
2. **Toda chave estrangeira** tem índice manual — JOINs são o caminho mais comum.
3. **Toda coluna usada em UNIQUE** tem índice (lógico, é a implementação do UNIQUE).
4. **Colunas usadas em filtros frequentes** ganham índice: `email` (login), `tipo` (filtro de admins), `ativo` (catálogo), `status` (relatórios), `data_matricula` (filtros temporais), `nota` (relatórios).

### Tabela completa de índices

Ver `modelagem/dicionario_dados.md` seção "Resumo de Índices" — 15 índices documentados.

### Decisões sobre o que NÃO indexar

- `descricao` (TEXT) — não usamos full-text search no escopo. Se viesse a precisar, criaríamos `GIN` com `to_tsvector`.
- `created_at`/`updated_at` — não temos queries que ordenem por essas colunas no caminho crítico.
- `comentario` (TEXT) — mesmo raciocínio do `descricao`.

---

## 5. Dados para Teste

- Total: **203 registros** distribuídos em 5 tabelas.
- Carregados via `npm run seed` (`app/src/seeds/seed.js`).
- Composição:
  - 30 usuários (1 admin fixo + 29 alunos diversificados)
  - 8 categorias temáticas (Programação, BD, DevOps, Front-end, Mobile, IA, Segurança, Soft Skills)
  - 25 cursos com preços variados (R$ 89 a R$ 399)
  - 80 matrículas com mix de status (`ativa`, `concluida`, `cancelada`) e progressos realistas
  - 60 avaliações com distribuição realista (mais notas 4 e 5, algumas 1–2)

### Coerência do dado fictício

- Nomes brasileiros realistas.
- Emails seguem padrão `nome.sobrenome@cursos.com`.
- Senhas são `senha123` (alunos) e `admin123` (admin) para facilitar avaliação — em produção seriam aleatórias.
- Datas de matrícula distribuídas nos últimos 180 dias.
- Avaliações só existem pra pares (usuário, curso) onde há matrícula.

---

## 6. Performance — Evidências de Otimização

Pra cada uma das 5 consultas críticas, rodar:

```sql
EXPLAIN (ANALYZE, BUFFERS) <query>;
```

Sequencial scans em tabelas grandes (> 1000 linhas) devem ser **substituídos por index scan** após criação dos índices listados. No volume atual do seed (centenas de linhas), o planejador pode optar por seq scan mesmo — isso é correto. Pra demonstrar o ganho, executar `SET enable_seqscan = OFF;` e comparar.
