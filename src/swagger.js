import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gama Store Enterprise API',
      version: '1.0.0',
      description: 'Documentação interativa OpenAPI da RESTful API do Gama Store - E-Commerce & WhatsApp Bot Ecosystem.',
      contact: {
        name: 'Gama Store Engineering'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Servidor Local de Desenvolvimento'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    paths: {
      '/api/health': {
        get: {
          summary: 'Healthcheck da API',
          responses: { '200': { description: 'API em execução' } }
        }
      },
      '/api/auth/login': {
        post: {
          summary: 'Autenticação de Usuário (JWT)',
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' } } } } }
          },
          responses: { '200': { description: 'Token JWT retornado' } }
        }
      },
      '/api/products': {
        get: {
          summary: 'Listar Produtos do Catálogo',
          responses: { '200': { description: 'Lista de produtos com mídias' } }
        },
        post: {
          summary: 'Criar Produto (Admin/Manager)',
          security: [{ bearerAuth: [] }],
          responses: { '201': { description: 'Produto criado' } }
        }
      },
      '/api/sections': {
        get: {
          summary: 'Listar Seções do CMS / Frontend',
          responses: { '200': { description: 'Seções dinâmicas' } }
        },
        post: {
          summary: 'Atualizar Seção do CMS (Admin/Manager)',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Seção atualizada' } }
        }
      },
      '/api/coupons/validate': {
        post: {
          summary: 'Validar Cupom de Desconto',
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { code: { type: 'string' }, amount: { type: 'number' } } } } }
          },
          responses: { '200': { description: 'Validação e cálculo de desconto' } }
        }
      },
      '/api/orders': {
        post: {
          summary: 'Criar Pedido de Compra',
          responses: { '201': { description: 'Pedido criado' } }
        },
        get: {
          summary: 'Listar Todos os Pedidos (Admin/Manager)',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Lista de pedidos' } }
        }
      },
      '/api/analytics': {
        get: {
          summary: 'Relatório Analítico de Vendas (Admin/Manager)',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Métricas de receita e pedidos' } }
        }
      }
    }
  },
  apis: ['./src/server.js', './src/controllers/*.js']
};

const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('📖 Documentação Swagger disponível em http://localhost:3001/api-docs');
};
