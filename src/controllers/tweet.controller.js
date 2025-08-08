import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    // get the data
    // validate the data
    //create the tweet object
    // validate tweet 
    // return the response

    const { content } = req.body

    if(!content){
        throw new ApiError(404, "No content found")
    }

    const user = await User.findById(req.user?._id).select("-password -refreshToken")

    const tweet = await Tweet.create({
        owner: user._id,
        content
    })

    if(!tweet){
        throw new ApiError(404, "Error while adding tweet")
    }

    return res.status(200
        .json(new ApiResponse(
            200,
            tweet,
            "Tweeted Successfully"
        ))
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    // get the user id
    // validate the id
    // search for the tweets on basis of user id
    // return the response

    const { userId } = req.params

    if(!userId){
        throw new ApiError(404, "User not found")
    }

    const tweets = await Tweet.find({owner: userId}).sort({ created: -1})
   
    if(!tweets){
        throw new ApiError(404, "No record found")
    }

    return res.status(200)
    .json(new ApiResponse(
        200,
        tweets,
        "User tweets retrieved successfully"
    ))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params
    const { content } = req.body

    if(!tweetId){
        throw new ApiError(404, "Tweet Id not found")
    }
    if(!content){
        throw new ApiError(404, "Content not found")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId,
        {
            $set : {
                content: content
            }
        },
        {
            new: true
        }
    )

    if(!updatedTweet){
        throw new ApiError(400, "Erro updating tweet")
    }

    return res.status(200)
    .json(new ApiResponse(
        200,
        updatedTweet,
        "Tweet updated successfully"
    ))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params

    if(!tweetId){
        throw new ApiError(404, "Video Id not found")
    }

    await Tweet.findByIdAndDelete(tweetId)


    return res.status(200)
    .json(new ApiResponse(
        200,
        "Tweet deleted Successfully"
    ))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}