import { Controller, Get, Headers, Module } from "@nestjs/common";
import { FirebaseDataService } from "../../firebase/firebase-data.service";

@Controller("dashboard")
class DashboardController {
  constructor(private readonly database: FirebaseDataService) {}

  @Get("today")
  async today(@Headers("authorization") authorization?: string) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.getDashboardToday(userId);
  }

  @Get("week")
  async week(@Headers("authorization") authorization?: string) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.getDashboardWeek(userId);
  }

  @Get("metrics")
  async metrics(@Headers("authorization") authorization?: string) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.getMetrics(userId);
  }

  @Get("workspace")
  async workspace(@Headers("authorization") authorization?: string) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.getWorkspaceData(userId);
  }
}

@Module({
  controllers: [DashboardController],
})
export class DashboardModule {}
