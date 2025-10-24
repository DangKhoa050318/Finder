import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { MongoError, MongoServerError } from 'mongodb';
import { Error } from 'mongoose';

@Catch(MongoError, MongoServerError, Error.ValidationError)
export class MongoExceptionFilter implements ExceptionFilter {
  catch(exception: MongoServerError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const statusCode = HttpStatus.BAD_REQUEST;
    let message: string[] | string | undefined = exception.message || undefined;

    if (exception.kind == 'ObjectId') message = 'Không tìm thấy';
    switch (exception.code) {
      case 11000:
        console.log('\n=== MONGODB DUPLICATE KEY ERROR ===');
        console.log('Collection:', exception.message.match(/collection: (\w+)/)?.[1]);
        console.log('keyValue:', JSON.stringify(exception.keyValue, null, 2));
        console.log('keyPattern:', JSON.stringify(exception.keyPattern, null, 2));
        console.log('Full exception:', exception);
        console.log('========================================\n');
        message = [];
        for (const p in exception.keyValue) {
          message.push(`${p} đã tồn tại`);
        }
        message = (message as string[]).join('\n');
        break;
    }
    if (exception.errors) {
      message = [];
      for (const p in exception.errors) {
        message.push(exception.errors[p].properties.message);
      }
      message = (message as string[]).join('\n');
    }

    response.status(statusCode).json({
      statusCode,
      message: message ?? 'Lỗi không xác định',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
