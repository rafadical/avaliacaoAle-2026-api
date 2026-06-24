const jwt = require('jsonwebtoken')
const { Usuario } = require('../models')
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/jwt')

async function login(req, res, next) {
    try {
        const { email, senha } = req.body
        if (!email || !senha) {
            return res.status(400).json({ erro: 'email e senha sao obrigatorios' })
        }

        const usuario = await Usuario.findOne({ where: { email } })
        if (!usuario) {
            return res.status(401).json({ erro: 'Credenciais invalidas' })
        }

        const ok = await usuario.verificarSenha(senha)
        if (!ok) {
            return res.status(401).json({ erro: 'Credenciais invalidas' })
        }

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email, tipo: usuario.tipo },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        )

        return res.json({ token, usuario: usuario.toJSON() })
    } catch (err) {
        next(err)
    }
}

module.exports = { login }
