import { Global, Module } from "@nestjs/common";
import { FirebaseAdminService } from "./firebase-admin.service";
import { FirebaseDataService } from "./firebase-data.service";

@Global()
@Module({
  providers: [FirebaseAdminService, FirebaseDataService],
  exports: [FirebaseAdminService, FirebaseDataService],
})
export class FirebaseModule {}
