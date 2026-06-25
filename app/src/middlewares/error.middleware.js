module.exports = function errorHandler(err, req, res, next) {
    if (res.headersSent) return next(err)

    // Erros conhecidos do Sequelize
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
            erro: 'Erro de validacao',
            detalhes: err.errors?.map((e) => ({ campo: e.path, mensagem: e.message })),
        })
    }

    if (err.name === 'SequelizeForeignKeyConstraintError') {
        const campo = err.index || err.fields?.[0] || 'chave estrangeira'
        return res.status(400).json({ erro: `Referencia invalida: ${campo} aponta para um registro que nao existe` })
    }

    console.error('[error]', err)
    return res.status(err.status || 500).json({ erro: err.message || 'Erro interno do servidor' })
}
