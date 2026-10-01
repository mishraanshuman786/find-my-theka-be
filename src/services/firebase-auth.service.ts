import { getFirebaseAuth } from "../config/firebase";
import { userRepository } from "../repositories/user.repository";
import { generateToken } from "../utils/jwt";

interface LocalUser {
  id: number;
  name?: string | null;
  email?: string | null;
  password?: string | null;
  phone?: string | null;
  firebaseUid?: string | null;
  createdAt?: string | null;
}

interface UserRepository {
  findByFirebaseUid(
    firebaseUid: string
  ): Promise<LocalUser | undefined>;

  findByEmail(
    email: string
  ): Promise<LocalUser | undefined>;

  findByPhone(
    phone: string
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

  async verifyFirebaseToken(idToken: string) {
    return getFirebaseAuth().verifyIdToken(idToken);
  }

  async authenticate(idToken: string) {
    const decodedToken =
      await this.verifyFirebaseToken(idToken);

    // 1. Check whether this Firebase UID is already linked.
    const existingFirebaseUser =
      await this.userRepo.findByFirebaseUid(
        decodedToken.uid
      );

    let user: LocalUser;

    if (existingFirebaseUser) {
      user = existingFirebaseUser;
    } else {
      // 2. Get Firebase identities.
      const firebaseEmail =
        decodedToken.email?.trim().toLowerCase();

      const firebasePhone =
        decodedToken.phone_number;

      // Only trust the email when Firebase says it is verified.
      const verifiedEmail =
        firebaseEmail &&
        decodedToken.email_verified === true
          ? firebaseEmail
          : null;

      let existingEmailUser:
        | LocalUser
        | undefined;

      let existingPhoneUser:
        | LocalUser
        | undefined;

      // 3. Find existing account by verified email.
      if (verifiedEmail) {
        existingEmailUser =
          await this.userRepo.findByEmail(
            verifiedEmail
          );
      }

      // 4. Find existing account by Firebase phone.
      if (firebasePhone) {
        existingPhoneUser =
          await this.userRepo.findByPhone(
            firebasePhone
          );
      }

      // 5. Prevent accidental account merging.
      if (
        existingEmailUser &&
        existingPhoneUser &&
        existingEmailUser.id !==
          existingPhoneUser.id
      ) {
        throw new Error(
          "Firebase email and phone belong to different accounts"
        );
      }

      // 6. Existing local account found.
      const existingUser =
        existingEmailUser ?? existingPhoneUser;

      if (existingUser) {
        const linkedUser =
          await this.userRepo.updateFirebaseUid(
            existingUser.id,
            decodedToken.uid
          );

        if (!linkedUser) {
          throw new Error(
            "Failed to link Firebase account"
          );
        }

        user = linkedUser;
      } else {
        // 7. No existing account.
        //
        // We need at least one trusted Firebase
        // identity before creating a local user.
        if (!verifiedEmail && !firebasePhone) {
          throw new Error(
            "Firebase account has no verified identity"
          );
        }

        user = await this.userRepo.createUser({
          name: decodedToken.name ?? null,
          email: verifiedEmail,
          password: null,
          phone: firebasePhone ?? null,
          firebaseUid: decodedToken.uid,
        });
      }
    }

    // 8. Generate the same application JWT
    // used by normal email/password authentication.
    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
    });

    return {
      user,
      token,
    };
  }
}

export const firebaseAuthService =
  new FirebaseAuthService();

