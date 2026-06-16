# Diagrama Entidade-Relacionamento (DER)

## Entidades e relacionamentos

O sistema tem 5 entidades. As relações entre elas:

**CATEGORIAS → CURSOS (1:N)**
Uma categoria agrupa vários cursos. Um curso pertence a exatamente uma categoria. Chave estrangeira `cursos.categoria_id` com `ON DELETE RESTRICT` — não é possível apagar categoria que ainda tem cursos.

**USUARIOS ↔ CURSOS via MATRICULAS (N:N)**
Um usuário pode se matricular em vários cursos e um curso pode ter vários alunos. A tabela `matriculas` é o pivô desta relação, com atributos próprios: `status`, `progresso` e `data_matricula`.

**USUARIOS ↔ CURSOS via AVALIACOES (N:N)**
Um usuário pode avaliar vários cursos e um curso pode receber avaliações de vários alunos. Restrição `UNIQUE(usuario_id, curso_id)` garante uma avaliação por par.

## Cardinalidades

| Relacionamento | Cardinalidade | Observação |
|----------------|---------------|------------|
| `CATEGORIAS` → `CURSOS` | 1 : N | Uma categoria possui vários cursos. Um curso pertence a exatamente uma categoria. `ON DELETE RESTRICT` impede apagar categoria com cursos vinculados. |
| `USUARIOS` ↔ `CURSOS` (via `MATRICULAS`) | N : N | Um usuário pode se matricular em vários cursos e um curso recebe vários usuários. Tabela pivô explícita com atributos próprios (`status`, `progresso`, `data_matricula`). |
| `USUARIOS` → `AVALIACOES` ← `CURSOS` | N : N | Um usuário avalia vários cursos; cada curso pode receber várias avaliações. `UNIQUE(usuario_id, curso_id)` garante uma avaliação por par. |

## Regras de integridade

- `usuarios.email` UNIQUE — não permite cadastro duplicado.
- `usuarios.senha` armazenada com bcrypt (hash com salt, custo 10).
- `categorias.nome` UNIQUE — evita categorias duplicadas.
- `matriculas (usuario_id, curso_id)` UNIQUE — um aluno não se matricula duas vezes no mesmo curso.
- `matriculas.progresso` CHECK 0..100.
- `avaliacoes (usuario_id, curso_id)` UNIQUE — uma avaliação por aluno/curso.
- `avaliacoes.nota` CHECK 1..5.
- `cursos.categoria_id` FK com `ON DELETE RESTRICT` — proteção contra perda acidental de dados.
- `matriculas.*` e `avaliacoes.*` FKs com `ON DELETE CASCADE` — quando o usuário ou curso é removido, suas relações vão junto.
