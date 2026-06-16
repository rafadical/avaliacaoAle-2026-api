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
        return res.status(400).json({ erro: 'Referencia invalida em chave estrangeira' })
    }

    console.error('[error]', err)
    return res.status(err.status || 500).json({ erro: err.message || 'Erro interno do servidor' })
}
