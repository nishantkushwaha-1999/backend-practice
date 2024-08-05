import asyncHandler from "../utils/asyncHandler.js";
import ApiError from  "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return {accessToken, refreshToken};

    } catch (error) {
        throw new ApiError (500, "Something went wrong while generating tokens.");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const {fullName, email, username, password} = req.body;
    // console.log(req.body);

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "") || 
        [fullName, email, username, password].some((field) => field === undefined)
    ) {
        throw new ApiError(400, "All fields are required");
    };

    const existingUser = await User.findOne({ $or: [{ username }, { email }]});
    if (existingUser) {
        throw new ApiError(409, "User already exists!");
    };

    // console.log(req.files.avatar);
    if (req.files?.avatar === undefined) {
        throw new ApiError(400, "Avatar image is required");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    
    let coverImageLocalPath = "";
    try{
        coverImageLocalPath = req.files?.coverImage[0]?.path;
    } catch (error) {
        coverImageLocalPath = "";
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required");
    };

    const avatarImage = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatarImage) {
        throw new ApiError(400, "Avatar image is required");
    };

    const user = await User.create({
        fullName,
        avatar: avatarImage.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user.");
    };

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully.")
    );
});

const loginUser = asyncHandler(async (req, res) =>{
    const {email, password} = req.body;

    if (email === undefined || email === undefined) {
        throw new ApiError(400, "username or email is required");
    };

    const user = await User.findOne({email});
    // console.log(user)

    if (user === undefined) {
        throw new ApiError(404, "User does not exist");
    };

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    };

    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, 
                accessToken: accessToken, 
                refreshToken: refreshToken
            },
            "User logged In Successfully"
        )
    )

});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httponly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(
            200,
            {},
            "User logged out"
        )
    )
});

export {
    registerUser,
    loginUser,
    logoutUser
}