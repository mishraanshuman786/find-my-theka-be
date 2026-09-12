import {eq} from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

export class UserRepository{
    async createUser(data:{
        name:string,
        email:string,
        password:string,
        phone?:string | null
    }){
        const [user]=await db.insert(users).values({
            name:data.name,
            email:data.email,
            password:data.password,
            phone:data.phone ??null
        })
        .returning({
            id:users.id,
            name:users.name,
            email:users.email,
            phone:users.phone,
            createAt:users.createdAt
        });

        return user;
    }

    async findByEmail(email:string){
          const [user]=await db.select({
            id:users.id,
            name:users.name,
            email:users.email,
            password:users.password,
            phone:users.phone,
            createdAt:users.createdAt
          }).from(users)
          .where(eq(users.email,email))
          .limit(1);

          return user;
    }

    async findById(id:number){
        const [user]=await db.select({
            id:users.id,
            name:users.name,
            email:users.email,
            phone:users.phone,
            createAt:users.createdAt
        }).from(users)
        .where(eq(users.id,id))
        .limit(1);

        return user;
    }
}

export const userRepository=new UserRepository();