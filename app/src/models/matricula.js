const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    return sequelize.define(
        'Matricula',
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
            data_matricula: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            status: {
                type: DataTypes.ENUM('ativa', 'concluida', 'cancelada'),
                allowNull: false,
                defaultValue: 'ativa',
            },
            progresso: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                validate: { min: 0, max: 100 },
            },
        },
        {
            tableName: 'matriculas',
            underscored: true,
            timestamps: true,
            indexes: [
                { fields: ['usuario_id'] },
                { fields: ['curso_id'] },
                { fields: ['usuario_id', 'curso_id'], unique: true, name: 'uniq_matricula_usuario_curso' },
                { fields: ['status'] },
                { fields: ['data_matricula'] },
            ],
        }
    )
}
