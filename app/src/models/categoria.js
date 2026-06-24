const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    return sequelize.define(
        'Categoria',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            nome: {
                type: DataTypes.STRING(80),
                allowNull: false,
                unique: true,
                validate: { notEmpty: true, len: [2, 80] },
            },
            descricao: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
        },
        {
            tableName: 'categorias',
            underscored: true,
            timestamps: true,
        }
    )
}
