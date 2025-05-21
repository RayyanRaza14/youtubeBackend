import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";



dotenv.config({path: "./.env"})


connectDB()
.then(()=>{
    app.on("Error", (err)=>{
        console.error(err)
        throw err
    })
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running on port ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("Mongo db connection failed!", err)
})




 
//  ;(
//     async ()=>{
//         try {
//             await mongoose.connect(`${process.env.MONGO_URL}/${DB_name}`)

//             app.on("error", (error)=>{
//                 console.log(error)
//                 throw error
//             })

//             app.listen(process.env.PORT, ()=>{
//                 console.log(`Server is running on port ${process.env.PORT}`)
//             })
//         } catch (error) {
//             console.error("Error", error)
//             throw error
//         }
//     }
//  )()