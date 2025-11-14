# 🧪 API Testing Examples - Phase 3 Real-time Features

## 📋 Base URL
```
http://localhost:3000/api
```

## 🔐 Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📅 Slot Approval System APIs

### 1. **Create Group Slot (Member)**
Member creates a slot that requires leader approval.

**Endpoint:** `POST /slots/group`

**Request Body:**
```json
{
  "groupId": "507f1f77bcf86cd799439011",
  "title": "Học nhóm môn Database",
  "description": "Ôn tập chương 3 - Normalization",
  "startTime": "2025-11-20T14:00:00Z",
  "endTime": "2025-11-20T16:00:00Z",
  "attachments": []
}
```

**Response (201):**
```json
{
  "_id": "673abc123def456789012345",
  "title": "Học nhóm môn Database",
  "description": "Ôn tập chương 3 - Normalization",
  "start_time": "2025-11-20T14:00:00.000Z",
  "end_time": "2025-11-20T16:00:00.000Z",
  "created_by": "691421b2c566a266c2ea1c59",
  "slot_type": "Group",
  "status": "PENDING",
  "approved_by": null,
  "approved_at": null,
  "createdAt": "2025-11-14T10:30:00.000Z"
}
```

**WebSocket Event Emitted:**
```json
// Sent to Leader's socket
{
  "event": "newNotification",
  "data": {
    "_id": "notification_id",
    "type": "slot_approval_request",
    "title": "Yêu cầu phê duyệt lịch học",
    "description": "Nguyễn Văn A đã tạo lịch học \"Học nhóm môn Database\" và đang chờ phê duyệt",
    "metadata": {
      "slot_id": "673abc123def456789012345",
      "group_id": "507f1f77bcf86cd799439011",
      "creator_id": "691421b2c566a266c2ea1c59",
      "creator_name": "Nguyễn Văn A",
      "slot_title": "Học nhóm môn Database",
      "start_time": "2025-11-20T14:00:00.000Z",
      "end_time": "2025-11-20T16:00:00.000Z"
    }
  }
}
```

---

### 2. **Approve Slot (Leader Only)**
Leader approves a pending slot.

**Endpoint:** `POST /slots/:slotId/approve`

**URL Params:**
- `slotId` - ID of the slot to approve

**Response (200):**
```json
{
  "_id": "673abc123def456789012345",
  "title": "Học nhóm môn Database",
  "status": "APPROVED",
  "approved_by": "507f1f77bcf86cd799439012",
  "approved_at": "2025-11-14T10:35:00.000Z",
  // ... other slot fields
}
```

**WebSocket Events Emitted:**
```json
// 1. Personal notification to Creator
{
  "event": "newNotification",
  "data": {
    "type": "slot_approved",
    "title": "Lịch học đã được phê duyệt",
    "description": "Trần Văn B đã phê duyệt lịch học \"Học nhóm môn Database\"",
    "metadata": {
      "slot_id": "673abc123def456789012345",
      "group_id": "507f1f77bcf86cd799439011",
      "approved_by": "507f1f77bcf86cd799439012",
      "approved_by_name": "Trần Văn B"
    }
  }
}

// 2. Broadcast to all clients
{
  "event": "slotStatusUpdated",
  "data": {
    "slotId": "673abc123def456789012345",
    "status": "APPROVED",
    "approvedBy": "507f1f77bcf86cd799439012",
    "approvedAt": "2025-11-14T10:35:00.000Z"
  }
}
```

---

### 3. **Reject Slot (Leader Only)**
Leader rejects a pending slot with reason.

**Endpoint:** `POST /slots/:slotId/reject`

**URL Params:**
- `slotId` - ID of the slot to reject

**Request Body:**
```json
{
  "reason": "Thời gian trùng với lịch học khác"
}
```

**Response (200):**
```json
{
  "_id": "673abc123def456789012345",
  "title": "Học nhóm môn Database",
  "status": "REJECTED",
  "rejection_reason": "Thời gian trùng với lịch học khác",
  // ... other slot fields
}
```

**WebSocket Events Emitted:**
```json
// 1. Personal notification to Creator
{
  "event": "newNotification",
  "data": {
    "type": "slot_rejected",
    "title": "Lịch học bị từ chối",
    "description": "Trần Văn B đã từ chối lịch học \"Học nhóm môn Database\"",
    "metadata": {
      "slot_id": "673abc123def456789012345",
      "group_id": "507f1f77bcf86cd799439011",
      "rejected_by": "507f1f77bcf86cd799439012",
      "rejected_by_name": "Trần Văn B",
      "reason": "Thời gian trùng với lịch học khác"
    }
  }
}

// 2. Broadcast to all clients
{
  "event": "slotStatusUpdated",
  "data": {
    "slotId": "673abc123def456789012345",
    "status": "REJECTED",
    "rejectedBy": "507f1f77bcf86cd799439012",
    "rejectionReason": "Thời gian trùng với lịch học khác"
  }
}
```

