import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    //get the data
    // validate data
    // check files, thumnail, video 
    // upload them to cloudinary
    // create pipeline for the owner of video
    // create video object
    // check for video upload 
    // return response


    if(!(title && description)){
        throw new ApiError(400, "All fields are required")
    }

    const videoLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if(!videoLocalPath || !thumbnailLocalPath){
        throw new ApiError(401, "Files local path not found")
    }

    const video = uploadOnCloudinary(videoLocalPath)
    const thumbnail = uploadOnCloudinary(thumbnailLocalPath)

    const user = await User.findById(req.user?._id).select("-password -refreshToken")

    const owner = await User.aggregate([
        {
            $match: {
                owner: user
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "owner",
                foreignField: "_id",
                as: "videoOwner"
            }
        }
    ])

    const videoObject = await Video.create({
        title,
        description,
        videoFile: video.url,
        thumbnail: thumbnail.url,
        owner,
        isPublished: true,
        duration: video?.duration,
        views,
    }) 

    const videoUploaded = await Video.find(videoObject)
    if(!videoObject){
        throw new ApiError(400, "Video upload failed")
    }

    return res.status(200)
    .json(new ApiResponse(
        200,
        videoUploaded,
        "Video uploaded successfully"
    ))
   
})

const getVideoById = asyncHandler(async (req, res) => {
    //TODO: get video by id
    const { videoId } = req.params

    if(!videoId){
        throw new ApiError(400, "Invalid video URL")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video not found")
    }

    return res.status(200)
    .json(new ApiResponse(
        200,
        video,
        "Video has been retrieved"
    ))
    
})

const updateVideo = asyncHandler(async (req, res) => {
     //TODO: update video details like title, description, thumbnail
     
    const { videoId } = req.params
    const {title, description} = req.body

    const videoLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    const video = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!video){
        throw new ApiError(400, "Could not upload video on cloudinary")
    }
    if(!thumbnail){
        throw new ApiError(400, "Could not upload thumbnail file on cloudinary")
    }

    if(!videoId){
        throw new ApiError(400, "Invalid video URL")
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId, 
        {
            $set: {
                title: title,
                description: description,
                videoFile: video.url,
                thumbnail: thumbnail.url
            }
        },
        {
            new: true
        }
    )


    return res.status(200)
    .json(new ApiResponse(
        200,
        updatedVideo,
        "Video has been updated Successfully"
    ))

   

})

const deleteVideo = asyncHandler(async (req, res) => {
    //TODO: delete video
    const { videoId } = req.params

    if(!videoId){
        throw new ApiError(400, "Invalid video URL")
    }

    // optional mongoID format validation
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID format");
    }

    const deleteVideo = await Video.findByIdAndDelete(videoId)
    if(!deleteVideo){
        throw new ApiError(404, "Video not found")
    }

    return res.status(200)
    .json(new ApiResponse(
        200,
        "Video has been deleted successfully"
    ))
    
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}