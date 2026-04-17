import { Body, Controller, Get, Headers, Module, Post } from "@nestjs/common";
import { IsEmail, IsString, MinLength } from "class-validator";
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

  @Get("me")
  async me(@Headers("authorization") authorization?: string) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.getCurrentUser(userId);
  }
}

@Module({
  controllers: [AuthController],
})
export class AuthModule {}
