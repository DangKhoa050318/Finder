import { Injectable } from '@nestjs/common';
import { ConfigService as NestJsConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestJsConfigService) {}

  private getNumber(key: string): number {
    const value = this.get(key);

    try {
      return Number(value);
    } catch {
      throw new Error(key + ' environment variable is not a number');
    }
  }

  private getBoolean(key: string): boolean {
    const value = this.get(key);

    try {
      return Boolean(JSON.parse(value));
    } catch {
      throw new Error(key + ' env var is not a boolean');
    }
  }

  private getString(key: string): string {
    const value = this.get(key);

    return value.replace(/\\n/g, '\n');
  }

  get env() {
    return {
      mongoUri: this.getString('MONGO_URI'),
      jwtSecret: this.getString('JWT_SECRET'),
      jwtExpiresIn: this.getString('JWT_EXPIRES_IN'),
      port: this.getNumber('PORT') ?? 5000,
      prefix: this.getString('API_PREFIX') ?? '/api',
      swaggerPath: this.getString('SWAGGER_PATH') ?? '/api',
      mailUser: this.getString('MAIL_USER'),
      mailPass: this.getString('MAIL_PASS'),
      cloudinaryCloudName: this.getString('CLOUDINARY_CLOUD_NAME'),
      cloudinaryApiKey: this.getString('CLOUDINARY_API_KEY'),
      cloudinaryApiSecret: this.getString('CLOUDINARY_API_SECRET'),
    };
  }
  private get(key: string): string {
    const value = this.configService.get<string>(key);

    if (!value) {
      console.error(key + ' environment variable does not set');
      return process.exit(1);
    }

    return value;
  }
}
