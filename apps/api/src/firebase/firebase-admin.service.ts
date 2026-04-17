import { Injectable, OnModuleInit } from "@nestjs/common";
import { App, applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";
import { Firestore, getFirestore } from "firebase-admin/firestore";

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private app!: App;
  private firestore!: Firestore;
  private auth!: Auth;

  onModuleInit() {
    if (!getApps().length) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
      const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

      this.app =
        projectId && clientEmail && privateKey
          ? initializeApp({
              credential: cert({
                projectId,
                clientEmail,
                privateKey,
              }),
              storageBucket,
            })
          : initializeApp({
              credential: applicationDefault(),
              projectId,
              storageBucket,
            });
    } else {
      this.app = getApps()[0]!;
    }

    this.firestore = getFirestore(this.app);
    this.auth = getAuth(this.app);

    if (process.env.FIRESTORE_EMULATOR_HOST) {
      this.firestore.settings({ ignoreUndefinedProperties: true });
    }
  }

  getFirestore() {
    return this.firestore;
  }

  getAuth() {
    return this.auth;
  }
}

