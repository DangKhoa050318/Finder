import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  FriendRequest,
  FriendRequestDocument,
  FriendRequestStatus,
} from '../models/friend-request.schema';
import { Friendship, FriendshipDocument } from '../models/friendship.schema';

@Injectable()
export class FriendService {
  constructor(
    @InjectModel(FriendRequest.name)
    private friendRequestModel: Model<FriendRequestDocument>,
    @InjectModel(Friendship.name)
    private friendshipModel: Model<FriendshipDocument>,
  ) {}

  // Send friend request
  async sendFriendRequest(requesterId: string, requesteeId: string) {
    if (requesterId === requesteeId) {
      throw new BadRequestException(
        'Không thể gửi lời mời kết bạn cho chính mình',
      );
    }

    // Check if already friends
    const areFriends = await this.areFriends(requesterId, requesteeId);
    if (areFriends) {
      throw new BadRequestException('Đã là bạn bè rồi');
    }

    // Check if request already exists
    const existingRequest = await this.friendRequestModel.findOne({
      $or: [
        { requester_id: requesterId, requestee_id: requesteeId },
        { requester_id: requesteeId, requestee_id: requesterId },
      ],
      status: FriendRequestStatus.Pending,
    });

    if (existingRequest) {
      throw new BadRequestException('Lời mời kết bạn đã tồn tại');
    }

    const friendRequest = new this.friendRequestModel({
      requester_id: new Types.ObjectId(requesterId),
      requestee_id: new Types.ObjectId(requesteeId),
      status: FriendRequestStatus.Pending,
    });

    return friendRequest.save();
  }

  // Accept friend request
  async acceptFriendRequest(requestId: string, userId: string) {
    const request = await this.friendRequestModel.findById(requestId);

    if (!request) {
      throw new NotFoundException('Không tìm thấy lời mời kết bạn');
    }

    if (request.requestee_id.toString() !== userId) {
      throw new BadRequestException('Bạn không có quyền chấp nhận lời mời này');
    }

    if (request.status !== FriendRequestStatus.Pending) {
      throw new BadRequestException('Lời mời đã được xử lý');
    }

    // Update request status
    request.status = FriendRequestStatus.Accepted;
    await request.save();

    // Create friendship (ensure user1_id < user2_id for consistency)
    const user1 = request.requester_id.toString();
    const user2 = request.requestee_id.toString();
    const [smaller, larger] = user1 < user2 ? [user1, user2] : [user2, user1];

    const friendship = new this.friendshipModel({
      user1_id: new Types.ObjectId(smaller),
      user2_id: new Types.ObjectId(larger),
    });

    await friendship.save();

    // TODO: Create private chat for these two users
    // await this.chatService.createPrivateChat(user1, user2);

    return { request, friendship };
  }

  // Reject friend request
  async rejectFriendRequest(requestId: string, userId: string) {
    const request = await this.friendRequestModel.findById(requestId);

    if (!request) {
      throw new NotFoundException('Không tìm thấy lời mời kết bạn');
    }

    if (request.requestee_id.toString() !== userId) {
      throw new BadRequestException('Bạn không có quyền từ chối lời mời này');
    }

    if (request.status !== FriendRequestStatus.Pending) {
      throw new BadRequestException('Lời mời đã được xử lý');
    }

    request.status = FriendRequestStatus.Rejected;
    return request.save();
  }

  // Cancel friend request (by requester)
  async cancelFriendRequest(requestId: string, userId: string) {
    const request = await this.friendRequestModel.findById(requestId);

    if (!request) {
      throw new NotFoundException('Không tìm thấy lời mời kết bạn');
    }

    if (request.requester_id.toString() !== userId) {
      throw new BadRequestException('Bạn không có quyền hủy lời mời này');
    }

    if (request.status !== FriendRequestStatus.Pending) {
      throw new BadRequestException('Lời mời đã được xử lý');
    }

    return this.friendRequestModel.findByIdAndDelete(requestId);
  }

  // Get pending friend requests for a user
  async getPendingRequests(userId: string) {
    return this.friendRequestModel
      .find({
        requestee_id: userId,
        status: FriendRequestStatus.Pending,
      })
      .populate('requester_id', 'full_name email avatar')
      .sort({ date: -1 });
  }

  // Get sent friend requests
  async getSentRequests(userId: string) {
    return this.friendRequestModel
      .find({
        requester_id: userId,
        status: FriendRequestStatus.Pending,
      })
      .populate('requestee_id', 'full_name email avatar')
      .sort({ date: -1 });
  }

  // Get all friends of a user
  async getFriends(userId: string) {
    const friendships = await this.friendshipModel
      .find({
        $or: [{ user1_id: userId }, { user2_id: userId }],
      })
      .populate('user1_id', 'full_name email avatar')
      .populate('user2_id', 'full_name email avatar');

    // Map to return the other user (not the current user)
    return friendships.map((friendship) => {
      const friend =
        friendship.user1_id._id.toString() === userId
          ? friendship.user2_id
          : friendship.user1_id;
      return {
        ...friendship.toObject(),
        friend,
      };
    });
  }

  // Unfriend
  async unfriend(userId: string, friendId: string) {
    const [smaller, larger] =
      userId < friendId ? [userId, friendId] : [friendId, userId];

    const friendship = await this.friendshipModel.findOneAndDelete({
      user1_id: smaller,
      user2_id: larger,
    });

    if (!friendship) {
      throw new NotFoundException('Không tìm thấy quan hệ bạn bè');
    }

    return { message: 'Đã hủy kết bạn thành công' };
  }

  // Check if two users are friends
  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const [smaller, larger] =
      userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

    const friendship = await this.friendshipModel.findOne({
      user1_id: smaller,
      user2_id: larger,
    });

    return !!friendship;
  }

  // Search users to add as friends (exclude already friends and pending requests)
  async searchUsersToAdd(userId: string, searchQuery: string) {
    // This would typically use UserService to search
    // Return users that are not friends and don't have pending requests
    // Implementation depends on your User model search capabilities
    throw new Error('Not implemented - requires UserService integration');
  }
}
