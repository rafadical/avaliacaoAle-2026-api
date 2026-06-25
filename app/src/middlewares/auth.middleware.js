const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../config/jwt')

function autenticarJWT(req, res, next) {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ erro: 'Token nao fornecido' })
    }

    const token = header.slice(7)
    try {
        const payload = jwt.verify(token, JWT_SECRET)
        req.usuario = payload
        return next()
    } catch (err) {
        return res.status(401).json({ erro: 'Token invalido ou expirado' })
    }
}

function exigirAdmin(req, res, next) {
    if (!req.usuario || req.usuario.tipo !== 'admin') {
        return res.status(403).json({ erro: 'Acesso restrito a administradores' })
    }
    return next()
}

// garante que o usuario logado e o dono do registro (campo usuario_id) ou e admin.
// usado em PUT/DELETE de matriculas e avaliacoes para um aluno nao mexer no de outro.
function exigirDonoOuAdmin(Model, campoUsuarioId = 'usuario_id') {
    return async function (req, res, next) {
        try {
            if (req.usuario && req.usuario.tipo === 'admin') return next()

            const item = await Model.findByPk(req.params.id)
            if (!item) return res.status(404).json({ erro: 'Registro nao encontrado' })

            if (item[campoUsuarioId] !== req.usuario.id) {
                return res.status(403).json({ erro: 'Voce so pode alterar seus proprios registros' })
            }
            return next()
        } catch (err) {
            return next(err)
        }
    }
}

module.exports = { autenticarJWT, exigirAdmin, exigirDonoOuAdmin }
