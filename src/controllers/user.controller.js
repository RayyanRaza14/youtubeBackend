import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"


const generateAccessANDRefreshToken = async (userId)=> {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token")
    }

}


const registerUser = asyncHandler(async (req, res)=> {
   const {username, email, fullname, password} = req.body
//    console.log(username, fullname)
    // console.log("Request Body :",req.body)
   if(
    [username, email, fullname, password].some((field)=> field?.trim() === "" )
   ){
    throw new ApiError(400, "All fields are necessary")
   }

   const existedUser = await User.findOne({
    $or: [{ username },{ email }]
   })
   if(existedUser){
    throw new ApiError(409, "username and email already exist!")
   }

   const avatarLocalPath  = req.files?.avatar[0]?.path
//    const coverImageLocalPath = req.files?.coverImage[0]?.path

   let coverImageLocalPath;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
   }

   if(!avatarLocalPath){
    throw new ApiError(408, "Avatar file is required")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if(!avatar){
    throw new ApiError(407, "Avatar is missing ")
   }

   const user = await User.create({
    username: username.toLowerCase(),
    email,
    password,
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
   })

   const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
   )

   if (!createdUser){
    throw new ApiError(500, "User not created")
   }

   return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered Successfully")
   )


   


})

const loginUser = asyncHandler(async(req, res)=>{
    const {username, email, password} = req.body

    if(!(username || email)){
        throw new ApiError(401, "username or email is required")
    }

    if([username, password].some((field)=> field?.trim() === "")){
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })
    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid User Credentials")
    }

    const {accessToken, refreshToken} = await generateAccessANDRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )


})

const logoutUser = asyncHandler(async(req, res)=> {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User Logged out")
    )

})


const refreshAccessToken = asyncHandler(async(req, res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401, "unauhtorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid Refresh Token")
        }
        
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh Token expired or used")
        }
    
        const {accessToken, newRefreshToken} = generateAccessANDRefreshToken(user._id)
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
    
        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access Token Refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access")
    }
})


const changePassword = asyncHandler(async(req, res)=> {
    const {oldPassword, newPassword} = req.body

    const user = await User?.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid old password")
    }

    user.password = newPassword
    user.save({validateBeforeSave: false})

    return res.status(200)
    .json(
        new ApiResponse(
            200, 
            {},
            "Password has been changed successfully"
        )
    )
})


// const getCurrentUser = asyncHandler(async(req, res)=>{
//     const user = await User.findById(req.user?._id).select("-password -refreshToken")

//     if(!user){
//         throw new ApiError(401, "The user is not currently logged in")
//     }

//     return res.status(200)
//     .json(
//         new ApiResponse(
//             200,
//             currentUser,
//             "Here is your current user"
//         )
//     )
// })

const getCurrentUser = asyncHandler(async(req, res)=>{
    return res.status(200)
    .json(
        new ApiResponse(
            200,
            req.user,
            "Current user fetched successfully"
        )
    )
})


const updateAccountDetails = asyncHandler(async(req, res)=>{
    const {fullname, email} = req.body

    if(!fullname || !email){
        throw new ApiError(401,"Fullname or Email not found")
    }

    const user  =await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname: fullname,
                email: email
            }
        },
        {
            new: true
        }
    )

    // const user = await User.findById(req.user?._id).select("-password -refreshToken")
    // if(!user){
    //     throw new ApiError(404, "User not found")
    // }
    // user.fullname = fullname
    // user.email = email
    // await user.save({validateBeforeSave: false})

    return res.status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Information updated successfully"
        )
    )

    
})


const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar path not found")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400, "Error while uploading avatar on cloudinary")
    }

    // const user = await User.findById(req.user?._id).select("-password -refreshToken")
    // user.avatar = avatar.url
    // user.save({validateBeforeSave: false})

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res.status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Avatar has been changed Successfully"
        )
    )
})


const updateUserCoverImage = asyncHandler(async(req, res)=>{
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover Image path not found")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading cover image on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res.status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Cover Image has been successfully changed"
        )
    )
})


const getUserChannel = asyncHandler(async(req, res)=>{
    const {username} = req.params

    if(username?.trim()){
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username.toLowerCase()
            },
            
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    if: {$in: [req?.user._id, "$subscribers.subscribe"]}
                }
            }
        },
        {
            $project: {
                username: 1,
                email: 1,
                fullname: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404, "Channel not found")
    }

    return res.status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})


const getWatchHistory = asyncHandler(async(req, res)=> {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistroy",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                   $project: {
                                    username: 1,
                                    fullname: 1,
                                    avatar: 1,
                                   }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200)
    .json(new ApiResponse(
        200,
        user[0].watchHistory, 
        "Fetched user's watch history"
    ))
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannel,
    getWatchHistory

}