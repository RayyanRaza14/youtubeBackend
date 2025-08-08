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


    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)

    const matchStage = {
        isPublished: true,
    }

    if(query){
        matchStage.title = {$regex: query, $options: 1}
    }

    if(userId){
        matchStage.owner = new mongoose.Types.ObjectId(userId)
    }


    const sortStage = {
        [sortBy || "createdAt"]: sortType === "asc" ? 1 : -1,
    }

    const aggregate = Video.aggregate([
        {
            $match: matchStage
        },
        {
            $sort: sortStage
        }
    ])


    const options = {
        page: pageNum,
        limit: limitNum

    }

    const result = await Video.aggregatePaginate(aggregate, options)


    return res.status(200)
    .json(new ApiResponse(
        200,
        result,
        "All videos retrieved successfully"
    ))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    //get the data
    // validate data
    // check files, thumnail, video 
    // upload them to cloudinary
    // create video object
    // check for video upload 
    // return response


    if(!(title && description)){
        throw new ApiError(400, "All fields are required")
    }

    const videoLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if(!videoLocalPath || !thumbnailLocalPath){
        throw new ApiError(404, "Files local path not found")
    }

    const video = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!video.url || !thumbnail.url || !video.duration){
        throw new ApiError(500, "Cloudinary upload failed")
    }

    const user = await User.findById(req.user?._id).select("-password -refreshToken")

    const owner = user._id

    const videoObject = await Video.create({
        title,
        description,
        videoFile: video.url,
        thumbnail: thumbnail.url,
        owner,
        isPublished: true,
        duration: video?.duration,
        views: 0,
    }) 

    // const videoUploaded = await Video.find(videoObject)
    // if(!videoObject){
    //     throw new ApiError(400, "Video upload failed")
    // }

    return res.status(200)
    .json(new ApiResponse(
        200,
        videoObject,
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

    let thumbnail

    if(!videoId){
        throw new ApiError(400, "Invalid video URL")
    }

   if(req.file){
     const thumbnailLocalPath = req.file?.path

    if(!thumbnailLocalPath){
        throw new ApiError(404, "Thumbnail local path not found")
    }
    

    thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!thumbnail){
        throw new ApiError(400, "Could not upload thumbnail file on cloudinary")
    }
   }

    const updateData = {}

    if(title) updateData.title = title
    if(description) updateData.description = description
    if(thumbnail) updateData.thumbnail = thumbnail.url

    

    const updatedVideo = await Video.findByIdAndUpdate(videoId, 
        {
            $set: updateData
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
    if (!isValidObjectId(videoId)) {
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

    if(!videoId){
        throw new ApiError(404, "Video Id not found")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video not found")
    }

    video.isPublished = !video.isPublished
    await video.save()

   

    return res.status(200)
    .json(new ApiResponse(
        200,
        video,
        `Video is ${video.isPublished? "published": "unpublished"} successfully`
    ))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}