# Dependencies cần cài cho Chat/Message với WebSocket

## Run this command in Finder directory:

```bash
cd D:\SWP_Project\Finder
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
```

## Optional (nếu cần Redis cho scale):
```bash
npm install ioredis @nestjs/microservices
```

## Packages:
- `@nestjs/websockets`: NestJS WebSocket module
- `@nestjs/platform-socket.io`: Socket.io platform adapter
- `socket.io`: Socket.io server
- `ioredis`: Redis client (optional, for scaling)
