import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Environment } from '../../config/environment';

@Injectable()
export class HealthService {
  constructor(private readonly config: ConfigService<Environment, true>) {}

  check(): { status: 'ok'; version: string } {
    return {
      status: 'ok',
      version: this.config.get('APP_VERSION', { infer: true }),
    };
  }
}
