import {NextFunction, Request, Response} from "express";
import type { UserRole } from "../utils/jwt";

export function authorizeRoles(...allowedRoles:UserRole[]){
    return (req:Request, res:Response, next:NextFunction)=>{
        // authModdleware must run before this middleware
        if(!req.user){
            return res.status(401).json({
                success:false,
                message:"Authentication Required!"
            });
        }

        if(!allowedRoles.includes(req.user.role)){
            return res.status(403).json({
                success:false,
                message:"Forbidden: insufficient permissions",
            });


        }

        return next();
    }
}