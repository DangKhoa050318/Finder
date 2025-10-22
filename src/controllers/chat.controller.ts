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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from '../services/chat.service';
import {
  CreatePrivateChatDto,
  CreateGroupChatDto,
  GetUserChatsQueryDto,
  ChatResponseDto,
} from '../dtos/chat.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Chats')
@ApiBearerAuth()
@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('private')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tạo hoặc lấy private chat giữa 2 users' })
  @ApiResponse({ status: 200, description: 'Thành công', type: ChatResponseDto })
  async createPrivateChat(@Body() dto: CreatePrivateChatDto, @Request() req) {
    const chat = await this.chatService.findOrCreatePrivateChat(
      dto.user1_id,
      dto.user2_id,
    );
    return {
      data: chat,
      message: 'Thành công',
    };
  }

  @Post('group')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo group chat cho nhóm' })
  @ApiResponse({ status: 201, description: 'Tạo thành công', type: ChatResponseDto })
  async createGroupChat(@Body() dto: CreateGroupChatDto, @Request() req) {
    const chat = await this.chatService.createGroupChat(
      dto.group_id,
      dto.member_ids,
    );
    return {
      data: chat,
      message: 'Tạo group chat thành công',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách chats của user hiện tại' })
  @ApiResponse({ status: 200, description: 'Thành công', type: [ChatResponseDto] })
  async getUserChats(@Query() query: GetUserChatsQueryDto, @Request() req) {
    const userId = req.user.userId; // Lấy từ JWT payload
    const chats = await this.chatService.getUserChats(userId, query.chat_type);
    return {
      data: chats,
      message: 'Thành công',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một chat' })
  @ApiResponse({ status: 200, description: 'Thành công', type: ChatResponseDto })
  async getChatById(@Param('id') id: string) {
    const chat = await this.chatService.getChatById(id);
    return {
      data: chat,
      message: 'Thành công',
    };
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Lấy danh sách members của chat' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  async getChatMembers(@Param('id') id: string) {
    const members = await this.chatService.getChatMembers(id);
    return {
      data: members,
      message: 'Thành công',
    };
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Thêm member vào group chat' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  async addMember(
    @Param('id') chatId: string,
    @Body('user_id') userId: string,
  ) {
    const result = await this.chatService.addMemberToChat(chatId, userId);
    return result;
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Xóa member khỏi group chat' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  async removeMember(
    @Param('id') chatId: string,
    @Param('userId') userId: string,
  ) {
    const result = await this.chatService.removeMemberFromChat(chatId, userId);
    return result;
  }

  @Delete('test/cleanup')
  @ApiOperation({ summary: '[TEST ONLY] Xóa tất cả test chats và messages' })
  @ApiResponse({ status: 200, description: 'Đã xóa test data thành công' })
  async cleanupTestData(@Request() req) {
    const userId = req.user.userId;
    
    // Lấy tất cả chats của user
    const participants = await this.chatService['chatParticipantModel'].find({ 
      user_id: userId 
    });
    
    const chatIds = participants.map(p => p.chat_id);
    
    if (chatIds.length === 0) {
      return {
        message: 'Không có chat nào để xóa',
        deletedChats: 0,
        deletedMessages: 0,
      };
    }
    
    // Đếm messages trước khi xóa
    const messageCount = await this.chatService['messageModel'].countDocuments({ 
      chat_id: { $in: chatIds } 
    });
    
    // Xóa messages
    await this.chatService['messageModel'].deleteMany({ 
      chat_id: { $in: chatIds } 
    });
    
    // Xóa participants
    await this.chatService['chatParticipantModel'].deleteMany({ 
      chat_id: { $in: chatIds } 
    });
    
    // Xóa chats
    await this.chatService['chatModel'].deleteMany({ 
      _id: { $in: chatIds } 
    });

    return {
      message: `Đã xóa ${chatIds.length} chats và ${messageCount} messages`,
      deletedChats: chatIds.length,
      deletedMessages: messageCount,
    };
  }
}
