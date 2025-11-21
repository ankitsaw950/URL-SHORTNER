import {createClient} from "redis"

const redisClient = createClient({
    url : process.env.REDIS_URL || "redis://127.0.0.1:6379"
})


redisClient.on("error",(err)=>{
    console.error("🔴 Redis Error:", err);
})

const connectRedis = async()=>{
    try {
        await redisClient.connect()
        console.log("🟢 Redis Connected");
        
    } catch (error) {
        console.error("🔴 Redis Connection failed:", err);
        
    }
}

connectRedis()

export default redisClient;