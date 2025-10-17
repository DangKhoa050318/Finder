import { plainToInstance } from 'class-transformer';

export function toDto<T, U>(entity: T, dtoClass: new () => U): U {
  const plain =
    typeof (entity as any)?.toObject === 'function'
      ? (entity as any).toObject()
      : entity;
  return plainToInstance(dtoClass, plain);
}
