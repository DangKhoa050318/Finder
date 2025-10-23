import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcryptjs';
import { GroupMemberRole } from '../models/group-member.schema';
import { AppModule } from '../app.module';
import { GroupDocument, GroupVisibility } from '../models/group.schema';
import { Role } from '../models/user.schema';
import { AvailabilityService } from '../services/availability.service';
import { CourseService } from '../services/course.service';
import { FriendService } from '../services/friend.service';
import { GroupService } from '../services/group.service';
import { MajorService } from '../services/major.service';
import { MajorCourseService } from '../services/major_course.service';
import { NewsService } from '../services/news.service';
import { SlotService } from '../services/slot.service';
import { UserService } from '../services/user.service';

async function seed() {
  console.log('🌱 Bắt đầu seed database...\n');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    // Get Services
    const userService = app.get(UserService);
    const majorService = app.get(MajorService);
    const courseService = app.get(CourseService);
    const majorCourseService = app.get(MajorCourseService);
    const friendService = app.get(FriendService);
    const groupService = app.get(GroupService);
    const slotService = app.get(SlotService);
    const newsService = app.get(NewsService);
    const availabilityService = app.get(AvailabilityService);

    // 1. Seed Majors
    console.log('📚 Đang seed majors...');
    const majorData = [
      { key: 'se', name: 'Software Engineering' },
      { key: 'ai', name: 'Artificial Intelligence' },
      { key: 'ib', name: 'International Business' },
      { key: 'gd', name: 'Graphic Design' },
      { key: 'ds', name: 'Data Science' },
    ];

    const majors: any[] = [];
    for (const data of majorData) {
      try {
        const existing = await majorService.getByKey(data.key);
        majors.push(existing);
      } catch {
        const major = await majorService.create(data.key, data.name);
        majors.push(major);
      }
    }
    console.log(`✅ Đã tạo ${majors.length} majors\n`);

    // 2. Seed Courses
    console.log('📖 Đang seed courses...');
    const courseData = [
      {
        course_id: 'PRN231',
        course_name: 'Building Cross-Platform Back-End Application With .NET',
      },
      { course_id: 'SWP391', course_name: 'Software Development Project' },
      { course_id: 'PRJ301', course_name: 'Java Web Application Development' },
      { course_id: 'DBI202', course_name: 'Database Systems' },
      { course_id: 'MAE101', course_name: 'Mathematics for Engineering' },
      { course_id: 'PRF192', course_name: 'Programming Fundamentals' },
      { course_id: 'OSG202', course_name: 'Operating Systems' },
      { course_id: 'NWC203', course_name: 'Computer Networking' },
      { course_id: 'SWE201', course_name: 'Software Engineering' },
      { course_id: 'MAS291', course_name: 'Statistics & Probability' },
    ];

    const courses: any[] = [];
    for (const data of courseData) {
      try {
        const existing = await courseService.getByCourseId(data.course_id);
        courses.push(existing);
      } catch {
        const course = await courseService.create(
          data.course_id,
          data.course_name,
        );
        courses.push(course);
      }
    }
    console.log(`✅ Đã tạo ${courses.length} courses\n`);

    // 3. Seed Major-Course relationships
    console.log('🔗 Đang seed major-course relationships...');
    let majorCourseCount = 0;

    // SE major có tất cả courses
    for (const course of courses) {
      try {
        await majorCourseService.create(
          majors[0]._id.toString(),
          course._id.toString(),
        );
        majorCourseCount++;
      } catch {
        // Đã tồn tại
      }
    }

    // AI major có một số courses
    const aiCourses = [
      courses[0],
      courses[1],
      courses[3],
      courses[5],
      courses[9],
    ];
    for (const course of aiCourses) {
      try {
        await majorCourseService.create(
          majors[1]._id.toString(),
          course._id.toString(),
        );
        majorCourseCount++;
      } catch {
        // Đã tồn tại
      }
    }

    console.log(`✅ Đã tạo ${majorCourseCount} major-course relationships\n`);

    // 4. Seed Admin
    console.log('👤 Đang seed admin...');
    let admin = await userService.findByEmail('admin123@gmail.com');

    if (admin) {
      console.log('✅ Admin đã tồn tại\n');
    } else {
      const hashedPassword = await bcrypt.hash('123', 10);
      admin = await userService.create({
        full_name: 'Administrator',
        email: 'admin123@gmail.com',
        password: hashedPassword,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        role: Role.Admin,
        major_id: majors[0].id,
      });
      console.log('✅ Đã tạo admin\n');
    }

    if (!admin) {
      throw new Error('Failed to create or find admin user');
    } // 5. Seed Demo Users
    console.log('👥 Đang seed demo users...');
    const demoUsers: any[] = [];
    const userNames = [
      'Nguyễn Văn An',
      'Trần Thị Bình',
      'Lê Hoàng Cường',
      'Phạm Thị Dung',
      'Hoàng Văn Em',
      'Vũ Thị Phương',
      'Đỗ Văn Giang',
      'Bùi Thị Hà',
    ];

    for (let i = 0; i < userNames.length; i++) {
      const email = `user${i + 1}@fpt.edu.vn`;
      let user;

      try {
        user = await userService.findByEmail(email);
        if (user) {
          demoUsers.push(user);
        } else throw new Error();
      } catch {
        const hashedPassword = await bcrypt.hash('123', 10);
        user = await userService.create({
          full_name: userNames[i],
          email: email,
          password: hashedPassword,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 1}`,
        });

        // Cập nhật thông tin profile
        await userService.updateUser(user._id.toString(), {
          major_id: majors[i % majors.length]._id.toString(),
        });

        user = await userService.findByEmail(email);
        demoUsers.push(user);
      }
    }
    console.log(`✅ Đã tạo ${demoUsers.length} demo users\n`);

    // 6. Seed Friendships
    console.log('🤝 Đang seed friendships...');
    let friendshipCount = 0;

    const friendPairs = [
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 2],
      [1, 3],
      [1, 4],
      [2, 3],
      [2, 5],
      [3, 4],
      [3, 5],
      [4, 5],
      [4, 6],
      [5, 6],
      [5, 7],
      [6, 7],
    ];

    for (const [idx1, idx2] of friendPairs) {
      try {
        const areFriends = await friendService.areFriends(
          demoUsers[idx1]._id.toString(),
          demoUsers[idx2]._id.toString(),
        );

        if (!areFriends) {
          await friendService.sendFriendRequest(
            demoUsers[idx1]._id.toString(),
            demoUsers[idx2]._id.toString(),
          );

          const requests = await friendService.getPendingRequests(
            demoUsers[idx2]._id.toString(),
          );

          if (requests.length > 0) {
            const matchingRequest = requests.find(
              (r: any) =>
                r.requester_id._id.toString() ===
                demoUsers[idx1]._id.toString(),
            );
            if (matchingRequest) {
              await friendService.acceptFriendRequest(
                matchingRequest.id.toString(),
                demoUsers[idx2].id.toString(),
              );
              friendshipCount++;
            }
          }
        }
      } catch (error) {
        // Bỏ qua lỗi
      }
    }

    console.log(`✅ Đã tạo ${friendshipCount} friendships\n`);

    // 7. Seed Groups
    console.log('👨‍👩‍👧‍👦 Đang seed groups...');
    const groups: GroupDocument[] = [];

    const groupData = [
      {
        name: 'SE Study Group',
        description:
          'Nhóm học Software Engineering - Chia sẻ tài liệu, giải đáp thắc mắc',
        visibility: GroupVisibility.Public,
        leaderId: demoUsers[0].id,
        members: [1, 2, 3, 4],
      },
      {
        name: 'AI Research Team',
        description:
          'Nhóm nghiên cứu AI - Thảo luận về Machine Learning, Deep Learning',
        visibility: GroupVisibility.Public,
        leaderId: demoUsers[1]._id.toString(),
        members: [0, 2, 5],
      },
      {
        name: 'Database Masters',
        description: 'Nhóm học Database - SQL, NoSQL, Database Design',
        visibility: GroupVisibility.Public,
        leaderId: demoUsers[2]._id.toString(),
        members: [0, 1, 3, 6],
      },
      {
        name: 'Web Dev Club',
        description: 'Nhóm phát triển Web - React, Node.js, Full-stack',
        visibility: GroupVisibility.Public,
        leaderId: demoUsers[3]._id.toString(),
        members: [4, 5, 6],
      },
      {
        name: 'Private Study',
        description: 'Nhóm học riêng - Chỉ dành cho thành viên',
        visibility: GroupVisibility.Private,
        leaderId: demoUsers[4]._id.toString(),
        members: [5, 7],
      },
    ];

    for (const data of groupData) {
      const group = await groupService.createGroup(
        data.leaderId,
        data.name,
        data.description,
        data.visibility,
        50,
      );
      groups.push(group);

      // Thêm members
      for (const memberIdx of data.members) {
        try {
          await groupService.addMember(
            group.id,
            demoUsers[memberIdx]._id.toString(),
            GroupMemberRole.Member,
          );
        } catch {
          // Đã là member
        }
      }
    }

    console.log(`✅ Đã tạo ${groups.length} groups\n`);

    // 8. Seed Slots
    console.log('📅 Đang seed slots...');
    let slotCount = 0;

    const now = new Date();

    // Tạo slots cho 7 ngày tới
    for (let day = 1; day <= 7; day++) {
      const slotDate = new Date(now);
      slotDate.setDate(slotDate.getDate() + day);

      // Morning slot (9:00 - 11:00)
      const morningStart = new Date(slotDate);
      morningStart.setHours(9, 0, 0, 0);
      const morningEnd = new Date(slotDate);
      morningEnd.setHours(11, 0, 0, 0);

      if (day % 2 === 1) {
        // Group slots
        await slotService.createGroupSlot(
          demoUsers[day % groups.length].id,
          groups[day % groups.length].id,
          `Morning Study - Day ${day}`,
          `Buổi học buổi sáng về ${groups[day % groups.length].group_name}`,
          morningStart,
          morningEnd,
        
        );
        slotCount++;
      }

      // Afternoon slot (14:00 - 16:00)
      const afternoonStart = new Date(slotDate);
      afternoonStart.setHours(14, 0, 0, 0);
      const afternoonEnd = new Date(slotDate);
      afternoonEnd.setHours(16, 0, 0, 0);

      if (day <= 4) {
        await slotService.createGroupSlot(
          demoUsers[(day + 1) % groups.length].id,
          groups[(day + 1) % groups.length].id,
          `Afternoon Workshop - Day ${day}`,
          'Workshop thực hành và chia sẻ kinh nghiệm',
          afternoonStart,
          afternoonEnd,
        );
        slotCount++;
      }

      // Evening slot (19:00 - 21:00)
      const eveningStart = new Date(slotDate);
      eveningStart.setHours(19, 0, 0, 0);
      const eveningEnd = new Date(slotDate);
      eveningEnd.setHours(21, 0, 0, 0);

      if (day % 3 === 0) {
        // Private slots
        const user1Idx = day % demoUsers.length;
        const user2Idx = (day + 1) % demoUsers.length;

        await slotService.createPrivateSlot(
          demoUsers[user1Idx]._id.toString(),
          demoUsers[user2Idx]._id.toString(),
          `Private Study - Day ${day}`,
          'Buổi học riêng 1-1',
          eveningStart,
          eveningEnd,
        );
        slotCount++;
      }
    }

    console.log(`✅ Đã tạo ${slotCount} slots\n`);

    // 9. Seed News
    console.log('📰 Đang seed news...');
    const newsData = [
      {
        title: 'Chào mừng đến với Study Together! 🎉',
        content: `Chúng tôi rất vui mừng giới thiệu nền tảng học tập mới Study Together - nơi kết nối sinh viên FPT University.

**Tính năng nổi bật:**
- 🤝 Tìm bạn học cùng sở thích và lịch học phù hợp
- 👥 Tạo và tham gia nhóm học tập
- 📅 Quản lý lịch học và slot học nhóm
- 📚 Chia sẻ tài liệu và kiến thức
- 🔔 Nhận thông báo về các buổi học sắp tới

Hãy bắt đầu bằng cách cập nhật profile và tìm những người bạn học tập phù hợp nhất!`,
      },
      {
        title: 'Hướng dẫn sử dụng tính năng Tìm bạn học 🔍',
        content: `**Cách tìm bạn học hiệu quả:**

1. **Cập nhật thông tin cá nhân**: Điền đầy đủ ngành học, lịch rảnh của bạn
2. **Thiết lập lịch rảnh**: Thêm các khung giờ bạn có thể học
3. **Tìm kiếm**: Hệ thống sẽ gợi ý những người có lịch phù hợp
4. **Kết bạn**: Gửi lời mời kết bạn và bắt đầu học cùng nhau
5. **Tạo slot học**: Hẹn lịch học cụ thể với bạn bè

💡 **Mẹo**: Cập nhật lịch rảnh thường xuyên để tìm được nhiều bạn học hơn!`,
      },
      {
        title: 'Tính năng mới: Quản lý nhóm học tập 👨‍👩‍👧‍👦',
        content: `**Giới thiệu tính năng Nhóm học tập:**

Bạn có thể tạo nhóm học tập riêng hoặc tham gia các nhóm có sẵn:

- **Public Group**: Ai cũng có thể xem và tham gia
- **Private Group**: Chỉ thành viên được mời mới thấy

**Trong nhóm bạn có thể:**
- Tạo slot học nhóm
- Quản lý thành viên
- Chia sẻ tài liệu
- Thảo luận về bài tập

Hãy tạo nhóm đầu tiên của bạn ngay hôm nay! 🚀`,
      },
      {
        title: 'Lịch học tuần này - Các buổi học đáng chú ý 📚',
        content: `**Các buổi học nổi bật tuần này:**

🌅 **Buổi sáng (9:00 - 11:00)**
- SE Study Group: Ôn tập PRN231
- AI Research: Thảo luận về Deep Learning

🌤️ **Buổi chiều (14:00 - 16:00)**
- Database Masters: Workshop về SQL Optimization
- Web Dev Club: React Hooks advanced

🌙 **Buổi tối (19:00 - 21:00)**
- Private study sessions

Đăng ký tham gia ngay để không bỏ lỡ!`,
      },
      {
        title: 'Tips học tập hiệu quả từ cộng đồng 💡',
        content: `**Chia sẻ từ các bạn học tập xuất sắc:**

1. **Học nhóm 2-3 người** hiệu quả hơn học một mình
2. **Đặt mục tiêu cụ thể** cho mỗi buổi học
3. **Chia sẻ tài liệu** với nhau để học đa chiều
4. **Giải thích cho người khác** giúp bạn hiểu sâu hơn
5. **Nghỉ giải lao 5-10 phút** sau mỗi 50 phút học

📌 **Nhớ**: Học nhóm không phải để chép bài, mà để hiểu bài!

Chúc các bạn học tập hiệu quả! 🎓`,
      },
    ];

    if (!admin) {
      throw new Error('Admin not found. Cannot create news.');
    }

    for (const news of newsData) {
      await newsService.createNews(admin.id, news.title, news.content);
    }

    console.log(`✅ Đã tạo ${newsData.length} news articles\n`);

    // 10. Seed Availabilities
    console.log('🕒 Đang seed availabilities...');
    let availabilityCount = 0;

    // Mỗi user có vài availability trong tuần tới
    for (let i = 0; i < demoUsers.length; i++) {
      const user = demoUsers[i];

      // Tạo 3-5 availability cho mỗi user
      const numAvailabilities = 3 + (i % 3);

      for (let j = 0; j < numAvailabilities; j++) {
        const date = new Date();
        date.setDate(date.getDate() + j + 1);
        date.setHours(0, 0, 0, 0);

        const timeSlots = [
          { start: '08:00', end: '10:00' },
          { start: '10:00', end: '12:00' },
          { start: '13:00', end: '15:00' },
          { start: '15:00', end: '17:00' },
          { start: '18:00', end: '20:00' },
        ];

        const timeSlot = timeSlots[(i + j) % timeSlots.length];

        try {
          await availabilityService.create({
            user_id: user.id,
            day_of_week: date.getDay(),
            start_time: timeSlot.start,
            end_time: timeSlot.end,
          });
          availabilityCount++;
        } catch {
          // Đã tồn tại
        }
      }
    }

    console.log(`✅ Đã tạo ${availabilityCount} availabilities\n`);

    // Summary
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║   🎉 SEED DATABASE HOÀN TẤT!              ║');
    console.log('╚════════════════════════════════════════════╝\n');

    console.log('📊 TỔNG KẾT:');
    console.log('├─ 📚 Majors:', majors.length);
    console.log('├─ 📖 Courses:', courses.length);
    console.log('├─ 🔗 Major-Courses:', majorCourseCount);
    console.log('├─ 👥 Users:', demoUsers.length + 1, '(bao gồm 1 admin)');
    console.log('├─ 🤝 Friendships:', friendshipCount);
    console.log('├─ 👨‍👩‍👧‍👦 Groups:', groups.length);
    console.log('├─ 📅 Slots:', slotCount);
    console.log('├─ 📰 News:', newsData.length);
    console.log('└─ 🕒 Availabilities:', availabilityCount);

    console.log('\n📝 THÔNG TIN ĐĂNG NHẬP:\n');
    console.log('┌─────────────────────────────────────────────┐');
    console.log('│ 👑 Admin Account:                           │');
    console.log('│    Email: admin123@gmail.com                │');
    console.log('│    Password: 123                            │');
    console.log('├─────────────────────────────────────────────┤');
    console.log('│ 👤 Demo Users:                              │');
    console.log('│    Email: user1@fpt.edu.vn                  │');
    console.log('│    Email: user2@fpt.edu.vn                  │');
    console.log('│    Email: user3@fpt.edu.vn                  │');
    console.log('│    ...                                      │');
    console.log('│    Password: 123                            │');
    console.log('└─────────────────────────────────────────────┘\n');
  } catch (error) {
    console.error('\n❌ LỖI KHI SEED DATABASE:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run seed
seed()
  .then(() => {
    console.log('✅ Seed script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });
