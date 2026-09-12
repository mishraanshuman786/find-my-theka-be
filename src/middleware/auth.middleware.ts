import {NextFunction, Request, Response} from "express";

import { verifyToken, AuthTokenPayload } from "../utils/jwt";

declare global{
    namespace Express{
        interface Request{
            user?: AuthTokenPayload
        }
    }
}

// Required Authentication middleware
export function authMiddleware(req:Request, res:Response, next:NextFunction){
    const authHeader=req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({
            success:false,
            message:"Access Denied. No Token Provided!"
        });
    }

    const token=authHeader.substring(7);

    const decoded=verifyToken(token);

    if("error" in decoded){
        return res.status(401).json({
            success:false,
            message:decoded.error
        })
    }

    req.user=decoded;

    next();

}

// optional authentication middleware
// if no token request continues
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader =
    req.headers.authorization;

  if (
    authHeader &&
    authHeader.startsWith("Bearer ")
  ) {
    const token =
      authHeader.substring(7);

    const decoded =
      verifyToken(token);

    if (!("error" in decoded)) {
      req.user = decoded;
    }
  }

  next();
}

