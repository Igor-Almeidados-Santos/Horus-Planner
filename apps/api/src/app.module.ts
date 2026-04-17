import { Module } from "@nestjs/common";
import { FirebaseModule } from "./firebase/firebase.module";
import { AgentModule } from "./modules/agent/agent.module";
import { AuthModule } from "./modules/auth/auth.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { ExecutionsModule } from "./modules/executions/executions.module";
import { GoalsModule } from "./modules/goals/goals.module";
import { PlansModule } from "./modules/plans/plans.module";
import { RoutinesModule } from "./modules/routines/routines.module";
import { TasksModule } from "./modules/tasks/tasks.module";

@Module({
  imports: [
    FirebaseModule,
    AuthModule,
    GoalsModule,
    PlansModule,
    RoutinesModule,
    TasksModule,
    ExecutionsModule,
    DashboardModule,
    AgentModule,
  ],
})
export class AppModule {}
