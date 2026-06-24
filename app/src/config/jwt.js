const crypto = require('node:crypto')

// Valor publico que ja esteve versionado: nunca deve ser usado como segredo real.
const DEV_DEFAULT = 'troque-este-segredo-em-producao'

const fromEnv = process.env.JWT_SECRET

// Usa o segredo do ambiente se for um valor proprio.
// Caso contrario gera um segredo aleatorio desta sessao (nao fica no repositorio).
const JWT_SECRET =
    fromEnv && fromEnv !== DEV_DEFAULT ? fromEnv : crypto.randomBytes(32).toString('hex')

if (!fromEnv || fromEnv === DEV_DEFAULT) {
    console.warn('[jwt] JWT_SECRET nao definido no ambiente; usando segredo aleatorio desta sessao.')
}

module.exports = {
    JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
}
