import { plainToInstance, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

enum NodeEnvironment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class Environment {
  @IsEnum(NodeEnvironment)
  NODE_ENV: NodeEnvironment = NodeEnvironment.Development;

  @IsString()
  @IsNotEmpty()
  HOST = '0.0.0.0';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 8080;

  @IsString()
  @IsNotEmpty()
  APP_VERSION = '1.1.0';

  @IsString()
  INKSIGHT_CORS_ORIGINS =
    'https://inksight.lubezhang.cn,http://localhost:3000,http://127.0.0.1:3000,http://localhost:8081,http://127.0.0.1:8081';
}

export function validateEnvironment(
  values: Record<string, unknown>,
): Environment {
  const environment = plainToInstance(Environment, values);
  const errors = validateSync(environment, {
    validationError: { target: false, value: false },
  });

  if (errors.length > 0) {
    // 只列出无效字段，避免启动日志泄露环境变量值。
    throw new Error(
      `Invalid environment configuration: ${errors.map((error) => error.property).join(', ')}`,
    );
  }

  return environment;
}
