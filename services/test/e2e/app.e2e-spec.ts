import {
  Body,
  Controller,
  INestApplication,
  Module,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { IsInt, Min } from 'class-validator';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/common/configure-app';

class ProbeDto {
  @IsInt()
  @Min(1)
  count!: number;
}

@Controller('validation-probe')
class ValidationProbeController {
  @Post()
  create(@Body() body: ProbeDto): ProbeDto {
    return body;
  }
}

@Module({ imports: [AppModule], controllers: [ValidationProbeController] })
class TestAppModule {}

describe('NestJS application (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const fixture = await Test.createTestingModule({
      imports: [TestAppModule],
    })
      .overrideProvider(ConfigService)
      .useValue(
        new ConfigService({
          APP_VERSION: '1.1.0',
          INKSIGHT_CORS_ORIGINS: 'http://localhost:3000',
        }),
      )
      .compile();
    app = fixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each(['/api/health', '/api/v1/health'])(
    '%s preserves the health response',
    async (path) => {
      await request(app.getHttpServer())
        .get(path)
        .expect(200)
        .expect({ status: 'ok', version: '1.1.0' });
    },
  );

  it('enables credentials for an allowed frontend origin', async () => {
    await request(app.getHttpServer())
      .get('/api/health')
      .set('Origin', 'http://localhost:3000')
      .expect('Access-Control-Allow-Origin', 'http://localhost:3000')
      .expect('Access-Control-Allow-Credentials', 'true')
      .expect(200);
  });

  it('does not grant CORS access to an unknown origin', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .set('Origin', 'https://unknown.example');
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('applies global DTO validation', async () => {
    await request(app.getHttpServer())
      .post('/api/validation-probe')
      .send({ count: -1 })
      .expect(400);
  });

  it('transforms DTOs and strips unknown fields', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/validation-probe')
      .send({ count: 2, extra: 'ignored' })
      .expect(201)
      .expect({ count: 2 });
  });
});
