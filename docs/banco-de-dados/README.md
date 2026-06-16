# Banco de Dados — Avaliação Prática 2º Bimestre

## Arquitetura

Banco relacional PostgreSQL 17. A justificativa completa está em [justificativa/arquitetura.md](justificativa/arquitetura.md).

## Modelagem

- DER: [modelagem/der.md](modelagem/der.md)
- Modelo lógico: [modelagem/modelo_logico.md](modelagem/modelo_logico.md)
- Dicionário de dados: [modelagem/dicionario_dados.md](modelagem/dicionario_dados.md)
- DDL completo: [scripts/setup.sql](scripts/setup.sql)

5 tabelas, 5 PKs, 6 FKs com `ON UPDATE CASCADE`, constraints CHECK em nota e progresso, 15 índices B-Tree.

## Normalização

O banco está na 3FN. Análise completa em [justificativa/arquitetura.md](justificativa/arquitetura.md).

## Índices

| Campo | Tipo | Motivo |
|-------|------|--------|
| `usuarios.email` | B-Tree UNIQUE | login |
| `usuarios.tipo` | B-Tree | filtro admin |
| `categorias.nome` | B-Tree UNIQUE | busca + unicidade |
| `cursos.categoria_id` | B-Tree | JOIN |
| `cursos.titulo` | B-Tree | busca por nome |
| `cursos.ativo` | B-Tree | listagem do catálogo |
| `matriculas.usuario_id` | B-Tree | "meus cursos" |
| `matriculas.curso_id` | B-Tree | alunos do curso |
| `matriculas (usuario_id, curso_id)` | B-Tree UNIQUE | 1 matrícula por par |
| `matriculas.status` | B-Tree | relatórios |
| `matriculas.data_matricula` | B-Tree | filtros por período |
| `avaliacoes.usuario_id` | B-Tree | minhas avaliações |
| `avaliacoes.curso_id` | B-Tree | avaliações do curso |
| `avaliacoes (usuario_id, curso_id)` | B-Tree UNIQUE | 1 avaliação por par |
| `avaliacoes.nota` | B-Tree | filtro por nota |

## Consultas críticas

6 consultas documentadas em [queries/consultas_criticas.sql](queries/consultas_criticas.sql):

1. Top 10 cursos mais matriculados
2. Média de notas por categoria
3. Alunos com matrícula no último mês
4. Alunos que matricularam mas não avaliaram
5. Receita estimada por categoria
6. Cursos bem avaliados com poucas matrículas

Para verificar uso de índices:

```sql
EXPLAIN (ANALYZE, BUFFERS) <query>;
```

## Dados de teste

203 registros populados via seed (30 usuários, 8 categorias, 25 cursos, 80 matrículas, 60 avaliações):

```bash
docker compose exec app node command.js seed
```

## Estrutura de arquivos

```
docs/banco-de-dados/
├── README.md
├── modelagem/
│   ├── der.md
│   ├── modelo_logico.md
│   └── dicionario_dados.md
├── scripts/
│   └── setup.sql
├── queries/
│   ├── crud.sql
│   └── consultas_criticas.sql
└── justificativa/
    └── arquitetura.md
```
