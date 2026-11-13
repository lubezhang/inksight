import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/app-config.module';
import { IdentityModule } from './modules/identity/identity.module';
import { UsersModule } from './modules/users/users.module';
import { DevicesModule } from './modules/devices/devices.module';
import { DeviceConfigModule } from './modules/device-config/device-config.module';
import { PairingModule } from './modules/pairing/pairing.module';
import { BillingModule } from './modules/billing/billing.module';
import { ModesModule } from './modules/modes/modes.module';
import { EnvironmentModule } from './modules/environment/environment.module';
import { ContentModule } from './modules/content/content.module';
import { RenderingModule } from './modules/rendering/rendering.module';
import { MediaModule } from './modules/media/media.module';
import { EngagementModule } from './modules/engagement/engagement.module';
import { VocabularyModule } from './modules/vocabulary/vocabulary.module';
import { VoiceModule } from './modules/voice/voice.module';
import { FirmwareModule } from './modules/firmware/firmware.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { PagesModule } from './modules/pages/pages.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    AppConfigModule,
    IdentityModule,
    UsersModule,
    DevicesModule,
    DeviceConfigModule,
    PairingModule,
    BillingModule,
    ModesModule,
    EnvironmentModule,
    ContentModule,
    RenderingModule,
    MediaModule,
    EngagementModule,
    VocabularyModule,
    VoiceModule,
    FirmwareModule,
    AnalyticsModule,
    NotificationsModule,
    JobsModule,
    PagesModule,
    HealthModule,
  ],
})
export class AppModule {}
