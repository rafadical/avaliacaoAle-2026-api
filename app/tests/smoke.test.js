// Testes de fumaca da API. Exigem o ambiente no ar (docker compose up) e o seed aplicado.
// Rodar de dentro do container:  docker compose exec app node --test
// Ou localmente apontando para outra base:  BASE_URL=http://localhost node --test

const test = require('node:test')
const assert = require('node:assert')

const BASE_URL = process.env.BASE_URL || 'http://localhost'

async function login() {
    const r = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@cursos.com', senha: 'admin123' }),
    })
    const j = await r.json()
    return j.token
}

test('health responde ok', async () => {
    const r = await fetch(`${BASE_URL}/health`)
    assert.strictEqual(r.status, 200)
    const j = await r.json()
    assert.strictEqual(j.status, 'ok')
})

test('login retorna token JWT', async () => {
    const token = await login()
    assert.ok(token && token.startsWith('eyJ'), 'token JWT deve comecar com eyJ')
})

test('rota protegida sem token retorna 401', async () => {
    const r = await fetch(`${BASE_URL}/cursos`)
    assert.strictEqual(r.status, 401)
})

test('rota protegida com token retorna a lista', async () => {
    const token = await login()
    const r = await fetch(`${BASE_URL}/cursos`, {
        headers: { Authorization: `Bearer ${token}` },
    })
    assert.strictEqual(r.status, 200)
    const j = await r.json()
    assert.ok(Array.isArray(j.dados), 'resposta deve ter um array dados')
})

test('aluno comum nao consegue criar curso (exige admin)', async () => {
    // cria um aluno e loga com ele
    const adminToken = await login()
    const email = `aluno.teste.${Date.now()}@cursos.com`
    await fetch(`${BASE_URL}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ nome: 'Aluno Teste', email, senha: 'senha123', tipo: 'aluno' }),
    })
    const lr = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha: 'senha123' }),
    })
    const alunoToken = (await lr.json()).token

    const r = await fetch(`${BASE_URL}/cursos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${alunoToken}` },
        body: JSON.stringify({ titulo: 'Hack', carga_horaria: 10, preco: 0, categoria_id: 1 }),
    })
    assert.strictEqual(r.status, 403, 'aluno nao pode criar curso')
})
