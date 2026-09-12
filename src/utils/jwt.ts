import jwt, {  JwtPayload } from "jsonwebtoken";

export interface AuthTokenPayload extends JwtPayload{
    userId:number;
    email:string;
    name:string;
}

const JWT_SECRET=process.env.JWT_SECRET ||  "findmytheka-secret-key-2024";

const JWT_EXPIRES_IN = "7d";

export function generateToken(user:{
    id:number,
    email:string,
    name:string
}){
    const payload:AuthTokenPayload={
        userId:user.id,
        email:user.email,
        name:user.name
    }

    return jwt.sign(payload,JWT_SECRET,{expiresIn: JWT_EXPIRES_IN});
}


export function verifyToken(token:string): AuthTokenPayload | {error:string}{
    try{
         return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    }
    catch(error){
        if(error instanceof jwt.TokenExpiredError){
            return { error:"Token Expired"}
        }

        return {
            error:"Invalid Token!"
        }
    }


}

