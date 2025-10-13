import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from './config.service';

const imports = [
  ConfigModule.forRoot({
    isGlobal: true,
  }),
  JwtModule.register({}),
];
const providers = [ConfigService, JwtService];

@Global()
@Module({
  imports,
  providers,
  exports: [...providers],
})
export class GlobalModule {}
