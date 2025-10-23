import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MessageService } from '../services/message.service';
import { ChatGateway } from '../gateways/chat.gateway';
import {
  SendMessageDto,
  GetMessagesQueryDto,
  MessageResponseDto,
} from '../dtos/message.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Gửi message' })
  @ApiResponse({
    status: 201,
    description: 'Gửi thành công',
    type: MessageResponseDto,
  })
  async sendMessage(@Body() dto: SendMessageDto, @Request() req) {
    // Tạo message trong database
    const message = await this.messageService.sendMessage(dto);

    // Emit message qua WebSocket đến members của chat
    this.chatGateway.sendNewMessage(dto.chat_id, message);
    return message;
  }

  @Get()
  @ApiOperation({ summary: 'Lấy messages của chat với phân trang' })
  @ApiResponse({
    status: 200,
    description: 'Thành công',
    type: [MessageResponseDto],
  })
  async getMessages(@Query() query: GetMessagesQueryDto) {
    const messages = await this.messageService.getMessages(query);
    return messages;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin một message' })
  @ApiResponse({
    status: 200,
    description: 'Thành công',
    type: MessageResponseDto,
  })
  async getMessageById(@Param('id') id: string) {
    const message = await this.messageService.getMessageById(id);
    return message;
  }

  @Patch(':chatId/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đánh dấu messages là đã đọc' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  async markAsRead(@Param('chatId') chatId: string, @Request() req) {
    const userId = req.user.userId;
    const result = await this.messageService.markMessagesAsRead(chatId, userId);

    // Emit event qua WebSocket
    this.chatGateway.sendMessageSeen(chatId, userId);

    return result;
  }

  @Get('chats/:chatId/unread-count')
  @ApiOperation({ summary: 'Đếm số messages chưa đọc trong chat' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  async getUnreadCount(@Param('chatId') chatId: string, @Request() req) {
    const userId = req.user.userId;
    const count = await this.messageService.getUnreadCount(chatId, userId);
    return { count };
  }

  @Get('unread/total')
  @ApiOperation({ summary: 'Đếm tổng số messages chưa đọc của user' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  async getTotalUnreadCount(@Request() req) {
    const userId = req.user.userId;
    const count = await this.messageService.getTotalUnreadCount(userId);
    return { count };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa message' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  async deleteMessage(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    const result = await this.messageService.deleteMessage(id, userId);
    return result;
  }
}
