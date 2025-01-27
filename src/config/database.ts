import { Sequelize, Options } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

let sequelize: Sequelize | null = null;

const config: Options = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: false
  },
  define: {
    underscored: true,
    underscoredAll: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  retry: {
    max: 3,
    match: [
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/
    ]
  }
};

export const createConnection = (): Sequelize => {
  if (sequelize) return sequelize;

  const dbName = process.env.DB_NAME || 'builditrecords';
  const dbUser = process.env.DB_USER || 'postgres';
  const dbPassword = process.env.DB_PASSWORD || 'postgres';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '5432');

  // Create connection URL with SSL disabled
  const connectionUrl = `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?sslmode=disable`;

  sequelize = new Sequelize(connectionUrl, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });

  return sequelize;
};

export const initializeDatabase = async (): Promise<void> => {
  try {
    const db = createConnection();
    await db.authenticate();
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

export const closeConnection = async (): Promise<void> => {
  if (sequelize) {
    try {
      await sequelize.close();
      console.log('Database connection closed.');
    } catch (error) {
      console.error('Error closing database connection:', error);
      throw error;
    }
  }
};

export const query = async (text: string, params?: any[]): Promise<{ rows: any[] }> => {
  try {
    const db = createConnection();
    const [results] = await db.query(text, {
      replacements: params,
      type: db.QueryTypes.SELECT
    });
    return { rows: results };
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
};

// Handle process termination gracefully
process.on('SIGINT', async () => {
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeConnection();
  process.exit(0);
});

export default {
  createConnection,
  initializeDatabase,
  closeConnection,
  query
};
