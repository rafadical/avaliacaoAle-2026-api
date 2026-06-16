# Modelo Lógico

## Notação relacional

```
USUARIOS    (id PK, nome, email UQ, senha, tipo, created_at, updated_at)
CATEGORIAS  (id PK, nome UQ, descricao, created_at, updated_at)
CURSOS      (id PK, titulo, descricao, carga_horaria, preco, categoria_id FK → categorias.id, ativo, created_at, updated_at)
MATRICULAS  (id PK, usuario_id FK → usuarios.id, curso_id FK → cursos.id, status, progresso, data_matricula, created_at, updated_at)
              + UQ(usuario_id, curso_id)
AVALIACOES  (id PK, usuario_id FK → usuarios.id, curso_id FK → cursos.id, nota, comentario, created_at, updated_at)
              + UQ(usuario_id, curso_id)
```

## Mapeamento DER → Lógico

| Entidade do DER | Tabela | Estratégia |
|-----------------|--------|------------|
| Usuário | `usuarios` | Tabela direta. |
| Categoria | `categorias` | Tabela direta. |
| Curso | `cursos` | Tabela direta com FK pra categoria. |
| Matrícula (relação N:N) | `matriculas` | Tabela pivô explícita com atributos próprios. Não foi feita com JOIN implícito por causa dos atributos descritivos da relação (`status`, `progresso`, `data_matricula`). |
| Avaliação (relação ternária reduzida) | `avaliacoes` | Tabela com 2 FKs e atributos da avaliação. UQ no par garante avaliação única. |

## Decisões de modelagem

1. **Pivô explícita em vez de pura junção** — `matriculas` tem `status`/`progresso`/`data_matricula` como atributos descritivos da relação. Uma tabela de junção pura (só FKs) não comportaria esses dados.
2. **Avaliações desacopladas das matrículas** — o sistema permite, em teoria, avaliar mesmo sem matrícula formal (caso de cursos gratuitos no futuro). A regra de negócio "só avalia quem se matriculou" é aplicada na camada de aplicação, não no banco.
3. **ENUMs no Postgres** — `tipo` (usuários) e `status` (matrículas) usam ENUM nativo do Postgres pra reforçar valores válidos no nível do banco.
4. **Timestamps automáticos** — todas as tabelas têm `created_at` e `updated_at` gerenciados pelo Sequelize (`underscored: true`).
5. **Soft delete não foi adotado** — uso de `DELETE CASCADE` é intencional pra simplicidade no escopo acadêmico. Em produção real, soft delete (`deleted_at`) seria preferível.

## Chaves estrangeiras e comportamento na exclusão

| Origem | Destino | Comportamento |
|--------|---------|---------------|
| `cursos.categoria_id` | `categorias.id` | ON DELETE RESTRICT |
| `matriculas.usuario_id` | `usuarios.id` | ON DELETE CASCADE |
| `matriculas.curso_id` | `cursos.id` | ON DELETE CASCADE |
| `avaliacoes.usuario_id` | `usuarios.id` | ON DELETE CASCADE |
| `avaliacoes.curso_id` | `cursos.id` | ON DELETE CASCADE |
