import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const MESSAGE_KEY = 'MESSAGE_KEY';
export const ResponseMessage = (message: string) =>
  SetMetadata(MESSAGE_KEY, message);

export interface Response<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  constructor(private reflector: Reflector) {}
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const message = this.reflector.getAllAndOverride<string>(MESSAGE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    return next
      .handle()
      .pipe(map((data) => ({ data, message: message ?? 'Thành công' })));
  }
}
