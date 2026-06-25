const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    return sequelize.define(
        'Curso',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            titulo: {
                type: DataTypes.STRING(160),
                allowNull: false,
                validate: { notEmpty: true, len: [3, 160] },
            },
            descricao: {
                type: DataTypes.TEXT,
                allowNull: true,
                validate: { len: [0, 5000] },
            },
            carga_horaria: {
                type: DataTypes.INTEGER,
                allowNull: false,
                validate: { min: 1, max: 1000 },
            },
            preco: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0,
                validate: { min: 0 },
            },
            categoria_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'categorias', key: 'id' },
            },
            ativo: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
        },
        {
            tableName: 'cursos',
            underscored: true,
            timestamps: true,
        }
    )
}
