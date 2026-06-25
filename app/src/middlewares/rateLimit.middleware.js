function rateLimit({ janelaMs = 60000, max = 10 } = {}) {
    const hits = new Map()

    return function (req, res, next) {
        const agora = Date.now()
        const chave = req.ip || req.socket.remoteAddress || 'desconhecido'
        const registro = hits.get(chave)

        if (!registro || agora > registro.reset) {
            hits.set(chave, { count: 1, reset: agora + janelaMs })
            return next()
        }
        registro.count++
        if (registro.count > max) {
            const espera = Math.ceil((registro.reset - agora) / 1000)
            res.set('Retry-After', String(espera))
            return res.status(429).json({ erro: 'Muitas tentativas. Tente novamente em instantes.' })
        }
        return next()
    }
}

module.exports = rateLimit
