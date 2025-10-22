import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  FriendRequest,
  FriendRequestDocument,
  FriendRequestStatus,
} from '../models/friend-request.schema';
import { Friendship, FriendshipDocument } from '../models/friendship.schema';
import { User, UserDocument } from '../models/user.schema';
import {
  Availability,
  AvailabilityDocument,
} from '../models/availability.schema';
import { Block, BlockDocument } from '../models/block.schema';
import { ChatService } from './chat.service';
import { BlockService } from './block.service';

@Injectable()
export class FriendService {
  constructor(
    @InjectModel(FriendRequest.name)
    private friendRequestModel: Model<FriendRequestDocument>,
    @InjectModel(Friendship.name)
    private friendshipModel: Model<FriendshipDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Availability.name)
    private availabilityModel: Model<AvailabilityDocument>,
    @InjectModel(Block.name)
    private blockModel: Model<BlockDocument>,
    @Inject(forwardRef(() => ChatService))
    private chatService: ChatService,
    @Inject(forwardRef(() => BlockService))
    private blockService: BlockService,
  ) {}

  // Send friend request
  async sendFriendRequest(requesterId: string, requesteeId: string) {
    if (requesterId === requesteeId) {
      throw new BadRequestException(
        'Không thể gửi lời mời kết bạn cho chính mình',
      );
    }

    // Check if blocked (either direction)
    const hasBlock = await this.blockService.hasBlockBetween(
      requesterId,
      requesteeId,
    );
    if (hasBlock) {
      throw new BadRequestException('Không thể gửi lời mời kết bạn do bị chặn');
    }

    // Check if already friends
    const areFriends = await this.areFriends(requesterId, requesteeId);
    if (areFriends) {
      throw new BadRequestException('Đã là bạn bè rồi');
    }

    // Check if request already exists
    const existingRequest = await this.friendRequestModel.findOne({
      $or: [
        {
          requester_id: new Types.ObjectId(requesterId),
          requestee_id: new Types.ObjectId(requesteeId),
        },
        {
          requester_id: new Types.ObjectId(requesteeId),
          requestee_id: new Types.ObjectId(requesterId),
        },
      ],
      status: FriendRequestStatus.Pending,
    });

    if (existingRequest) {
      throw new BadRequestException('Đã gửi lời mời kết bạn rồi');
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

    // Check if blocked (either direction)
    const requesterId = request.requester_id.toString();
    const hasBlock = await this.blockService.hasBlockBetween(
      requesterId,
      userId,
    );
    if (hasBlock) {
      throw new BadRequestException('Không thể chấp nhận lời mời do bị chặn');
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

    // Auto-create private chat for these two users
    try {
      await this.chatService.findOrCreatePrivateChat(user1, user2);
    } catch (error) {
      // Log error but don't fail the friend acceptance
      console.error('Failed to create private chat:', error);
    }

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
        requestee_id: new Types.ObjectId(userId),
        status: FriendRequestStatus.Pending,
      })
      .populate('requester_id', 'full_name email avatar')
      .sort({ date: -1 });
  }

  // Get sent friend requests
  async getSentRequests(userId: string) {
    return this.friendRequestModel
      .find({
        requester_id: new Types.ObjectId(userId),
        status: FriendRequestStatus.Pending,
      })
      .populate('requestee_id', 'full_name email avatar')
      .sort({ date: -1 });
  }

  // Get all friends of a user
  async getFriends(userId: string) {
    const friendships = await this.friendshipModel
      .find({
        $or: [
          { user1_id: new Types.ObjectId(userId) },
          { user2_id: new Types.ObjectId(userId) },
        ],
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
      user1_id: new Types.ObjectId(smaller),
      user2_id: new Types.ObjectId(larger),
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
      user1_id: new Types.ObjectId(smaller),
      user2_id: new Types.ObjectId(larger),
    });

    return !!friendship;
  }

  // Check if there's a pending friend request from userId1 to userId2
  async hasPendingFriendRequest(
    userId1: string,
    userId2: string,
  ): Promise<boolean> {
    const pendingRequest = await this.friendRequestModel.findOne({
      requester_id: new Types.ObjectId(userId1),
      requestee_id: new Types.ObjectId(userId2),
      status: FriendRequestStatus.Pending,
    });

    return !!pendingRequest;
  }

  // Get suggested friends based on major, availability, and other criteria
  async getSuggestedFriends(userId: string, limit: number = 10) {
    // Get current user info
    const currentUser = await this.userModel.findById(userId);
    if (!currentUser) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Get current user's availabilities
    const userAvailabilities = await this.availabilityModel.find({
      user_id: new Types.ObjectId(userId),
    });

    // Get list of users to exclude:
    // 1. Current user
    const excludeIds = [new Types.ObjectId(userId)];

    // 2. Already friends
    const friendships = await this.friendshipModel.find({
      $or: [
        { user1_id: new Types.ObjectId(userId) },
        { user2_id: new Types.ObjectId(userId) },
      ],
    });

    friendships.forEach((f) => {
      const friendId =
        f.user1_id.toString() === userId ? f.user2_id : f.user1_id;
      excludeIds.push(new Types.ObjectId(friendId));
    });

    // 3. Friend requests to exclude:
    // - Pending requests (both sent and received) - đang chờ xử lý
    // - Accepted requests - sẽ trở thành friendship (đã xử lý ở bước 2)
    // Note: Rejected requests KHÔNG loại bỏ - có thể gợi ý lại sau
    const pendingRequests = await this.friendRequestModel.find({
      $or: [
        { requester_id: new Types.ObjectId(userId) },
        { requestee_id: new Types.ObjectId(userId) },
      ],
      status: FriendRequestStatus.Pending,
    });

    pendingRequests.forEach((req) => {
      const otherUserId =
        req.requester_id.toString() === userId
          ? req.requestee_id
          : req.requester_id;
      excludeIds.push(new Types.ObjectId(otherUserId));
    });

    // 4. Blocked users (both directions)
    const blocks = await this.blockModel.find({
      $or: [
        { blocker_id: new Types.ObjectId(userId) },
        { blocked_id: new Types.ObjectId(userId) },
      ],
    });

    blocks.forEach((block) => {
      const blockedUserId =
        block.blocker_id.toString() === userId
          ? block.blocked_id
          : block.blocker_id;
      excludeIds.push(new Types.ObjectId(blockedUserId));
    });

    // Build query for suggested users
    const query: any = {
      _id: { $nin: excludeIds },
    };

    // Prefer users with same major
    let suggestedUsers = await this.userModel
      .find({
        ...query,
        major_id: currentUser.major_id,
      })
      .select('full_name email avatar major_id')
      .populate('major_id', 'name')
      .limit(limit)
      .lean();

    // If not enough users with same major, get users from other majors
    if (suggestedUsers.length < limit) {
      const additionalUsers = await this.userModel
        .find({
          ...query,
          major_id: { $ne: currentUser.major_id },
        })
        .select('full_name email avatar major_id')
        .populate('major_id', 'name')
        .limit(limit - suggestedUsers.length)
        .lean();

      suggestedUsers = [...suggestedUsers, ...additionalUsers];
    }

    // Calculate matching score for each user based on availability overlap
    const usersWithScore = await Promise.all(
      suggestedUsers.map(async (user: any) => {
        let matchScore = 0;

        // +10 points for same major
        if (
          currentUser.major_id &&
          user.major_id &&
          currentUser.major_id.toString() === user.major_id._id.toString()
        ) {
          matchScore += 10;
        }

        // Calculate availability overlap
        const otherUserAvailabilities = await this.availabilityModel
          .find({
            user_id: user._id,
          })
          .lean();

        let overlapCount = 0;
        for (const userAvail of userAvailabilities) {
          for (const otherAvail of otherUserAvailabilities) {
            // Check if same day
            if (userAvail.day_of_week === otherAvail.day_of_week) {
              // Check if time overlaps
              const start1 = userAvail.start_time;
              const end1 = userAvail.end_time;
              const start2 = otherAvail.start_time;
              const end2 = otherAvail.end_time;

              if (start1 < end2 && start2 < end1) {
                overlapCount++;
              }
            }
          }
        }

        // +1 point per overlapping availability slot
        matchScore += overlapCount;

        return {
          ...user,
          matchScore,
          matchReasons: {
            sameMajor:
              currentUser.major_id &&
              user.major_id &&
              currentUser.major_id.toString() === user.major_id._id.toString(),
            availabilityOverlap: overlapCount,
          },
        };
      }),
    );

    // Sort by match score descending
    usersWithScore.sort((a, b) => b.matchScore - a.matchScore);

    return usersWithScore;
  }

  // Search users to add as friends (exclude already friends and pending requests)
  async searchUsersToAdd(userId: string, searchQuery: string) {
    // This would typically use UserService to search
    // Return users that are not friends and don't have pending requests
    // Implementation depends on your User model search capabilities
    throw new Error('Not implemented - requires UserService integration');
  }
}
