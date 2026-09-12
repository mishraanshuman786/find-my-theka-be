require("dotenv/config");
const {db, pool}=require("./index");
const {users}=require("./schema");

async function testDatabase(){
    try{
        console.log(
      "DATABASE_URL:",
      process.env.DATABASE_URL
    );

    const result = await db
      .select()
      .from(users);

    console.log("Users:", result);
    }
    catch(error){
        console.error("Database Test Failed:",error);

    }
    finally{
        await pool.end();
    }
}

testDatabase();