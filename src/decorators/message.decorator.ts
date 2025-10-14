export const MESSAGE_KEY = 'message';
export const Message = (message: string) =>
  Reflect.metadata(MESSAGE_KEY, message);
