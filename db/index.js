import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
// import util from "util";

const connectDB = async () => {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
        // console.log(`\n MongoDB connected !! DB HOST: ${util.inspect(connectionInstance, false, null, true /* enable colors */)}`);
    }
    catch (error) {
        console.log("MongoDB connection error", error);
        process.exit(1);
    }
}

export default connectDB