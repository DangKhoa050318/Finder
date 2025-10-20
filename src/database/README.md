# Database Seeding

Hướng dẫn seed database cho Study Together Backend.

## 📋 Mục lục

- [Scripts có sẵn](#scripts-có-sẵn)
- [Cách sử dụng](#cách-sử-dụng)
- [Dữ liệu được seed](#dữ-liệu-được-seed)
- [Tài khoản test](#tài-khoản-test)

## 🚀 Scripts có sẵn

```bash
# Seed database với dữ liệu demo
npm run seed

# Xóa toàn bộ database
npm run db:clear

# Xóa và seed lại database
npm run seed:refresh
```

## 📖 Cách sử dụng

### 1. Seed lần đầu

```bash
npm run seed
```

### 2. Reset và seed lại

```bash
npm run seed:refresh
```

### 3. Chỉ xóa database

```bash
npm run db:clear
```

## 📊 Dữ liệu được seed

### Majors (5)

- Software Engineering (SE)
- Artificial Intelligence (AI)
- International Business (IB)
- Graphic Design (GD)
- Data Science (DS)

### Courses (10)

- PRN231 - Building Cross-Platform Back-End Application With .NET
- SWP391 - Software Development Project
- PRJ301 - Java Web Application Development
- DBI202 - Database Systems
- MAE101 - Mathematics for Engineering
- PRF192 - Programming Fundamentals
- OSG202 - Operating Systems
- NWC203 - Computer Networking
- SWE201 - Software Engineering
- MAS291 - Statistics & Probability

### Users (9)

- 1 Admin account
- 8 Demo users với thông tin đầy đủ

### Friendships (~15)

- Các kết nối bạn bè giữa demo users

### Groups (5)

- SE Study Group (Public)
- AI Research Team (Public)
- Database Masters (Public)
- Web Dev Club (Public)
- Private Study (Private)

### Slots (~20+)

- Group slots trong 7 ngày tới
- Private slots giữa các users
- Slots ở các khung giờ khác nhau (sáng, chiều, tối)

### News (5)

- Bài viết chào mừng
- Hướng dẫn sử dụng
- Giới thiệu tính năng
- Lịch học
- Tips học tập

### Availabilities (24+)

- Lịch rảnh của mỗi user trong tuần tới

## 🔑 Tài khoản test

### Admin Account

```
Email: admin123@gmail.com
Password: 123
```

### Demo Users

```
Email: user1@fpt.edu.vn
Email: user2@fpt.edu.vn
Email: user3@fpt.edu.vn
Email: user4@fpt.edu.vn
Email: user5@fpt.edu.vn
Email: user6@fpt.edu.vn
Email: user7@fpt.edu.vn
Email: user8@fpt.edu.vn

Password (cho tất cả): password123
```

## 🎨 Thông tin bổ sung

- Mỗi user có avatar được tạo tự động từ DiceBear
- Users được gán ngành học ngẫu nhiên
- Friendships được tạo để demo tính năng kết bạn
- Groups có members và leaders
- Slots được tạo trong 7 ngày tới để test calendar
- Availabilities được tạo cho mỗi user

## ⚠️ Lưu ý

- Chạy `npm run seed:refresh` sẽ **XÓA TOÀN BỘ DỮ LIỆU** hiện có
- Script seed có thể chạy nhiều lần mà không tạo duplicate (kiểm tra tồn tại)
- Tất cả passwords đã được hash với bcrypt

## 🐛 Troubleshooting

### Lỗi connection

```bash
# Đảm bảo MongoDB đang chạy
# Kiểm tra connection string trong .env
```

### Lỗi duplicate key

```bash
# Chạy clear trước khi seed
npm run db:clear
npm run seed
```

### Lỗi module not found

```bash
# Cài đặt dependencies
npm install
```
