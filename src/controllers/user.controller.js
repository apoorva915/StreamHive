import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";

const registerUser=asyncHandler(async(req, res)=>{

    //steps:
    // 1)get user details from frontend
    // 2)validation - not empty
    // 3)check if user already exists: username, email
    // 4)check for images, check for avatar
    // 5)upload them to cloudinary, avatar
    // 6)create user object - create entry in db
    // 7)remove password and refresh token field from response
    // 8)check for user creation
    // 9)return res


    //get user details from frontend
    const{fullName,email, username, password}=req.body
    console.log("email",email);

    //validation
    if(
        [fullName,email,username,password].some((field)=>
        field?.trim()==="")
    ){
        throw new ApiError("All fields are required",400)
    }

    //check if user already exists
    const existedUser= User.findOne({
        $or:[{username},{email}]
    })

    if(existedUser){
        throw new ApiError("User with email or username already exists",409)
    }

    //check for images, check for avatar
    const avatarLocalPath= req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError("Avatar is required",400);
    }

    //upload them to cloudinary, avatar
    const avatar= await uploadOnCloudinary(avatarLocalPath);
    const coverImage= await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400,"Avatar file is required");
    }

    //create user object - create entry in db
    const user= await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    //remove password and refresh token field from response and check for user creation

    const createdUser= await User.findByIdAndUpdate(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    //return res
    return res.status(201).json(
        new ApiResponse(200,createdUser, "User registered successfully")
    )


})

export {registerUser}