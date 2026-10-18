import Redis from "ioredis";
import { error } from "node:console";
const redisUrl=process.env.REDIS_URL;

if(!redisUrl){
    throw new Error("REDIS_URL is not configured!");
}

export const redis=new Redis(redisUrl,{
    maxRetriesPerRequest:3,
    enableReadyCheck:true
});

redis.on("error",(error)=>{
   console.error("Redis connection error:", error.message);
})