---

## ✅ Task Assignment System APIs

### 4. **Create Task for Slot**
Creator/Leader creates a task for a slot.

**Endpoint:** `POST /tasks/slot/:slotId`

**URL Params:**
- `slotId` - ID of the slot

**Request Body:**
```json
{
  "title": "Chuẩn bị slide thuyết trình",
  "description": "Làm slide cho phần Normalization",
  "dueDate": "2025-11-19T23:59:59Z",
  "priority": "High"
}
```

**Response (201):**
```json
{
  "_id": "673task123def456789012345",
  "title": "Chuẩn bị slide thuyết trình",
  "description": "Làm slide cho phần Normalization",
  "created_by": "691421b2c566a266c2ea1c59",
  "slot_id": "673abc123def456789012345",
  "due_date": "2025-11-19T23:59:59.000Z",
  "priority": "High",
  "status": "Todo",
  "createdAt": "2025-11-14T10:40:00.000Z"
}
```

**WebSocket Event Emitted:**
```json
// Broadcast to all clients
{
  "event": "taskCreated",
  "data": {
    "taskId": "673task123def456789012345",
    "slotId": "673abc123def456789012345",
    "title": "Chuẩn bị slide thuyết trình",
    "description": "Làm slide cho phần Normalization",
    "dueDate": "2025-11-19T23:59:59.000Z",
    "priority": "High",
    "createdBy": "691421b2c566a266c2ea1c59",
    "createdAt": "2025-11-14T10:40:00.000Z"
  }
}
```

---

### 5. **Assign Task to User**
Leader assigns task to a member.

**Endpoint:** `POST /tasks/:taskId/assign`

**URL Params:**
- `taskId` - ID of the task

**Request Body:**
```json
{
  "userIds": ["68e0fdea8aefdb65e7377b3c"]
}
```

**Response (201):**
```json
{
  "message": "Đã giao task thành công",
  "assignments": [
    {
      "_id": "673assign123def456789012345",
      "task_id": "673task123def456789012345",
      "user_id": "68e0fdea8aefdb65e7377b3c",
      "assigned_by": "691421b2c566a266c2ea1c59",
      "status": "Pending",
      "assigned_at": "2025-11-14T10:45:00.000Z"
    }
  ]
}
```

**WebSocket Event Emitted:**
```json
// Sent to assigned user's socket
{
  "event": "newNotification",
  "data": {
    "type": "task_assigned",
    "title": "Task mới được giao",
    "description": "Trần Văn B đã giao task \"Chuẩn bị slide thuyết trình\" cho bạn",
    "metadata": {
      "task_id": "673task123def456789012345",
      "slot_id": "673abc123def456789012345",
      "assigned_by": "691421b2c566a266c2ea1c59",
      "assigned_by_name": "Trần Văn B",
      "task_title": "Chuẩn bị slide thuyết trình",
      "due_date": "2025-11-19T23:59:59.000Z"
    }
  }
}
```

---

### 6. **Update Assignment Status - Start Task**
User starts working on assigned task.

**Endpoint:** `PUT /tasks/assignment/:assignmentId/status`

**URL Params:**
- `assignmentId` - ID of the assignment

**Request Body:**
```json
{
  "status": "InProgress"
}
```

**Response (200):**
```json
{
  "_id": "673assign123def456789012345",
  "status": "InProgress",
  "started_at": "2025-11-14T11:00:00.000Z",
  // ... other fields
}
```

**WebSocket Event Emitted:**
```json
// Broadcast to all clients
{
  "event": "taskStatusUpdated",
  "data": {
    "taskId": "673task123def456789012345",
    "assignmentId": "673assign123def456789012345",
    "userId": "68e0fdea8aefdb65e7377b3c",
    "status": "InProgress",
    "startedAt": "2025-11-14T11:00:00.000Z"
  }
}
```

---

### 7. **Update Assignment Status - Complete Task**
User completes the task with completion note.

**Endpoint:** `PUT /tasks/assignment/:assignmentId/status`

**Request Body:**
```json
{
  "status": "Completed",
  "completionNote": "Đã hoàn thành 30 slides, bao gồm đầy đủ ví dụ và demo"
}
```

**Response (200):**
```json
{
  "_id": "673assign123def456789012345",
  "status": "Completed",
  "completed_at": "2025-11-18T16:30:00.000Z",
  "completion_note": "Đã hoàn thành 30 slides, bao gồm đầy đủ ví dụ và demo",
  // ... other fields
}
```

