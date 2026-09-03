import {
  createPurchaseOrder,
  getOpenPoLines,
  getPurchaseOrderById,
  listPurchaseOrders,
  submitPurchaseOrder,
} from '../services/purchase-order-service.js';

const poLineSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    lineNo: { type: 'integer' },
    itemCode: { type: 'string' },
    itemName: { type: 'string' },
    qtyOrdered: { type: 'number' },
    qtyReceived: { type: 'number' },
    qtyOpenForGr: { type: 'number' },
    uom: { type: 'string' },
    unitPrice: { type: 'number' },
    siteCode: { type: 'string' },
    requiredDate: { type: 'string', format: 'date' },
  },
};

const poSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    poNumber: { type: 'string' },
    vendorName: { type: 'string' },
    status: { type: 'string', enum: ['DRAFT', 'SUBMITTED'] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    poLines: { type: 'array', items: poLineSchema },
  },
};

export default async function purchaseOrderRoutes(fastify) {
  fastify.get('/api/purchase-orders',
    {
      schema: {
        description: 'List all purchase orders',
        tags: ['Purchase Orders'],
        response: {
          200: {
            description: 'List of purchase orders',
            type: 'object',
            properties: {
              items: { type: 'array', items: poSchema },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const items = await listPurchaseOrders(fastify.db);
      return { items };
    }
  );

  fastify.post('/api/purchase-orders',
    {
      schema: {
        description: 'Create a new purchase order by allocating quantities from approved PR lines',
        tags: ['Purchase Orders'],
        body: {
          type: 'object',
          required: ['vendorName', 'lines'],
          properties: {
            vendorName: { type: 'string', description: 'Vendor/supplier name' },
            lines: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['prLineId', 'qtyOrdered', 'itemCode', 'itemName', 'uom', 'unitPrice', 'siteCode'],
                properties: {
                  prLineId: { type: 'string', format: 'uuid', description: 'PR line ID to allocate from' },
                  qtyOrdered: { type: 'number', minimum: 0, description: 'Quantity to allocate (must be <= PR remaining)' },
                  itemCode: { type: 'string' },
                  itemName: { type: 'string' },
                  uom: { type: 'string' },
                  unitPrice: { type: 'number', minimum: 0 },
                  siteCode: { type: 'string' },
                  requiredDate: { type: 'string', format: 'date' },
                },
              },
            },
          },
        },
        response: {
          201: {
            description: 'Purchase order created successfully',
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              poNumber: { type: 'string' },
              vendorName: { type: 'string' },
              status: { type: 'string', enum: ['DRAFT', 'SUBMITTED'] },
              lines: { type: 'array', items: poLineSchema },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          400: { description: 'Invalid request body' },
          404: { description: 'PR line not found' },
          409: { description: 'Over-allocation: allocated qty exceeds PR line remaining' },
          422: { description: 'Validation error' },
        },
      },
    },
    async (request, reply) => {
      try {
        const purchaseOrder = await createPurchaseOrder(fastify.db, request.body);
        reply.code(201);
        return purchaseOrder;
      } catch (error) {
        if (error.statusCode) {
          reply.code(error.statusCode);
          return { message: error.message };
        }

        throw error;
      }
    }
  );

  fastify.post('/api/purchase-orders/:id/submit',
    {
      schema: {
        description: 'Submit a purchase order (DRAFT → SUBMITTED)',
        tags: ['Purchase Orders'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Purchase order ID' },
          },
        },
        response: {
          200: {
            description: 'Purchase order submitted successfully',
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              poNumber: { type: 'string' },
              vendorName: { type: 'string' },
              status: { type: 'string', enum: ['DRAFT', 'SUBMITTED'] },
              lines: { type: 'array', items: poLineSchema },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          404: { description: 'Purchase order not found' },
          409: { description: 'Invalid status transition (already submitted)' },
        },
      },
    },
    async (request, reply) => {
      try {
        const purchaseOrder = await submitPurchaseOrder(fastify.db, request.params.id);
        if (!purchaseOrder) {
          reply.code(404);
          return { message: 'Purchase order not found' };
        }

        return purchaseOrder;
      } catch (error) {
        if (error.statusCode) {
          reply.code(error.statusCode);
          return { message: error.message };
        }

        throw error;
      }
    }
  );

  fastify.get('/api/purchase-orders/:id',
    {
      schema: {
        description: 'Get a purchase order by ID',
        tags: ['Purchase Orders'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Purchase order ID' },
          },
        },
        response: {
          200: {
            description: 'Purchase order details with all lines',
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              poNumber: { type: 'string' },
              vendorName: { type: 'string' },
              status: { type: 'string', enum: ['DRAFT', 'SUBMITTED'] },
              lines: { type: 'array', items: poLineSchema },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          404: { description: 'Purchase order not found' },
        },
      },
    },
    async (request, reply) => {
      const purchaseOrder = await getPurchaseOrderById(fastify.db, request.params.id);
      if (!purchaseOrder) {
        reply.code(404);
        return { message: 'Purchase order not found' };
      }

      return purchaseOrder;
    }
  );

  fastify.get('/api/purchase-orders/:id/open-lines',
    {
      schema: {
        description: 'Get open (unfulfilld) lines for a purchase order',
        tags: ['Purchase Orders'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Purchase order ID' },
          },
        },
        response: {
          200: {
            description: 'Open PO lines with remaining receipt quantities',
            type: 'object',
            properties: {
              purchaseOrder: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  poNumber: { type: 'string' },
                  status: { type: 'string', enum: ['DRAFT', 'SUBMITTED'] },
                },
              },
              openLines: { type: 'array', items: poLineSchema },
            },
          },
          404: { description: 'Purchase order not found' },
        },
      },
    },
    async (request, reply) => {
      const payload = await getOpenPoLines(fastify.db, request.params.id);
      if (!payload) {
        reply.code(404);
        return { message: 'Purchase order not found' };
      }

      return payload;
    }
  );
}
