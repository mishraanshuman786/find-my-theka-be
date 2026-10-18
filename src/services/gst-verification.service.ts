import { redis } from "../config/redis";
import { gstValidationService } from "./gst-validation.service";

const VERIFICATION_TTL = Number(
  process.env.GST_VERIFICATION_TTL_SECONDS || 86400,
);

class GstVerificationService{
    async verifyGstin(userId:string, gstin:string){
        const normalizeGstin=gstin.trim().toUpperCase();

        const cacheKey=`gst:result:${normalizeGstin}`;
        const userKey=`gst:verified:${userId}:${normalizeGstin}`;

        // Reuse a previously successfull provider result
        const cachedResult=await redis.get(cacheKey);

        if(cachedResult){
            const result=JSON.parse(cachedResult);

            if(result.valid){
                const ttl=await redis.ttl(cacheKey);

                   if(ttl>0){
                await redis.set(userKey,"true","EX",ttl);
            }

            return result;
            }

         
        }

        // call the paid provider only when there is no valid cached result
        const result=await gstValidationService.validateGstin(normalizeGstin);

        // cache successfull verifications only
        if(result.valid){
            await redis.set(cacheKey,JSON.stringify(result),"EX",VERIFICATION_TTL);

            await redis.set(userKey,"true","EX",VERIFICATION_TTL);
        }

        return result;


    }


    async isVerified(userId:string, gstin:string):Promise<boolean>{
        const normalizedGstin=gstin.trim().toUpperCase();

        const userKey=`gst:verified:${userId}:${normalizedGstin}`;
        const cacheKey=`gst:result:${normalizedGstin}`;

        const [userVerification, cachedResult]=await Promise.all([
            redis.get(userKey),
            redis.get(cacheKey)
        ]);

        if(!userVerification || !cachedResult){
            return false;
        }

        const result=JSON.parse(cachedResult);
        return result.valid===true;
    }


}

export const gstVerificationService=new GstVerificationService();