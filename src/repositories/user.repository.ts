import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

export class UserRepository {
  // create new user
  async createUser(data: {
  name?: string | null;
  email?: string | null;
  password?: string | null;
  phone?: string | null;
  firebaseUid?: string | null;
}) {
    const [user] = await db
    .insert(users)
    .values({
      name: data.name ?? null,
      email: data.email ?? null,
      password: data.password ?? null,
      phone: data.phone ?? null,
      firebaseUid: data.firebaseUid ?? null,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      password: users.password,
      phone: users.phone,
      firebaseUid: users.firebaseUid,
      createdAt: users.createdAt,
    });

  return user;
  }

  // find user by email
  async findByEmail(email: string) {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        password: users.password,
        phone: users.phone,
        firebaseUid: users.firebaseUid,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user;
  }

  // find users by FirebaseId
  async findByFirebaseUid(firebaseUid: string) {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        password: users.password,
        phone: users.phone,
        firebaseUid: users.firebaseUid,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.firebaseUid, firebaseUid))
      .limit(1);

    return user;
  }

  // find user by phone
  async findByPhone(phone:string){
    const [user]=await db.select({
      id:users.id,
      name:users.name,
      email:users.email,
      password:users.password,
      phone:users.phone,
      firebaseUid:users.firebaseUid,
      createdAt:users.createdAt
    }).from(users).where(eq(users.phone, phone)).limit(1);

    return user;
  }



  // find user by id
  async findById(id: number) {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user;
  }

  // update the password of existing user
  async updatePassword(userId: number, hashedPassword: string) {
    const [user] = await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId))
      .returning();

    return user;
  }

  // update firebaseUid for existing user
  async updateFirebaseUid(userId: number, firebaseUid: string) {
    const [user] = await db
      .update(users)
      .set({
        firebaseUid,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        firebaseUid: users.firebaseUid,
        createdAt: users.createdAt,
      });

    return user;
  }
}

export const userRepository = new UserRepository();
