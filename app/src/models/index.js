const sequelize = require('../config/database')

const Usuario = require('./usuario')(sequelize)
const Categoria = require('./categoria')(sequelize)
const Curso = require('./curso')(sequelize)
const Matricula = require('./matricula')(sequelize)
const Avaliacao = require('./avaliacao')(sequelize)

// Relacionamentos
// Categoria 1 ----- N Curso
Categoria.hasMany(Curso, { foreignKey: 'categoria_id', as: 'cursos' })
Curso.belongsTo(Categoria, { foreignKey: 'categoria_id', as: 'categoria' })

// Usuario N -----[Matricula]----- N Curso  (pivo)
Usuario.belongsToMany(Curso, {
    through: Matricula,
    foreignKey: 'usuario_id',
    otherKey: 'curso_id',
    as: 'cursos_matriculados',
})
Curso.belongsToMany(Usuario, {
    through: Matricula,
    foreignKey: 'curso_id',
    otherKey: 'usuario_id',
    as: 'alunos',
})
// Acesso direto a tabela pivo
Usuario.hasMany(Matricula, { foreignKey: 'usuario_id', as: 'matriculas' })
Matricula.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' })
Curso.hasMany(Matricula, { foreignKey: 'curso_id', as: 'matriculas' })
Matricula.belongsTo(Curso, { foreignKey: 'curso_id', as: 'curso' })

// Usuario 1 ----- N Avaliacao N ----- 1 Curso
Usuario.hasMany(Avaliacao, { foreignKey: 'usuario_id', as: 'avaliacoes' })
Avaliacao.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' })
Curso.hasMany(Avaliacao, { foreignKey: 'curso_id', as: 'avaliacoes' })
Avaliacao.belongsTo(Curso, { foreignKey: 'curso_id', as: 'curso' })

module.exports = {
    sequelize,
    Usuario,
    Categoria,
    Curso,
    Matricula,
    Avaliacao,
}
