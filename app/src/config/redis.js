const Redis = require('ioredis')

const redis = new Redis({
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    lazyConnect: true,
    maxRetriesPerRequest: 3,
})

redis.on('error', (err) => {
    console.error('[redis] erro de conexao:', err.message)
})

module.exports = redis
