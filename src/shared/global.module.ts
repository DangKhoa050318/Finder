import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from './config.service';

const imports = [
  ConfigModule.forRoot({
    isGlobal: true,
  }),
  JwtModule.registerAsync({
    useFactory: (cfg: ConfigService) => {
      return {
        global: true,
        secret: cfg.env.jwtSecret,
        signOptions: { expiresIn: cfg.env.jwtExpiresIn },
      };
    },
    inject: [ConfigService],
  }),
];

@Global()
@Module({
  imports,
  providers: [ConfigService],
  exports: [ConfigService, JwtModule],
})
export class GlobalModule {}
