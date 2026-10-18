import {rateLimit} from "express-rate-limit";

export const gstRateLimiter=rateLimit({
    windowMs:15*60*1000,  // 15 minutes
    limit:5,  // Maximum 5 requests per ip
    standardHeaders:true,
    legacyHeaders:false,
    message:{
        success:false,
         message: "Too many GST verification attempts. Please try again after 15 minutes.",
    }

})