const redis = require('../config/redis')

const CACHE_TTL = 30
const PROTEGIDOS = ['id', 'created_at', 'updated_at', 'createdAt', 'updatedAt']

function semCamposProtegidos(payload) {
    const limpo = { ...payload }
    for (const campo of PROTEGIDOS) delete limpo[campo]
    return limpo
}

module.exports = function crudFactory(Model, options = {}) {
    const include = options.include || []
    const attributes = options.attributes // permite { exclude: ['senha'] }
    const onCreatePayload = options.onCreatePayload || ((req) => req.body)
    const onUpdatePayload = options.onUpdatePayload || ((req) => req.body)

    const versionKey = `${Model.name}:listver`

    // versao atual do cache deste recurso (compoe a chave de listagem)
    async function getVersion() {
        try {
            let v = await redis.get(versionKey)
            if (!v) {
                v = String(Date.now())
                await redis.set(versionKey, v)
            }
            return v
        } catch (_) {
            return String(Date.now())
        }
    }

    // invalida todas as listagens incrementando a versao (O(1), sem KEYS).
    // As chaves da versao antiga deixam de ser consultadas e expiram pelo TTL.
    async function invalidarCache() {
        try {
            await redis.incr(versionKey)
        } catch (_) {
            /* se o Redis estiver indisponivel, segue sem cache */
        }
    }

    return {
        async list(req, res, next) {
            try {
                const page = Math.min(Math.max(parseInt(req.query.page || '1', 10) || 1, 1), 10000)
                const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10) || 20, 1), 100)
                const offset = (page - 1) * limit

                const ver = await getVersion()
                const cacheKey = `${Model.name}:list:v${ver}:${page}:${limit}`

                // tenta servir do cache (Redis)
                try {
                    const cached = await redis.get(cacheKey)
                    if (cached) {
                        res.set('X-Cache', 'HIT')
                        return res.json(JSON.parse(cached))
                    }
                } catch (_) {
                    /* Redis indisponivel: cai para o banco */
                }

                const { rows, count } = await Model.findAndCountAll({
                    include,
                    attributes,
                    limit,
                    offset,
                    order: [['id', 'ASC']],
                    distinct: true, // evita inflar o count quando ha JOIN
                })

                const payload = {
                    dados: rows,
                    paginacao: {
                        pagina: page,
                        por_pagina: limit,
                        total: count,
                        total_paginas: Math.ceil(count / limit),
                    },
                }

                // grava no cache com expiracao
                try {
                    await redis.set(cacheKey, JSON.stringify(payload), 'EX', CACHE_TTL)
                } catch (_) {
                    /* Redis indisponivel: responde sem cachear */
                }

                res.set('X-Cache', 'MISS')
                return res.json(payload)
            } catch (err) {
                next(err)
            }
        },

        async get(req, res, next) {
            try {
                const item = await Model.findByPk(req.params.id, { include, attributes })
                if (!item) return res.status(404).json({ erro: 'Registro nao encontrado' })
                return res.json(item)
            } catch (err) {
                next(err)
            }
        },

        async create(req, res, next) {
            try {
                const payload = semCamposProtegidos(await onCreatePayload(req))
                const novo = await Model.create(payload)
                await invalidarCache()
                return res.status(201).json(novo)
            } catch (err) {
                next(err)
            }
        },

        async update(req, res, next) {
            try {
                const item = await Model.findByPk(req.params.id)
                if (!item) return res.status(404).json({ erro: 'Registro nao encontrado' })
                const payload = semCamposProtegidos(await onUpdatePayload(req))
                await item.update(payload)
                await invalidarCache()
                return res.json(item)
            } catch (err) {
                next(err)
            }
        },

        async remove(req, res, next) {
            try {
                const item = await Model.findByPk(req.params.id)
                if (!item) return res.status(404).json({ erro: 'Registro nao encontrado' })
                await item.destroy()
                await invalidarCache()
                return res.status(204).end()
            } catch (err) {
                next(err)
            }
        },
    }
}
