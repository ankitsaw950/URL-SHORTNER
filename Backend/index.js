import express from "express"
import dotenv from "dotenv"
import connectDB from "./src/config/db.js"

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
    res.send("Hello raja ji")
})


import urlRoutes from "./src/routes/url.routes.js"

app.use("/api/url",urlRoutes)
