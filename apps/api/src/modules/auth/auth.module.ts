import { Body, Controller, Get, Headers, Module, Patch, Post } from "@nestjs/common";
import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from "class-validator";
import { FirebaseDataService } from "../../firebase/firebase-data.service";

class RegisterDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

class GoogleLoginDto {
  @IsString()
  credential!: string;
}

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  energyPattern?: string;

  @IsOptional()
  @IsString()
  workStyle?: string;

  @IsOptional()
  @IsString()
  studyStyle?: string;

  @IsOptional()
  @IsString()
  sleepSchedule?: string;

  @IsOptional()
  @IsBoolean()
  onboardingCompleted?: boolean;
}

@Controller("auth")
class AuthController {
  constructor(private readonly database: FirebaseDataService) {}

  @Post("register")
  register(@Body() payload: RegisterDto) {
    return this.database.register(payload);
  }

  @Post("login")
  login(@Body() payload: LoginDto) {
    return this.database.login(payload);
  }

  @Post("google")
  google(@Body() payload: GoogleLoginDto) {
    return this.database.loginWithGoogle(payload.credential);
  }

  @Get("me")
  async me(@Headers("authorization") authorization?: string) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.getCurrentUser(userId);
  }

  @Patch("profile")
  async updateProfile(@Headers("authorization") authorization: string | undefined, @Body() payload: UpdateProfileDto) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.updateCurrentProfile(userId, payload);
  }
}

@Module({
  controllers: [AuthController],
})
export class AuthModule {}
