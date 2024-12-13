const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'msgr',
  password: 'myDataBase123',
  port: 5432,
});

module.exports = pool;