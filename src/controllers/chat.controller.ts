import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { User } from 'src/decorators/user.decorator';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { type JwtPayload } from 'src/types/jwt';
import {
  ChatResponseDto,
  CreateGroupChatDto,
  CreatePrivateChatDto,
  GetUserChatsQueryDto,
} from '../dtos/chat.dto';
import { ChatService } from '../services/chat.service';

@ApiTags('Chats')
@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('private')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo hoặc lấy private chat giữa 2 users' })
  @ApiResponse({
    status: 201,
    description: 'Thành công',
    type: ChatResponseDto,
  })
  async createPrivateChat(@Body() dto: CreatePrivateChatDto) {
    const chat = await this.chatService.findOrCreatePrivateChat(
      dto.user1_id,
      dto.user2_id,
    );
    return chat;
  }

  @Post('group')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo group chat cho nhóm' })
  @ApiResponse({
    status: 201,
    description: 'Tạo thành công',
    type: ChatResponseDto,
  })
  async createGroupChat(@Body() dto: CreateGroupChatDto) {
    const chat = await this.chatService.createGroupChat(
      dto.group_id,
      dto.member_ids,
    );
    return chat;
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách chats của user hiện tại' })
  @ApiResponse({
    status: 200,
    description: 'Thành công',
    type: [ChatResponseDto],
  })
  async getUserChats(
    @Query() query: GetUserChatsQueryDto,
    @User() { _id }: JwtPayload,
  ) {
    const chats = await this.chatService.getUserChats(_id, query.chat_type);
    return chats;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một chat' })
  @ApiResponse({
    status: 200,
    description: 'Thành công',
    type: ChatResponseDto,
  })
  async getChatById(@Param('id') id: string) {
    const chat = await this.chatService.getChatById(id);
    return chat;
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Lấy danh sách members của chat' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  async getChatMembers(@Param('id') id: string) {
    const members = await this.chatService.getChatMembers(id);
    return members;
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Thêm member vào group chat' })
  @ApiResponse({ status: 201, description: 'Thành công' })
  async addMember(
    @Param('id') chatId: string,
    @Body('user_id') userId: string,
  ) {
    const result = await this.chatService.addMemberToChat(chatId, userId);
    return result;
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa member khỏi group chat' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  async removeMember(
    @Param('id') chatId: string,
    @Param('userId') userId: string,
  ) {
    const result = await this.chatService.removeMemberFromChat(chatId, userId);
    return 'Xóa member khỏi chat thành công';
  }
}
