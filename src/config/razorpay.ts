import Razorpay from "razorpay";
const keyId=process.env.RAZORPAY_KEY_ID;
const keySecret=process.env.RAZORPAY_KEY_SECRET;

if(!keyId || !keySecret){
    throw new Error("Razorpay_Key_id and Razorpay_key_secret must be configured.");
}

export const razorpay=new Razorpay({
    key_id:keyId,
    key_secret:keySecret
});