import sequelize from '../backend/src/config/database';
import { RekamMedis } from '../backend/src/models/RekamMedis';

async function testConnection() {
  console.log('RekamMedis model:', RekamMedis);
  console.log('Testing connection to database using Sequelize...');
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    console.log('Registered models:', Object.keys(sequelize.models));
    console.log('Syncing RekamMedis model...');
    await sequelize.sync({ force: false });
    console.log('RekamMedis model synced successfully.');
    
    // Check if the table and indexes were created successfully
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    console.log('Tables in public schema:', tables);

    const [results] = await sequelize.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename ILIKE 'rekammedis';
    `);
    
    console.log('Created indexes:');
    console.log(JSON.stringify(results, null, 2));

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

testConnection();