**WebSocket Events Emitted:**
```json
// 1. Personal notification to Task Creator
{
  "event": "newNotification",
  "data": {
    "type": "task_completed",
    "title": "Task đã hoàn thành",
    "description": "Nguyễn Văn C đã hoàn thành task \"Chuẩn bị slide thuyết trình\"",
    "metadata": {
      "task_id": "673task123def456789012345",
      "slot_id": "673abc123def456789012345",
      "completed_by": "68e0fdea8aefdb65e7377b3c",
      "completed_by_name": "Nguyễn Văn C",
      "completion_note": "Đã hoàn thành 30 slides, bao gồm đầy đủ ví dụ và demo"
    }
  }
}

// 2. Broadcast to all clients
{
  "event": "taskStatusUpdated",
  "data": {
    "taskId": "673task123def456789012345",
    "assignmentId": "673assign123def456789012345",
    "userId": "68e0fdea8aefdb65e7377b3c",
    "status": "Completed",
    "completedAt": "2025-11-18T16:30:00.000Z",
    "completionNote": "Đã hoàn thành 30 slides, bao gồm đầy đủ ví dụ và demo"
  }
}
```

---

### 8. **Unassign Task**
Leader removes user from task assignment.

**Endpoint:** `DELETE /tasks/:taskId/unassign/:userId`

**URL Params:**
- `taskId` - ID of the task
- `userId` - ID of the user to unassign

**Response (200):**
```json
{
  "success": true
}
```

**WebSocket Events Emitted:**
```json
// 1. Personal notification to unassigned user
{
  "event": "newNotification",
  "data": {
    "type": "task_unassigned",
    "title": "Đã bị gỡ khỏi task",
    "description": "Trần Văn B đã gỡ bạn khỏi task \"Chuẩn bị slide thuyết trình\"",
    "metadata": {
      "task_id": "673task123def456789012345",
      "slot_id": "673abc123def456789012345",
      "unassigned_by": "691421b2c566a266c2ea1c59",
      "unassigned_by_name": "Trần Văn B",
      "task_title": "Chuẩn bị slide thuyết trình"
    }
  }
}

// 2. Broadcast to all clients
{
  "event": "taskUnassigned",
  "data": {
    "taskId": "673task123def456789012345",
    "userId": "68e0fdea8aefdb65e7377b3c",
    "unassignedBy": "691421b2c566a266c2ea1c59",
    "unassignedAt": "2025-11-14T12:00:00.000Z"
  }
}
```

---

## 🧪 Testing Workflow

### Complete User Journey Test

```bash
# 1. Member creates slot requiring approval
POST /slots/group
# → Leader receives notification via WebSocket

# 2. Leader approves the slot
POST /slots/:slotId/approve
# → Member receives approval notification
# → All clients see status update

# 3. Leader creates task for the slot
POST /tasks/slot/:slotId
# → All clients see new task

# 4. Leader assigns task to member
POST /tasks/:taskId/assign
# → Member receives assignment notification

# 5. Member starts working
PUT /tasks/assignment/:assignmentId/status
Body: { "status": "InProgress" }
# → All clients see status change

# 6. Member completes task
PUT /tasks/assignment/:assignmentId/status
Body: { "status": "Completed", "completionNote": "Done!" }
# → Leader receives completion notification
# → All clients see status change
```

---

## 🔍 WebSocket Testing

