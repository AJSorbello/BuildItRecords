const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Build It Records API',
      version: '1.0.0',
      description: 'API documentation for Build It Records music management system',
      contact: {
        name: 'API Support',
        email: 'support@builditrecords.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001/api',
        description: 'Development server'
      },
      {
        url: 'https://api.builditrecords.com',
        description: 'Production server'
      }
    ],
    tags: [
      {
        name: 'Admin',
        description: 'Administrative operations'
      },
      {
        name: 'Tracks',
        description: 'Track management operations'
      },
      {
        name: 'Albums',
        description: 'Album management operations'
      },
      {
        name: 'Artists',
        description: 'Artist management operations'
      },
      {
        name: 'Labels',
        description: 'Record label management operations'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>'
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'Optional API key for rate limiting and analytics'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message'
            },
            code: {
              type: 'string',
              description: 'Error code'
            },
            status: {
              type: 'integer',
              description: 'HTTP status code'
            },
            details: {
              type: 'object',
              description: 'Additional error details'
            }
          }
        },
        ValidationError: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Validation error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    description: 'Field that failed validation'
                  },
                  message: {
                    type: 'string',
                    description: 'Validation error message for the field'
                  }
                }
              }
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              description: 'Admin username'
            },
            password: {
              type: 'string',
              description: 'Admin password',
              format: 'password'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'JWT token'
            },
            username: {
              type: 'string',
              description: 'Admin username'
            },
            expiresIn: {
              type: 'string',
              description: 'Token expiration time'
            }
          }
        },
        Track: {
          type: 'object',
          required: ['name', 'artists'],
          properties: {
            id: {
              type: 'string',
              description: 'Track ID'
            },
            name: {
              type: 'string',
              description: 'Track name'
            },
            artists: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Artist'
              }
            },
            album: {
              $ref: '#/components/schemas/Album'
            },
            duration_ms: {
              type: 'integer',
              description: 'Track duration in milliseconds'
            },
            isrc: {
              type: 'string',
              description: 'International Standard Recording Code'
            },
            external_urls: {
              $ref: '#/components/schemas/ExternalUrls'
            }
          }
        },
        Artist: {
          type: 'object',
          required: ['name'],
          properties: {
            id: {
              type: 'string',
              description: 'Artist ID'
            },
            name: {
              type: 'string',
              description: 'Artist name'
            },
            bio: {
              type: 'string',
              description: 'Artist biography'
            },
            external_urls: {
              $ref: '#/components/schemas/ExternalUrls'
            }
          }
        },
        Album: {
          type: 'object',
          required: ['name', 'artists'],
          properties: {
            id: {
              type: 'string',
              description: 'Album ID'
            },
            name: {
              type: 'string',
              description: 'Album name'
            },
            artists: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Artist'
              }
            },
            release_date: {
              type: 'string',
              format: 'date',
              description: 'Album release date'
            },
            total_tracks: {
              type: 'integer',
              description: 'Total number of tracks'
            },
            label: {
              $ref: '#/components/schemas/RecordLabel'
            }
          }
        },
        RecordLabel: {
          type: 'object',
          required: ['name'],
          properties: {
            id: {
              type: 'string',
              description: 'Label ID'
            },
            name: {
              type: 'string',
              description: 'Label name'
            },
            description: {
              type: 'string',
              description: 'Label description'
            },
            website: {
              type: 'string',
              format: 'uri',
              description: 'Label website URL'
            },
            founded_year: {
              type: 'integer',
              description: 'Year the label was founded'
            }
          }
        },
        ExternalUrls: {
          type: 'object',
          properties: {
            spotify: {
              type: 'string',
              description: 'Spotify URL'
            },
            beatport: {
              type: 'string',
              description: 'Beatport URL'
            },
            soundcloud: {
              type: 'string',
              description: 'SoundCloud URL'
            }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              description: 'Array of items',
              items: {
                type: 'object'
              }
            },
            total: {
              type: 'integer',
              description: 'Total number of items'
            },
            limit: {
              type: 'integer',
              description: 'Number of items per page'
            },
            offset: {
              type: 'integer',
              description: 'Number of items to skip'
            },
            next: {
              type: 'string',
              description: 'URL for the next page',
              nullable: true
            },
            previous: {
              type: 'string',
              description: 'URL for the previous page',
              nullable: true
            }
          }
        }
      },
      parameters: {
        limitParam: {
          name: 'limit',
          in: 'query',
          description: 'Number of items to return per page',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20
          }
        },
        offsetParam: {
          name: 'offset',
          in: 'query',
          description: 'Number of items to skip',
          required: false,
          schema: {
            type: 'integer',
            minimum: 0,
            default: 0
          }
        },
        idParam: {
          name: 'id',
          in: 'path',
          description: 'Resource ID',
          required: true,
          schema: {
            type: 'string'
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationError'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js'], // Path to the API docs
};

module.exports = swaggerJsdoc(options);
