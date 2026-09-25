
const  {Pool} = require('pg');
const {drizzle}=require("drizzle-orm/node-postgres");

const pool=new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV==="production"
    ? {rejectUnauthorized: false}
    :false
});

export const db=drizzle({
    client:pool
});

export {pool};