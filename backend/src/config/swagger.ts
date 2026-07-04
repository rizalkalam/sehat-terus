import path from 'path';
import swaggerJSDoc from 'swagger-jsdoc';

// In dev: __dirname = src/config → routes at src/routes/*.ts
// In prod (Docker dist/): __dirname = dist/config → routes at dist/routes/*.js
const routesGlob = path.join(__dirname, '../routes/*.{ts,js}');

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sehat Terus API',
      version: '1.0.0',
      description: 'Public Health Radar API — Sistem Epidemiologi D.I. Yogyakarta',
    },
    servers: [{ url: 'http://localhost:5000', description: 'Development' }],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'st_auth',
          description: 'JWT disimpan di cookie HttpOnly `st_auth` setelah login.',
        },
      },
      schemas: {
        UserPublic: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            nama: { type: 'string', example: 'Carmenita' },
            email: { type: 'string', format: 'email', example: 'carmen@sehatterus.id' },
            peran: {
              type: 'string',
              enum: ['manajer', 'apoteker', 'staf_logistik', 'admin'],
            },
            faskes_id: { type: 'string', format: 'uuid', nullable: true },
            aktif: { type: 'boolean' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  },
  apis: [routesGlob],
};

export default swaggerJSDoc(options);
