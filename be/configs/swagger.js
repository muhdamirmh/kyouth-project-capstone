const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// Define the root information about your API
const options = {
    // 1. Root definition
    definition: {
        openapi: '3.0.0', // Specify OpenAPI version
        info: {
            title: 'Gemini Chatbot Website API Documentation',
            version: '1.0.0',
            description: 'API documentation for the backend service, including authentication, chat management, and data fetching.',
        },
        // 2. Define the server (for Postman/client testing)
        servers: [
            {
                url: '/api/v1', // Use the Nginx reverse proxy path
                description: 'Production/Development Server (via Nginx proxy)',
            },
            {
                url: 'http://localhost:3000/api/v1', // Direct backend URL for local testing
                description: 'Local Development Server',
            },
        ],
        // 3. Define Security Schemes (e.g., your X-Auth-Token)
        components: {
            securitySchemes: {
                // Name your security scheme
                AuthToken: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'x-auth-token', // The exact header name your API uses
                    description: 'Authorization header using the custom X-Auth-Token scheme.',
                },
            },
        },
    },
    // 4. Specify where the tool should look for JSDoc comments
    apis: [
        path.join(rootDir, 'routes', '*.js'), // Targets /root/routes/*.js
        path.join(rootDir, 'models', '*.js')  // Targets /root/models/*.js
    ],
};

const specs = swaggerJsdoc(options);
module.exports = specs;