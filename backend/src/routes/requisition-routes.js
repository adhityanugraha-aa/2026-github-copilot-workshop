import {
  approveRequisition,
  createRequisition,
  getRequisitionById,
  getRequisitionOpenLines,
  listRequisitions,
  submitRequisition,
} from '../services/requisition-service.js';

const prLineSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    lineNo: { type: 'integer' },
    itemCode: { type: 'string' },
    itemName: { type: 'string' },
    qtyRequested: { type: 'number' },
    qtyAllocated: { type: 'number' },
    qtyReceived: { type: 'number' },
    qtyOpenForPo: { type: 'number' },
    uom: { type: 'string' },
    estUnitPrice: { type: 'number' },
    siteCode: { type: 'string' },
    requiredDate: { type: 'string', format: 'date' },
    budgetCenter: { type: 'string' },
  },
};

const prSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    prNumber: { type: 'string' },
    requesterName: { type: 'string' },
    departmentName: { type: 'string' },
    title: { type: 'string' },
    notes: { type: 'string', nullable: true },
    neededByDate: { type: 'string', format: 'date' },
    status: { type: 'string', enum: ['DRAFT', 'SUBMITTED', 'APPROVED'] },
    lines: { type: 'array', items: prLineSchema },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

export default async function requisitionRoutes(fastify) {
  fastify.get('/api/requisitions',
    {
      schema: {
        description: 'List all purchase requisitions',
        tags: ['Requisitions'],
        response: {
          200: {
            description: 'List of requisitions',
            type: 'object',
            properties: {
              items: { type: 'array', items: prSchema },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const items = await listRequisitions(fastify.db);
      return { items };
    }
  );

  fastify.post('/api/requisitions',
    {
      schema: {
        description: 'Create a new purchase requisition',
        tags: ['Requisitions'],
        body: {
          type: 'object',
          required: ['requester_name', 'department_name', 'title', 'needed_by_date', 'pr_lines'],
          properties: {
            requester_name: { type: 'string' },
            department_name: { type: 'string' },
            title: { type: 'string' },
            notes: { type: 'string', nullable: true },
            needed_by_date: { type: 'string', format: 'date' },
            pr_lines: {
              type: 'array',
              items: {
                type: 'object',
                required: ['item_code', 'item_name', 'qty_requested', 'uom', 'est_unit_price', 'required_date'],
                properties: {
                  item_code: { type: 'string' },
                  item_name: { type: 'string' },
                  qty_requested: { type: 'number', minimum: 0 },
                  uom: { type: 'string' },
                  est_unit_price: { type: 'number', minimum: 0 },
                  site_code: { type: 'string' },
                  required_date: { type: 'string', format: 'date' },
                  budget_center: { type: 'string' },
                },
              },
            },
          },
        },
        response: {
          201: {
            description: 'Requisition created successfully',
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              prNumber: { type: 'string' },
              requesterName: { type: 'string' },
              departmentName: { type: 'string' },
              title: { type: 'string' },
              notes: { type: 'string', nullable: true },
              neededByDate: { type: 'string', format: 'date' },
              status: { type: 'string', enum: ['DRAFT', 'SUBMITTED', 'APPROVED'] },
              lines: { type: 'array', items: prLineSchema },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          400: { description: 'Invalid request body' },
          422: { description: 'Validation error' },
        },
      },
    },
    async (request, reply) => {
      try {
        const requisition = await createRequisition(fastify.db, request.body);
        reply.code(201);
        return requisition;
      } catch (error) {
        if (error.statusCode) {
          reply.code(error.statusCode);
          return { message: error.message };
        }

        throw error;
      }
    }
  );

  fastify.post('/api/requisitions/:id/submit',
    {
      schema: {
        description: 'Submit a purchase requisition (DRAFT → SUBMITTED)',
        tags: ['Requisitions'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Requisition ID' },
          },
        },
        response: {
          200: {
            description: 'Requisition submitted successfully',
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              prNumber: { type: 'string' },
              requesterName: { type: 'string' },
              departmentName: { type: 'string' },
              title: { type: 'string' },
              notes: { type: 'string', nullable: true },
              neededByDate: { type: 'string', format: 'date' },
              status: { type: 'string', enum: ['DRAFT', 'SUBMITTED', 'APPROVED'] },
              lines: { type: 'array', items: prLineSchema },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          404: { description: 'Requisition not found' },
          409: { description: 'Invalid status transition' },
        },
      },
    },
    async (request, reply) => {
      try {
        const requisition = await submitRequisition(fastify.db, request.params.id);
        if (!requisition) {
          reply.code(404);
          return { message: 'Requisition not found' };
        }

        return requisition;
      } catch (error) {
        if (error.statusCode) {
          reply.code(error.statusCode);
          return { message: error.message };
        }

        throw error;
      }
    }
  );

  fastify.post('/api/requisitions/:id/approve',
    {
      schema: {
        description: 'Approve a purchase requisition (SUBMITTED → APPROVED)',
        tags: ['Requisitions'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Requisition ID' },
          },
        },
        response: {
          200: {
            description: 'Requisition approved successfully',
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              prNumber: { type: 'string' },
              requesterName: { type: 'string' },
              departmentName: { type: 'string' },
              title: { type: 'string' },
              notes: { type: 'string', nullable: true },
              neededByDate: { type: 'string', format: 'date' },
              status: { type: 'string', enum: ['DRAFT', 'SUBMITTED', 'APPROVED'] },
              lines: { type: 'array', items: prLineSchema },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          404: { description: 'Requisition not found' },
          409: { description: 'Invalid status transition' },
        },
      },
    },
    async (request, reply) => {
      try {
        const requisition = await approveRequisition(fastify.db, request.params.id);
        if (!requisition) {
          reply.code(404);
          return { message: 'Requisition not found' };
        }

        return requisition;
      } catch (error) {
        if (error.statusCode) {
          reply.code(error.statusCode);
          return { message: error.message };
        }

        throw error;
      }
    }
  );

  fastify.get('/api/requisitions/:id',
    {
      schema: {
        description: 'Get a purchase requisition by ID',
        tags: ['Requisitions'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Requisition ID' },
          },
        },
        response: {
          200: {
            description: 'Requisition details',
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              prNumber: { type: 'string' },
              requesterName: { type: 'string' },
              departmentName: { type: 'string' },
              title: { type: 'string' },
              notes: { type: 'string', nullable: true },
              neededByDate: { type: 'string', format: 'date' },
              status: { type: 'string', enum: ['DRAFT', 'SUBMITTED', 'APPROVED'] },
              lines: { type: 'array', items: prLineSchema },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          404: { description: 'Requisition not found' },
        },
      },
    },
    async (request, reply) => {
      const requisition = await getRequisitionById(fastify.db, request.params.id);
      if (!requisition) {
        reply.code(404);
        return { message: 'Requisition not found' };
      }

      return requisition;
    }
  );

  fastify.get('/api/requisitions/:id/open-lines',
    {
      schema: {
        description: 'Get open (unallocated) lines for a requisition',
        tags: ['Requisitions'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Requisition ID' },
          },
        },
        response: {
          200: {
            description: 'Open PR lines with remaining allocation quantities',
            type: 'object',
            properties: {
              requisition: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  prNumber: { type: 'string' },
                  status: { type: 'string', enum: ['DRAFT', 'SUBMITTED', 'APPROVED'] },
                },
              },
              openLines: { type: 'array', items: prLineSchema },
            },
          },
          404: { description: 'Requisition not found' },
        },
      },
    },
    async (request, reply) => {
      const payload = await getRequisitionOpenLines(fastify.db, request.params.id);
      if (!payload) {
        reply.code(404);
        return { message: 'Requisition not found' };
      }

      return payload;
    }
  );
}
