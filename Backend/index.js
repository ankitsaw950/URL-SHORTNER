import express from "express"
import dotenv from "dotenv"
import connectDB from "./src/config/db.js"
import redisClient from "./src/config/redis.js"

dotenv.config()

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))



connectDB().then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server running on http://localhost:${process.env.PORT}`)
    })
})


app.get("/",(req,res)=>{
    res.send("Hello Ankit ji")
})


app.get("/demo",async (req,res)=>{
    await redisClient.set("demoKey","Working");
    const value = await redisClient.get("demoKey");
    res.send({redisValue: value })
})



import urlRoutes from "./src/routes/url.routes.js"
import analyticsRoutes from "./src/routes/analytics.routes.js"

app.use("/api/url",urlRoutes)
app.use("/api/stats",analyticsRoutes)
