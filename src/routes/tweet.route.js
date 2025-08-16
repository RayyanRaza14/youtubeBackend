import { Router } from "express";
import { 
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
 } from "../controllers/tweet.controller.js";
 import { upload } from "../middlewares/multer.middleware.js";

 import { verifyJWT } from "../middlewares/auth.middleware.js";

 const router = Router()


 router.use(verifyJWT)

 router.route('/').post(upload.none(), createTweet)
 router.route("/user/:userId").get(getUserTweets)
 router.route("/:tweetId").patch(updateTweet).delete(deleteTweet)


 export default router

