const { DataTypes } = require('sequelize')
const bcrypt = require('bcrypt')

module.exports = (sequelize) => {
    const Usuario = sequelize.define(
        'Usuario',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            nome: {
                type: DataTypes.STRING(120),
                allowNull: false,
                validate: { notEmpty: true, len: [2, 120] },
            },
            email: {
                type: DataTypes.STRING(160),
                allowNull: false,
                unique: true,
                validate: { isEmail: true, notEmpty: true },
            },
            senha: {
                type: DataTypes.STRING(255),
                allowNull: false,
                validate: { notEmpty: true, len: [6, 255] },
            },
            tipo: {
                type: DataTypes.ENUM('aluno', 'admin'),
                allowNull: false,
                defaultValue: 'aluno',
            },
        },
        {
            tableName: 'usuarios',
            underscored: true,
            timestamps: true,
            indexes: [
                { fields: ['email'], unique: true },
                { fields: ['tipo'] },
            ],
            hooks: {
                beforeCreate: async (usuario) => {
                    if (usuario.senha) {
                        usuario.senha = await bcrypt.hash(usuario.senha, 10)
                    }
                },
                beforeUpdate: async (usuario) => {
                    if (usuario.changed('senha')) {
                        usuario.senha = await bcrypt.hash(usuario.senha, 10)
                    }
                },
            },
        }
    )

    Usuario.prototype.verificarSenha = async function (senhaPlana) {
        return bcrypt.compare(senhaPlana, this.senha)
    }

    Usuario.prototype.toJSON = function () {
        const obj = { ...this.get() }
        delete obj.senha
        return obj
    }

    return Usuario
}
