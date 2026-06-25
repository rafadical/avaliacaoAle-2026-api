// Segredo de desenvolvimento. NAO e um segredo de producao: serve apenas para o
// projeto subir e funcionar localmente. Em producao, defina JWT_SECRET no .env
// (que nao vai para o repositorio) para sobrescrever este valor.
const DEV_FALLBACK = 'dev-secret-local-defina-JWT_SECRET-no-env-em-producao'

const fromEnv = process.env.JWT_SECRET

// Estavel entre reinicializacoes e entre replicas: usa o valor do ambiente se
// houver; caso contrario, o fallback fixo de desenvolvimento.
const JWT_SECRET = fromEnv && fromEnv.trim() !== '' ? fromEnv : DEV_FALLBACK

if (JWT_SECRET === DEV_FALLBACK) {
    console.warn('[jwt] usando segredo de desenvolvimento; defina JWT_SECRET no .env para producao.')
}

module.exports = {
    JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
}
