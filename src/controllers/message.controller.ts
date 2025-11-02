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
import { ChatService } from '../services/chat.service';
import { NotificationService } from '../services/notification.service';
import { UserService } from '../services/user.service';
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
    private readonly chatService: ChatService,
    private readonly notificationService: NotificationService,
    private readonly userService: UserService,
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

    // Gửi notification cho tất cả recipients (trừ sender)
    try {
      const chatMembers = await this.chatService.getChatMembers(dto.chat_id);

      // Emit message qua WebSocket đến members của chat (cả chat room và user rooms)
      this.chatGateway.sendNewMessage(dto.chat_id, message, chatMembers);

      const sender = await this.userService.findById(dto.sender_id);

      if (sender) {
        // Gửi notification cho tất cả members trừ sender
        for (const member of chatMembers) {
          if (member.user_id._id.toString() !== dto.sender_id) {
            await this.notificationService.sendMessageNotification(
              member.user_id._id.toString(),
              sender.full_name,
              dto.content,
              dto.chat_id,
            );
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message notifications:', error);
    }

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
    console.log('🔍 [Controller] req.user:', req.user);
    
    const userId = req.user._id;
    
    console.log(`🎯 [Controller] markAsRead called - chatId: ${chatId}, userId: ${userId}`);
    
    const result = await this.messageService.markMessagesAsRead(chatId, userId);

    // Gửi event qua WebSocket - thông báo cho tất cả users trong chat
    // Note: messageId là 'all' vì chúng ta đánh dấu tất cả tin nhắn chưa đọc
    this.chatGateway.sendMessageSeen(chatId, { 
      messageId: 'all', // Đánh dấu tất cả messages đã xem
      userId 
    });

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
