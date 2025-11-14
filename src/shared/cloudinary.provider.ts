import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from './config.service';

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  useFactory: (configService: ConfigService) => {
    return cloudinary.config({
      cloud_name: configService.env.cloudinaryCloudName,
      api_key: configService.env.cloudinaryApiKey,
      api_secret: configService.env.cloudinaryApiSecret,
    });
  },
  inject: [ConfigService],
};