### Connect to WebSocket
```javascript
const socket = io('http://localhost:3000/notifications', {
  query: { userId: 'YOUR_USER_ID' }
});

socket.on('connect', () => {
  console.log('Connected to WebSocket');
  socket.emit('subscribeNotifications', { userId: 'YOUR_USER_ID' });
});

// Listen to events
socket.on('newNotification', (data) => {
  console.log('New notification:', data);
});

socket.on('taskStatusUpdated', (data) => {
  console.log('Task status updated:', data);
});

socket.on('slotStatusUpdated', (data) => {
  console.log('Slot status updated:', data);
});

socket.on('taskCreated', (data) => {
  console.log('New task created:', data);
});

socket.on('taskUnassigned', (data) => {
  console.log('Task unassigned:', data);
});
```

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Slot này không cần phê duyệt",
  "error": "Bad Request"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Chỉ lãnh đạo nhóm mới có thể phê duyệt slot",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Không tìm thấy slot",
  "error": "Not Found"
}
```

---

## 📝 Postman Collection

### Import this into Postman:

```json
{
  "info": {
    "name": "Study Together - Phase 3 Real-time APIs",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Slot Approval",
      "item": [
        {
          "name": "Create Group Slot (Member)",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{jwt_token}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"groupId\": \"{{group_id}}\",\n  \"title\": \"Học nhóm môn Database\",\n  \"description\": \"Ôn tập chương 3\",\n  \"startTime\": \"2025-11-20T14:00:00Z\",\n  \"endTime\": \"2025-11-20T16:00:00Z\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{base_url}}/slots/group",
              "host": ["{{base_url}}"],
              "path": ["slots", "group"]
            }
          }
        },
        {
          "name": "Approve Slot (Leader)",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{jwt_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/slots/:slotId/approve",
              "host": ["{{base_url}}"],
              "path": ["slots", ":slotId", "approve"],
              "variable": [
                {
                  "key": "slotId",
                  "value": "{{slot_id}}"
                }
              ]
            }
          }
        },
        {
          "name": "Reject Slot (Leader)",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{jwt_token}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"reason\": \"Thời gian trùng lịch\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{base_url}}/slots/:slotId/reject",
              "host": ["{{base_url}}"],
              "path": ["slots", ":slotId", "reject"],
              "variable": [
                {
                  "key": "slotId",
                  "value": "{{slot_id}}"
                }
              ]
            }
          }
        }
      ]
    },
    {
      "name": "Task Assignment",
      "item": [
        {
          "name": "Create Task",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{jwt_token}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"title\": \"Chuẩn bị slide\",\n  \"description\": \"Làm slide phần Normalization\",\n  \"dueDate\": \"2025-11-19T23:59:59Z\",\n  \"priority\": \"High\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{base_url}}/tasks/slot/:slotId",
              "host": ["{{base_url}}"],
              "path": ["tasks", "slot", ":slotId"],
              "variable": [
                {
                  "key": "slotId",
                  "value": "{{slot_id}}"
                }
              ]
            }
          }
        },
        {
          "name": "Assign Task",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{jwt_token}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"userIds\": [\"{{member_user_id}}\"]\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{base_url}}/tasks/:taskId/assign",
              "host": ["{{base_url}}"],
              "path": ["tasks", ":taskId", "assign"],
              "variable": [
                {
                  "key": "taskId",
                  "value": "{{task_id}}"
                }
              ]
            }
          }
        },
        {
          "name": "Start Task (InProgress)",
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{jwt_token}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"status\": \"InProgress\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{base_url}}/tasks/assignment/:assignmentId/status",
              "host": ["{{base_url}}"],
              "path": ["tasks", "assignment", ":assignmentId", "status"],
              "variable": [
                {
                  "key": "assignmentId",
                  "value": "{{assignment_id}}"
                }
              ]
            }
          }
        },
        {
          "name": "Complete Task",
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{jwt_token}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"status\": \"Completed\",\n  \"completionNote\": \"Đã hoàn thành\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{base_url}}/tasks/assignment/:assignmentId/status",
              "host": ["{{base_url}}"],
              "path": ["tasks", "assignment", ":assignmentId", "status"],
              "variable": [
                {
                  "key": "assignmentId",
                  "value": "{{assignment_id}}"
                }
              ]
            }
          }
        },
        {
          "name": "Unassign Task",
          "request": {
            "method": "DELETE",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{jwt_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/tasks/:taskId/unassign/:userId",
              "host": ["{{base_url}}"],
              "path": ["tasks", ":taskId", "unassign", ":userId"],
              "variable": [
                {
                  "key": "taskId",
                  "value": "{{task_id}}"
                },
                {
                  "key": "userId",
                  "value": "{{member_user_id}}"
                }
              ]
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000/api"
    },
    {
      "key": "jwt_token",
      "value": "YOUR_JWT_TOKEN"
    },
    {
      "key": "group_id",
      "value": "GROUP_ID"
    },
    {
      "key": "slot_id",
      "value": "SLOT_ID"
    },
    {
      "key": "task_id",
      "value": "TASK_ID"
    },
    {
      "key": "assignment_id",
      "value": "ASSIGNMENT_ID"
    },
    {
      "key": "member_user_id",
      "value": "MEMBER_USER_ID"
    }
  ]
}
```

---

## 🎯 Quick Test Checklist

- [ ] Member creates slot → Leader receives notification
- [ ] Leader approves slot → Member receives notification + status broadcast
- [ ] Leader rejects slot → Member receives notification + status broadcast
- [ ] Leader creates task → All clients see new task
- [ ] Leader assigns task → Member receives notification
- [ ] Member starts task → All clients see status update
- [ ] Member completes task → Leader receives notification + status broadcast
- [ ] Leader unassigns task → Member receives notification + broadcast

---

**Ready for production testing!** 🚀
