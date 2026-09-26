require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 5000;

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'your_db_user',
  password: process.env.DB_PASSWORD || 'your_db_password',
  database: process.env.DB_NAME || 'your_database_name',
  waitForConnections: true,
  connectionLimit: 10,
};

const pool = mysql.createPool(dbConfig);

async function testDatabaseConnection() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS solution');
    console.log('MySQL connection successful. Test query result:', rows[0].solution);
    return true;
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
    return false;
  }
}

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('HelloHacks backend is running');
});

app.get('/db-status', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({
      connected: true,
      database: dbConfig.database,
      status: 'connected',
      result: rows[0],
    });
  } catch (error) {
    res.status(500).json({
      connected: false,
      database: dbConfig.database,
      status: 'not_connected',
      error: error.message,
    });
  }
});

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await testDatabaseConnection();
});
