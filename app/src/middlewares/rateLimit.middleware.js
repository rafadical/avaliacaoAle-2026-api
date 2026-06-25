const redis = require('../config/redis')

function rateLimit({ janelaMs = 60000, max = 50, prefixo = 'rl' } = {}) {
    const janelaSeg = Math.ceil(janelaMs / 1000)

    return async function (req, res, next) {
        const ip = req.ip || req.socket.remoteAddress || 'desconhecido'
        const chave = `${prefixo}:${ip}`
        try {
            const atual = await redis.incr(chave)
            if (atual === 1) await redis.expire(chave, janelaSeg)
            if (atual > max) {
                res.set('Retry-After', String(janelaSeg))
                return res.status(429).json({ erro: 'Muitas tentativas. Tente novamente em instantes.' })
            }
        } catch (_) {
            // se o Redis cair, nao bloqueia o login (disponibilidade > rate limit)
        }
        return next()
    }
}

module.exports = rateLimit
