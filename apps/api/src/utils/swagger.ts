import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'CinePass Movie Ticket Booking API',
    version: '1.0.0',
    description: 'Enterprise REST API specification for CinePass Movie Ticket Booking System',
    contact: {
      name: 'CinePass Engineering Team',
      email: 'engineering@cinepass.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'accessToken',
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register new user',
        tags: ['Authentication'],
        responses: { 201: { description: 'User created and cookies set' } },
      },
    },
    '/auth/login': {
      post: {
        summary: 'User login',
        tags: ['Authentication'],
        responses: { 200: { description: 'Login successful' } },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get current user profile',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { 200: { description: 'Authenticated user info' } },
      },
    },
    '/movies': {
      get: {
        summary: 'List and filter movies',
        tags: ['Movies'],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'cityId', in: 'query', schema: { type: 'string' } },
          { name: 'genre', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['now_showing', 'coming_soon', 'featured'] } },
        ],
        responses: { 200: { description: 'Paginated list of movies' } },
      },
    },
    '/shows/{id}/seats': {
      get: {
        summary: 'Get real-time seat availability and layout for a show',
        tags: ['Shows & Seats'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Real-time seat layout grid' } },
      },
    },
    '/seats/holds': {
      post: {
        summary: 'Atomically hold seats for checkout',
        tags: ['Shows & Seats'],
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { 201: { description: 'Seats held with TTL expiry countdown' } },
      },
    },
    '/bookings': {
      post: {
        summary: 'Create pending booking from active seat hold',
        tags: ['Bookings'],
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { 201: { description: 'Booking created with Razorpay order' } },
      },
    },
    '/payments/verify': {
      post: {
        summary: 'Verify payment signature and confirm booking',
        tags: ['Payments'],
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { 200: { description: 'Booking permanently confirmed and ticket issued' } },
      },
    },
    '/tickets/{id}': {
      get: {
        summary: 'Get electronic ticket with QR code',
        tags: ['Tickets'],
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { 200: { description: 'Electronic ticket details' } },
      },
    },
    '/tickets/validate': {
      post: {
        summary: 'Staff admission scan and ticket redemption',
        tags: ['Tickets'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Ticket validated successfully' } },
      },
    },
    '/admin/dashboard': {
      get: {
        summary: 'Admin dashboard analytics & KPIs',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Dashboard metrics and charts' } },
      },
    },
  },
};

export function setupSwagger(app: Express) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { background-color: #0f172a; }',
    customSiteTitle: 'CinePass API Documentation',
  }));
}
