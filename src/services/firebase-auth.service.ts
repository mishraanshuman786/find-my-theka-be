import { getFirebaseAuth } from "../config/firebase";
import { userRepository } from "../repositories/user.repository";
import { generateToken, UserRole } from "../utils/jwt";
import { AppError } from "../utils/app-error";

interface LocalUser {
  id: number;
  name: string | null;
  email: string | null;
  password: string | null;
  phone: string | null;
  firebaseUid: string | null;
  role: UserRole;
  createdAt: string | null;
}

interface UserRepository {
  findByFirebaseUid(
    firebaseUid: string
  ): Promise<LocalUser | undefined>;

  findByEmail(
    email: string
  ): Promise<LocalUser | undefined>;

  updateFirebaseUid(
    userId: number,
    firebaseUid: string
  ): Promise<LocalUser | undefined>;

  createUser(data: {
    name?: string | null;
    email?: string | null;
    password?: string | null;
    phone?: string | null;
    firebaseUid?: string | null;
  }): Promise<LocalUser>;
}

export class FirebaseAuthService {
  constructor(
    private readonly userRepo: UserRepository = userRepository
  ) {}

private async verifyFirebaseToken(idToken: string) {
  try {
    return await getFirebaseAuth().verifyIdToken(idToken);
  } catch {
    throw new AppError("Invalid Firebase ID token", 401);
  }
}

  async authenticate(idToken: string) {
    const decodedToken = await this.verifyFirebaseToken(idToken);

    /*
     * 1. Check whether this Firebase UID is already linked
     *    to a local user.
     */
    const existingFirebaseUser =
      await this.userRepo.findByFirebaseUid(decodedToken.uid);

    let user: LocalUser;

    if (existingFirebaseUser) {
      user = existingFirebaseUser;
    } else {
      /*
       * 2. Firebase authentication is email based.
       *
       * We intentionally DO NOT use:
       * - decodedToken.phone_number
       * - userRepo.findByPhone()
       *
       * The local phone field remains independent from
       * Firebase authentication.
       */
      const firebaseEmail = decodedToken.email
        ?.trim()
        .toLowerCase();

      const verifiedEmail =
        firebaseEmail &&
        decodedToken.email_verified === true
          ? firebaseEmail
          : null;

      /*
       * Firebase users must have a verified email.
       */
      if (!verifiedEmail) {
  throw new AppError(
    "Firebase account has no verified email",
    401,
  );
}

      /*
       * 3. Check whether a normal local email/password
       *    account already exists.
       */
      const existingEmailUser =
        await this.userRepo.findByEmail(verifiedEmail);

      if (existingEmailUser) {
        /*
         * 4. Link Firebase UID to existing local account.
         *
         * Existing phone value is preserved.
         */
        const linkedUser =
          await this.userRepo.updateFirebaseUid(
            existingEmailUser.id,
            decodedToken.uid
          );

       if (!linkedUser) {
  throw new AppError("Failed to link Firebase account", 500);
}

        user = linkedUser;
      } else {
        /*
         * 5. Create a new Firebase/Google user.
         *
         * Phone is deliberately NULL.
         */
        user = await this.userRepo.createUser({
          name: decodedToken.name ?? null,
          email: verifiedEmail,
          password: null,
          phone: null,
          firebaseUid: decodedToken.uid,
        });
      }
    }

    /*
     * 6. Generate the application's JWT.
     */
    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    return {
      user,
      token,
    };
  }
}

export const firebaseAuthService =
  new FirebaseAuthService();