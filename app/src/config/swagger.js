const swaggerJsdoc = require('swagger-jsdoc')

const definition = {
    openapi: '3.0.3',
    info: {
        title: 'Plataforma de Cursos Online — API REST',
        version: '1.0.0',
        description:
            'API REST — Avaliacao Pratica 2 Bimestre 2026 (Desenvolvimento Web + Banco de Dados + Infraestrutura).',
    },
    servers: [{ url: 'http://localhost', description: 'Local (via Nginx)' }],
    components: {
        securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
        schemas: {
            Usuario: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    nome: { type: 'string', example: 'Maria Silva' },
                    email: { type: 'string', format: 'email', example: 'maria@exemplo.com' },
                    tipo: { type: 'string', enum: ['aluno', 'admin'], example: 'aluno' },
                    created_at: { type: 'string', format: 'date-time' },
                    updated_at: { type: 'string', format: 'date-time' },
                },
            },
            UsuarioInput: {
                type: 'object',
                required: ['nome', 'email', 'senha'],
                properties: {
                    nome: { type: 'string', example: 'Maria Silva' },
                    email: { type: 'string', format: 'email', example: 'maria@exemplo.com' },
                    senha: { type: 'string', example: 'senha123' },
                    tipo: { type: 'string', enum: ['aluno', 'admin'], example: 'aluno' },
                },
            },
            Categoria: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    nome: { type: 'string', example: 'Programação' },
                    descricao: { type: 'string', example: 'Cursos de programação e desenvolvimento.' },
                },
            },
            Curso: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    titulo: { type: 'string', example: 'Node.js do Zero ao Avançado' },
                    descricao: { type: 'string' },
                    carga_horaria: { type: 'integer', example: 40 },
                    preco: { type: 'number', format: 'float', example: 199.9 },
                    categoria_id: { type: 'integer', example: 1 },
                    ativo: { type: 'boolean', example: true },
                },
            },
            Matricula: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    usuario_id: { type: 'integer' },
                    curso_id: { type: 'integer' },
                    status: { type: 'string', enum: ['ativa', 'concluida', 'cancelada'] },
                    progresso: { type: 'integer', minimum: 0, maximum: 100 },
                    data_matricula: { type: 'string', format: 'date-time' },
                },
            },
            Avaliacao: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    usuario_id: { type: 'integer' },
                    curso_id: { type: 'integer' },
                    nota: { type: 'integer', minimum: 1, maximum: 5 },
                    comentario: { type: 'string' },
                },
            },
            Erro: {
                type: 'object',
                properties: {
                    erro: { type: 'string' },
                    detalhes: { type: 'array', items: { type: 'object' } },
                },
            },
        },
    },
    security: [{ bearerAuth: [] }],
    paths: {
        '/login': {
            post: {
                tags: ['Autenticação'],
                summary: 'Gera token JWT a partir de email/senha',
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'senha'],
                                properties: {
                                    email: { type: 'string', format: 'email', example: 'admin@cursos.com' },
                                    senha: { type: 'string', example: 'admin123' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Token gerado',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        token: { type: 'string' },
                                        usuario: { $ref: '#/components/schemas/Usuario' },
                                    },
                                },
                            },
                        },
                    },
                    401: { description: 'Credenciais inválidas' },
                },
            },
        },
        '/health': {
            get: {
                tags: ['Sistema'],
                summary: 'Healthcheck',
                security: [],
                responses: { 200: { description: 'OK' } },
            },
        },
        ...gerarRotasCRUD('usuarios', 'Usuario', 'usuario'),
        ...gerarRotasCRUD('categorias', 'Categoria', 'categoria'),
        ...gerarRotasCRUD('cursos', 'Curso', 'curso'),
        ...gerarRotasCRUD('matriculas', 'Matricula', 'matricula'),
        ...gerarRotasCRUD('avaliacoes', 'Avaliacao', 'avaliacao'),
    },
}

function gerarRotasCRUD(recurso, schema, singular) {
    const tag = recurso.charAt(0).toUpperCase() + recurso.slice(1)
    return {
        [`/${recurso}`]: {
            get: {
                tags: [tag],
                summary: `Lista ${recurso} (paginado)`,
                parameters: [
                    { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
                    { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
                ],
                responses: { 200: { description: 'OK' }, 401: { description: 'Não autenticado' } },
            },
            post: {
                tags: [tag],
                summary: `Cria ${singular}`,
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: `#/components/schemas/${schema}` } } },
                },
                responses: { 201: { description: 'Criado' }, 400: { description: 'Erro de validação' } },
            },
        },
        [`/${recurso}/{id}`]: {
            get: {
                tags: [tag],
                summary: `Busca ${singular} por id`,
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'OK' }, 404: { description: 'Não encontrado' } },
            },
            put: {
                tags: [tag],
                summary: `Atualiza ${singular}`,
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: `#/components/schemas/${schema}` } } },
                },
                responses: { 200: { description: 'OK' }, 404: { description: 'Não encontrado' } },
            },
            delete: {
                tags: [tag],
                summary: `Remove ${singular}`,
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
                responses: { 204: { description: 'Removido' }, 404: { description: 'Não encontrado' } },
            },
        },
    }
}

module.exports = swaggerJsdoc({ definition, apis: [] })
