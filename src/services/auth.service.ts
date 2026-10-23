import brcypt from "bcryptjs";
import { AppError } from "../utils/app-error";
import { userRepository } from "../repositories/user.repository";

import { generateToken } from "../utils/jwt";

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
}

interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  async register(data: RegisterData) {
    const email = data.email.trim().toLowerCase();

    // check existing user
    const existingUser = await userRepository.findByEmail(email);

    if (existingUser) {
       throw new AppError("User already exists!", 409);
    }

    // Hash Password
    const hashedPassword = await brcypt.hash(data.password, 10);

    // create user
    const user = await userRepository.createUser({
      name: data.name,
      email,
      password: hashedPassword,
      phone: data.phone ?? null,
    });

    const token=generateToken({
        id:user.id,
        name:user.name,
        email:user.email,
        role:user.role
    })

    return {
        user, token
    }
  }

  async login(data: LoginData) {
    const email = data.email.trim().toLowerCase();

    // Find User
    const user = await userRepository.findByEmail(email);

    if (!user) {
       throw new AppError("Invalid email or password!", 401);
    }

    // verify password
    const passwordValid = await brcypt.compare(data.password, user.password);

    if (!passwordValid) {
        throw new AppError("Invalid email or password!", 401);
    }

    // Generate JWT Token
    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  }

//   get current users Profile
   async getCurrentProfile(userId:number){
    const user=await userRepository.findById(userId);

    if(!user){
       throw new AppError("User not found!", 404);
    }

    return {
        id:user.id,
        name:user.name,
        email:user.email,
        phone:user.phone,
        role: user.role,
        created_at:user.createdAt
    };


   }
}


export const authService=new AuthService();