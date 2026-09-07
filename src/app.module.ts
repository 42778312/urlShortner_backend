import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { UrlsModule } from './urls/urls.module';
import { RedirectModule } from './redirect/redirect.module';
import { HealthModule } from './health/health.module';
import { Url } from './urls/entities/url.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database:
        process.env.DATABASE_PATH === ':memory:'
          ? ':memory:'
          : join(process.cwd(), process.env.DATABASE_PATH ?? 'data/database.sqlite'),
      entities: [Url],
      synchronize: true,
    }),
    UrlsModule,
    RedirectModule,
    HealthModule,
  ],
})
export class AppModule {}
