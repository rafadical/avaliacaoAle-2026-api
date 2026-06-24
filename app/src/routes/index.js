const express = require('express')
const { autenticarJWT, exigirAdmin } = require('../middlewares/auth.middleware')
const { sequelize, Usuario, Categoria, Curso, Matricula, Avaliacao } = require('../models')
const crudFactory = require('../controllers/crud.factory')
const auth = require('../controllers/auth.controller')

const router = express.Router()

// rotas publicas
router.post('/login', auth.login)
router.get('/health', async (req, res) => {
    try {
        await sequelize.authenticate()
        return res.json({ status: 'ok', uptime: process.uptime() })
    } catch (err) {
        return res.status(503).json({ status: 'unhealthy', erro: 'banco indisponivel' })
    }
})

// rotas autenticadas
router.use(autenticarJWT)

// ---- USUARIOS ----
const usuariosCRUD = crudFactory(Usuario, {
    attributes: { exclude: ['senha'] },
})
router.get('/usuarios', usuariosCRUD.list)
router.get('/usuarios/:id', usuariosCRUD.get)
router.post('/usuarios', exigirAdmin, usuariosCRUD.create)
router.put('/usuarios/:id', exigirAdmin, usuariosCRUD.update)
router.delete('/usuarios/:id', exigirAdmin, usuariosCRUD.remove)

// ---- CATEGORIAS ----
const categoriasCRUD = crudFactory(Categoria, {
    include: [{ model: Curso, as: 'cursos' }],
})
router.get('/categorias', categoriasCRUD.list)
router.get('/categorias/:id', categoriasCRUD.get)
router.post('/categorias', exigirAdmin, categoriasCRUD.create)
router.put('/categorias/:id', exigirAdmin, categoriasCRUD.update)
router.delete('/categorias/:id', exigirAdmin, categoriasCRUD.remove)

// ---- CURSOS ----
const cursosCRUD = crudFactory(Curso, {
    include: [{ model: Categoria, as: 'categoria' }],
})
router.get('/cursos', cursosCRUD.list)
router.get('/cursos/:id', cursosCRUD.get)
router.post('/cursos', exigirAdmin, cursosCRUD.create)
router.put('/cursos/:id', exigirAdmin, cursosCRUD.update)
router.delete('/cursos/:id', exigirAdmin, cursosCRUD.remove)

// ---- MATRICULAS (tabela pivo) ----
const matriculasCRUD = crudFactory(Matricula, {
    include: [
        { model: Usuario, as: 'usuario', attributes: { exclude: ['senha'] } },
        { model: Curso, as: 'curso' },
    ],
})
router.get('/matriculas', matriculasCRUD.list)
router.get('/matriculas/:id', matriculasCRUD.get)
router.post('/matriculas', matriculasCRUD.create)
router.put('/matriculas/:id', matriculasCRUD.update)
router.delete('/matriculas/:id', matriculasCRUD.remove)

// ---- AVALIACOES ----
const avaliacoesCRUD = crudFactory(Avaliacao, {
    include: [
        { model: Usuario, as: 'usuario', attributes: { exclude: ['senha'] } },
        { model: Curso, as: 'curso' },
    ],
})
router.get('/avaliacoes', avaliacoesCRUD.list)
router.get('/avaliacoes/:id', avaliacoesCRUD.get)
router.post('/avaliacoes', avaliacoesCRUD.create)
router.put('/avaliacoes/:id', avaliacoesCRUD.update)
router.delete('/avaliacoes/:id', avaliacoesCRUD.remove)

module.exports = router
