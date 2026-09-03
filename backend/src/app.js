import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import dbPlugin from './plugins/db.js';
import requisitionRoutes from './routes/requisition-routes.js';
import purchaseOrderRoutes from './routes/purchase-order-routes.js';

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cors, {
    origin: true,
  });

  app.register(swagger, {
    swagger: {
      info: {
        title: 'Procurement MVP API',
        description: 'REST API for Purchase Requisition (PR), Purchase Order (PO), and Goods Receipt (GR) management',
        version: '1.0.0',
      },
      host: 'localhost:3000',
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'Requisitions', description: 'Purchase Requisition operations' },
        { name: 'Purchase Orders', description: 'Purchase Order operations' },
      ],
    },
  });

  app.register(swaggerUi, {
    routePrefix: '/api-docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  app.register(dbPlugin);
  app.register(requisitionRoutes);
  app.register(purchaseOrderRoutes);

  app.get('/health',
    {
      schema: {
        description: 'Health check endpoint',
        tags: ['Health'],
        response: {
          200: {
            description: 'API is healthy',
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['ok'] },
            },
          },
        },
      },
    },
    async () => ({ status: 'ok' })
  );

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    if (reply.sent) {
      return;
    }

    reply.code(500).send({ message: 'Internal server error' });
  });

  return app;
}
