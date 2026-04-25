import { Module } from "@nestjs/common";
import { FirebaseModule } from "./firebase/firebase.module";
import { AgentModule } from "./modules/agent/agent.module";
import { AuthModule } from "./modules/auth/auth.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { ExecutionsModule } from "./modules/executions/executions.module";
import { GoalsModule } from "./modules/goals/goals.module";
import { GptActionsModule } from "./modules/gpt-actions/gpt-actions.module";
import { PlansModule } from "./modules/plans/plans.module";
import { RecommendationsModule } from "./modules/recommendations/recommendations.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
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
    GptActionsModule,
    ReviewsModule,
    RecommendationsModule,
  ],
})
export class AppModule {}
