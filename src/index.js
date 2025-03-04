import dotenv from "dotenv";
import connectDB from "./db/index.js";


dotenv.config({path: "./env"})


connectDB()




 
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