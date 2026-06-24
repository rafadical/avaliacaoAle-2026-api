const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    return sequelize.define(
        'Avaliacao',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            usuario_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'usuarios', key: 'id' },
            },
            curso_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'cursos', key: 'id' },
            },
            nota: {
                type: DataTypes.INTEGER,
                allowNull: false,
                validate: { min: 1, max: 5 },
            },
            comentario: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
        },
        {
            tableName: 'avaliacoes',
            underscored: true,
            timestamps: true,
            hooks: {
                // regra de negocio: so pode avaliar quem esta matriculado no curso
                beforeCreate: async (avaliacao) => {
                    const { Matricula } = require('./index')
                    const matricula = await Matricula.findOne({
                        where: { usuario_id: avaliacao.usuario_id, curso_id: avaliacao.curso_id },
                    })
                    if (!matricula) {
                        const err = new Error('Usuario nao matriculado neste curso nao pode avalia-lo')
                        err.status = 400
                        throw err
                    }
                },
            },
        }
    )
}
