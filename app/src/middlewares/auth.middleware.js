const jwt = require('jsonwebtoken')

function autenticarJWT(req, res, next) {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ erro: 'Token nao fornecido' })
    }

    const token = header.slice(7)
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET)
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

module.exports = { autenticarJWT, exigirAdmin }
