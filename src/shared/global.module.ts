import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from './config.service';
import { CloudinaryProvider } from './cloudinary.provider';
import { CloudinaryService } from './cloudinary.service';

const imports = [
  ConfigModule.forRoot({
    isGlobal: true,
  }),
  JwtModule.registerAsync({
    useFactory: (cfg: ConfigService) => {
      return {
        global: true,
        secret: cfg.env.jwtSecret,
        signOptions: { expiresIn: cfg.env.jwtExpiresIn as any },
      };
    },
    inject: [ConfigService],
  }),
];

@Global()
@Module({
  imports,
  providers: [ConfigService, CloudinaryProvider, CloudinaryService],
  exports: [ConfigService, JwtModule, CloudinaryService],
})
export class GlobalModule {}
