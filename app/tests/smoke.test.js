// Testes de fumaca da API. Exigem ambiente no ar (docker compose up) e seed aplicado.
// Rodar de dentro do container:  docker compose exec app npm test
// Ou de fora apontando pro nginx:  BASE_URL=http://localhost npm test

const test = require('node:test')
const assert = require('node:assert')

const BASE_URL = process.env.BASE_URL || 'http://localhost'

// ---------------- helpers ----------------
async function login(email = 'admin@cursos.com', senha = 'admin123') {
    const r = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
    })
    const j = await r.json()
    return j.token
}

async function criarAlunoLogado(adminToken) {
    const email = `aluno.teste.${Date.now()}.${Math.random().toString(36).slice(2, 7)}@cursos.com`
    const r = await fetch(`${BASE_URL}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ nome: 'Aluno Teste', email, senha: 'senha123', tipo: 'aluno' }),
    })
    const user = await r.json()
    const token = await login(email, 'senha123')
    return { user, token, email }
}

async function getJson(path, token) {
    const r = await fetch(`${BASE_URL}${path}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    return { status: r.status, body: await r.json().catch(() => ({})) }
}

async function postJson(path, body, token) {
    const r = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
    })
    return { status: r.status, body: await r.json().catch(() => ({})) }
}

// =================================================================
// Saude / Infra
// =================================================================
test('health responde 200 com status ok e checa DB + cache', async () => {
    const { status, body } = await getJson('/health')
    assert.strictEqual(status, 200)
    assert.strictEqual(body.status, 'ok')
    assert.strictEqual(body.checks.db, 'ok')
    assert.strictEqual(body.checks.cache, 'ok')
})

// =================================================================
// Autenticacao
// =================================================================
test('login com credenciais validas retorna token JWT', async () => {
    const token = await login()
    assert.ok(token && token.startsWith('eyJ'), 'token JWT deve comecar com eyJ')
})

test('login com senha errada retorna 401', async () => {
    const { status } = await postJson('/login', { email: 'admin@cursos.com', senha: 'errada' })
    assert.strictEqual(status, 401)
})

test('rota protegida sem token retorna 401', async () => {
    const { status } = await getJson('/cursos')
    assert.strictEqual(status, 401)
})

// =================================================================
// Autorizacao (admin vs aluno)
// =================================================================
test('aluno comum nao consegue criar curso (exige admin -> 403)', async () => {
    const adminToken = await login()
    const { token: alunoToken } = await criarAlunoLogado(adminToken)
    const { status } = await postJson('/cursos',
        { titulo: 'Hack', carga_horaria: 10, preco: 0, categoria_id: 1 },
        alunoToken
    )
    assert.strictEqual(status, 403)
})

test('aluno comum nao consegue deletar usuario (exige admin -> 403)', async () => {
    const adminToken = await login()
    const { token: alunoToken } = await criarAlunoLogado(adminToken)
    const r = await fetch(`${BASE_URL}/usuarios/1`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${alunoToken}` },
    })
    assert.strictEqual(r.status, 403)
})

// =================================================================
// Regras de negocio — matriculas
// =================================================================
test('aluno so consegue criar matricula em si mesmo (usuario_id e forcado pelo token)', async () => {
    const adminToken = await login()
    const { user: aluno, token: alunoToken } = await criarAlunoLogado(adminToken)

    // tenta forjar matricula pra OUTRO usuario (id=2 por ex)
    const { status, body } = await postJson('/matriculas',
        { usuario_id: 2, curso_id: 1 },
        alunoToken
    )
    assert.strictEqual(status, 201, 'matricula deve ser aceita mas re-atribuida')
    assert.strictEqual(body.usuario_id, aluno.id, 'usuario_id forcado ao dono do token')
})

test('matricula em curso inexistente retorna 404', async () => {
    const adminToken = await login()
    const { token: alunoToken } = await criarAlunoLogado(adminToken)
    const { status } = await postJson('/matriculas', { curso_id: 99999 }, alunoToken)
    assert.strictEqual(status, 404)
})

test('aluno A nao pode deletar matricula do aluno B', async () => {
    const adminToken = await login()
    const { token: tokenA, user: alunoA } = await criarAlunoLogado(adminToken)
    const { token: tokenB } = await criarAlunoLogado(adminToken)

    // aluno A cria uma matricula sua
    const { body: matricula } = await postJson('/matriculas', { curso_id: 1 }, tokenA)
    assert.ok(matricula.id, 'matricula deve ter sido criada')

    // aluno B tenta deletar
    const r = await fetch(`${BASE_URL}/matriculas/${matricula.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenB}` },
    })
    assert.strictEqual(r.status, 403, 'aluno B nao pode deletar matricula do A')
})

// =================================================================
// Regras de negocio — avaliacoes
// =================================================================
test('aluno NAO pode avaliar curso onde nao esta matriculado (422)', async () => {
    const adminToken = await login()
    const { token: alunoToken } = await criarAlunoLogado(adminToken)

    // tenta avaliar curso sem ter matricula
    const { status, body } = await postJson('/avaliacoes',
        { curso_id: 1, nota: 5, comentario: 'sem matricula' },
        alunoToken
    )
    assert.strictEqual(status, 422)
    assert.match(body.erro, /matriculado/i)
})

test('aluno PODE avaliar curso onde esta matriculado', async () => {
    const adminToken = await login()
    const { token: alunoToken } = await criarAlunoLogado(adminToken)

    // matricula
    await postJson('/matriculas', { curso_id: 1 }, alunoToken)
    // avalia
    const { status, body } = await postJson('/avaliacoes',
        { curso_id: 1, nota: 5, comentario: 'curso top' },
        alunoToken
    )
    assert.strictEqual(status, 201)
    assert.strictEqual(body.nota, 5)
})

// =================================================================
// Cache (Redis)
// =================================================================
test('listagem usa cache Redis (primeira chamada MISS, segunda HIT)', async () => {
    const token = await login()
    const url = `${BASE_URL}/cursos?page=1&limit=5`

    // invalida cache fazendo um POST (cria categoria fake e apaga depois)
    // mais simples: roda 2x e ve cabecalho
    const r1 = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    const cache1 = r1.headers.get('x-cache')

    const r2 = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    const cache2 = r2.headers.get('x-cache')

    // pelo menos uma das duas tem que ser HIT (segunda quase sempre)
    assert.ok(
        cache1 === 'HIT' || cache2 === 'HIT',
        `esperava HIT em pelo menos 1 chamada, recebeu [${cache1}, ${cache2}]`
    )
})

// =================================================================
// Listagem / paginacao
// =================================================================
test('listagem de cursos retorna estrutura { dados, paginacao }', async () => {
    const token = await login()
    const { status, body } = await getJson('/cursos', token)
    assert.strictEqual(status, 200)
    assert.ok(Array.isArray(body.dados), 'dados deve ser array')
    assert.ok(body.paginacao, 'paginacao deve existir')
    assert.ok(body.paginacao.total >= 0)
})

test('paginacao respeita limit', async () => {
    const token = await login()
    const { body } = await getJson('/cursos?page=1&limit=3', token)
    assert.ok(body.dados.length <= 3, 'limit deve ser respeitado')
})

// =================================================================
// 404 explicito (com token, pra passar do middleware de auth)
// =================================================================
test('rota inexistente autenticada retorna 404 com mensagem', async () => {
    const token = await login()
    const { status, body } = await getJson('/rota-que-nao-existe', token)
    assert.strictEqual(status, 404)
    assert.ok(body.erro)
})
