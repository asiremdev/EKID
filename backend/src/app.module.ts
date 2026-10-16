import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './modules/audit/audit.module';
import { MailModule } from './modules/mail/mail.module';
import { AuthModule } from './modules/auth/auth.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { UsersModule } from './modules/users/users.module';
import { ChildrenModule } from './modules/children/children.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { StarsModule } from './modules/stars/stars.module';
import { UnlocksModule } from './modules/unlocks/unlocks.module';
import { XpModule } from './modules/xp/xp.module';
import { StreaksModule } from './modules/streaks/streaks.module';
import { AchievementsModule } from './modules/achievements/achievements.module';
import { ChallengesModule } from './modules/challenges/challenges.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ProtectionModule } from './modules/protection/protection.module';
import { PairingModule } from './modules/pairing/pairing.module';
import { GamesModule } from './modules/games/games.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10) * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT ?? '120', 10),
      },
    ]),
    PrismaModule,
    AuditModule,
    MailModule,
    AuthModule,
    SubscriptionsModule,
    UsersModule,
    ChildrenModule,
    ActivitiesModule,
    XpModule,
    StreaksModule,
    AchievementsModule,
    ChallengesModule,
    UnlocksModule,
    StarsModule,
    AnalyticsModule,
    ProtectionModule,
    PairingModule,
    GamesModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
