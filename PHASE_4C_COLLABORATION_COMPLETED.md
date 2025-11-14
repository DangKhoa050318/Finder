# 🚀 PHASE 4C: Advanced Collaboration Features - IN PROGRESS

## 📋 Overview

Phase 4C adds real-time collaboration features to enhance teamwork and user experience:
- ✅ **Presence System** - Online/offline status tracking
- ✅ **Typing Indicators** - Show who's typing in real-time
- ✅ **Edit Locks** - Prevent conflicts in collaborative editing
- ❌ **Video/Audio Calls** - (Skipped - using Google Meet integration)

## 🎯 Features Implemented

### 1. **Presence System** ✅

Track user online status, activity, and location in real-time.

**Schema: `UserPresence`**
```typescript
{
  user_id: ObjectId,
  status: 'Online' | 'Away' | 'DoNotDisturb' | 'Offline',
  is_online: boolean,
  last_seen: Date,
  current_activity: 'viewing_slot' | 'editing_slot' | 'viewing_task' | 'editing_task' | 'in_chat' | 'idle',
  current_resource_id: ObjectId, // What they're viewing
  socket_ids: string[], // Multiple tabs support
  custom_status_message: string,
  device_info: {
    platform: string,
    browser: string,
    is_mobile: boolean
  }
}
```

**WebSocket Events:**
- `presenceUpdate` - Broadcast when user status changes
- `userActivity` - When user starts viewing/editing resource

**Use Cases:**
- Show green dot next to online users
- Display "Viewing Slot: Database Study" 
- Show last seen: "Last seen 5 minutes ago"
- Mobile/desktop indicator

---

### 2. **Typing Indicators** ✅

Show real-time typing indicators in chats and comments.

**Schema: `TypingIndicator`**
```typescript
{
  user_id: ObjectId,
  context: 'chat' | 'task_comment' | 'slot_comment',
  resource_id: ObjectId, // chat_id, task_id, or slot_id
  started_at: Date,
  expires_at: Date // Auto-expire after 5 seconds
}
```

**WebSocket Events:**
- `userTyping` - Broadcast to others in same resource
- `userStoppedTyping` - When user stops typing

**Use Cases:**
- "Nguyễn Văn A is typing..."
- Show typing indicator dots in chat
- Multiple users typing: "3 people are typing..."

---

### 3. **Edit Locks** ✅

Prevent edit conflicts with pessimistic locking.

**Schema: `EditLock`**
```typescript
{
  lock_type: 'slot' | 'task',
  resource_id: ObjectId,
  locked_by: ObjectId,
  locked_at: Date,
  expires_at: Date, // Auto-expire after 5 minutes
  socket_id: string,
  is_active: boolean
}
```

**WebSocket Events:**
- `editLockGranted` - User can start editing
- `editLockDenied` - Resource locked by someone else
- `resourceLocked` / `resourceUnlocked` - Notify others

**Use Cases:**
- Lock task when user clicks "Edit"
- Show "Being edited by Nguyễn Văn A" banner
- Auto-release lock after 5 minutes
- Manual release on save/cancel

---

## 🔌 WebSocket Integration

### **Connection Setup**

```typescript
// Connect to presence namespace
const socket = io('http://localhost:3000/presence', {
  query: { userId: currentUser._id }
});
```

### **Client-Side Implementation**

#### **1. Presence Updates**

```typescript
// Listen to presence updates
socket.on('presenceUpdate', (data) => {
  console.log(`User ${data.userId} is now ${data.status}`);
  updateUserBadge(data.userId, data.status, data.isOnline);
});

// Update your own status
socket.emit('updateStatus', {
  status: 'Away',
  customMessage: 'In a meeting'
});

// Update activity when viewing resource
socket.emit('updateActivity', {
  activity: 'viewing_slot',
  resourceId: slotId
});

// Get online users
socket.emit('getOnlineUsers', { 
  userIds: ['user1', 'user2'] // optional filter
});

socket.on('onlineUsers', (data) => {
  console.log('Online users:', data.users);
});
```

#### **2. Resource Subscriptions**

```typescript
// Subscribe to a resource (slot/task/chat)
socket.emit('subscribeToResource', {
  resourceId: slotId,
  resourceType: 'slot'
});

// Get users currently viewing this resource
socket.on('resourceUsers', (data) => {
  console.log(`${data.users.length} users viewing this slot`);
  showActiveUsers(data.users);
});

// Listen to user activities
socket.on('userActivity', (data) => {
  console.log(`${data.userId} is ${data.activity}`);
});

// Unsubscribe when leaving
socket.emit('unsubscribeFromResource', {
  resourceId: slotId
});
```

#### **3. Typing Indicators**

```typescript
let typingTimeout;

// Start typing
const handleInputChange = (text) => {
  socket.emit('startTyping', {
    context: 'chat',
    resourceId: chatId
  });

  // Auto-stop after 3 seconds of no input
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('stopTyping', {
      context: 'chat',
      resourceId: chatId
    });
  }, 3000);
};

// Listen to others typing
socket.on('userTyping', (data) => {
  showTypingIndicator(data.userId);
});

socket.on('userStoppedTyping', (data) => {
  hideTypingIndicator(data.userId);
});

// Get current typers
socket.emit('getTypingUsers', {
  context: 'chat',
  resourceId: chatId
});

socket.on('typingUsers', (data) => {
  console.log('Currently typing:', data.users);
});
```

#### **4. Edit Locks**

```typescript
// Request lock when user clicks "Edit"
const handleEditClick = () => {
  socket.emit('requestEditLock', {
    lockType: 'task',
    resourceId: taskId
  });
};

socket.on('editLockGranted', (data) => {
  // Can edit now
  enableEditMode();
  startLockRenewalTimer(data.expiresAt);
});

socket.on('editLockDenied', (data) => {
  // Someone else is editing
  showAlert(`Being edited by ${data.lockedBy} until ${data.expiresAt}`);
  showReadOnlyMode();
});

// Renew lock every 4 minutes (before 5-minute expiry)
const renewLock = () => {
  socket.emit('renewEditLock', {
    lockType: 'task',
    resourceId: taskId
  });
};

socket.on('editLockRenewed', (data) => {
  console.log('Lock extended until', data.expiresAt);
});

socket.on('editLockExpired', (data) => {
  showAlert('Your edit session expired. Please refresh.');
  disableEditMode();
});

// Release lock on save/cancel
const handleSave = () => {
  // Save data...
  socket.emit('releaseEditLock', {
    lockType: 'task',
    resourceId: taskId
  });
};

socket.on('editLockReleased', (data) => {
  disableEditMode();
});

// Listen to others' lock status
socket.on('resourceLocked', (data) => {
  showLockedBanner(data.lockedBy);
});

socket.on('resourceUnlocked', (data) => {
  hideLockedBanner();
});
```

---

## 🎨 UI/UX Examples

### **1. Online Status Badge**

```tsx
const UserAvatar = ({ user }) => {
  const [presence, setPresence] = useState(null);

  useEffect(() => {
    socket.on('presenceUpdate', (data) => {
      if (data.userId === user._id) {
        setPresence(data);
      }
    });
  }, [user._id]);

  return (
    <div className="relative">
      <Avatar src={user.avatar} />
      {presence?.isOnline && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
      )}
      {presence?.status === 'Away' && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-yellow-500 rounded-full" />
      )}
    </div>
  );
};
```

### **2. Active Users in Resource**

```tsx
const ActiveUsersList = ({ resourceId }) => {
  const [activeUsers, setActiveUsers] = useState([]);

  useEffect(() => {
    socket.emit('subscribeToResource', { resourceId, resourceType: 'slot' });

    socket.on('resourceUsers', (data) => {
      setActiveUsers(data.users);
    });

    return () => {
      socket.emit('unsubscribeFromResource', { resourceId });
    };
  }, [resourceId]);

  return (
    <div className="flex items-center gap-2">
      <Eye className="w-4 h-4" />
      <span>{activeUsers.length} viewing</span>
      <div className="flex -space-x-2">
        {activeUsers.slice(0, 3).map(user => (
          <Avatar key={user._id} src={user.user_id.avatar} size="sm" />
        ))}
        {activeUsers.length > 3 && (
          <span className="text-xs">+{activeUsers.length - 3}</span>
        )}
      </div>
    </div>
  );
};
```

### **3. Typing Indicator**

```tsx
const TypingIndicator = ({ chatId }) => {
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    socket.on('userTyping', (data) => {
      if (data.resourceId === chatId) {
        setTypingUsers(prev => [...prev, data.userId]);
      }
    });

    socket.on('userStoppedTyping', (data) => {
      if (data.resourceId === chatId) {
        setTypingUsers(prev => prev.filter(id => id !== data.userId));
      }
    });
  }, [chatId]);

  if (typingUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
      </div>
      <span>
        {typingUsers.length === 1 
          ? 'Someone is typing...'
          : `${typingUsers.length} people are typing...`
        }
      </span>
    </div>
  );
};
```

### **4. Edit Lock Banner**

```tsx
const EditLockBanner = ({ resourceId, lockType }) => {
  const [lock, setLock] = useState(null);

  useEffect(() => {
    socket.on('resourceLocked', (data) => {
      if (data.resourceId === resourceId) {
        setLock(data);
      }
    });

    socket.on('resourceUnlocked', (data) => {
      if (data.resourceId === resourceId) {
        setLock(null);
      }
    });
  }, [resourceId]);

  if (!lock) return null;

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div className="flex items-center">
        <Lock className="w-5 h-5 text-yellow-400 mr-2" />
        <p className="text-sm text-yellow-700">
          This {lockType} is currently being edited by {lock.lockedBy}
        </p>
      </div>
    </div>
  );
};
```

### **5. Edit Mode with Auto-Lock**

```tsx
const TaskEditForm = ({ task }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [hasLock, setHasLock] = useState(false);

  const handleEdit = () => {
    socket.emit('requestEditLock', {
      lockType: 'task',
      resourceId: task._id
    });
  };

  useEffect(() => {
    socket.on('editLockGranted', (data) => {
      if (data.resourceId === task._id) {
        setHasLock(true);
        setIsEditing(true);
        // Start auto-renewal
        const interval = setInterval(() => {
          socket.emit('renewEditLock', {
            lockType: 'task',
            resourceId: task._id
          });
        }, 240000); // Renew every 4 minutes

        return () => clearInterval(interval);
      }
    });

    socket.on('editLockDenied', (data) => {
      toast.error(`Being edited by someone until ${formatTime(data.expiresAt)}`);
    });
  }, [task._id]);

  const handleSave = async () => {
    // Save logic...
    socket.emit('releaseEditLock', {
      lockType: 'task',
      resourceId: task._id
    });
    setIsEditing(false);
    setHasLock(false);
  };

  return (
    <div>
      {!isEditing ? (
        <Button onClick={handleEdit}>Edit Task</Button>
      ) : hasLock ? (
        <form onSubmit={handleSave}>
          {/* Edit form */}
          <Button type="submit">Save</Button>
          <Button onClick={() => {
            socket.emit('releaseEditLock', { lockType: 'task', resourceId: task._id });
            setIsEditing(false);
          }}>
            Cancel
          </Button>
        </form>
      ) : (
        <div>Requesting edit permission...</div>
      )}
    </div>
  );
};
```

---

## 📊 Database Indexes

All schemas have optimized indexes for performance:

**UserPresence:**
- `user_id` (unique)
- `is_online`
- `status`
- `current_resource_id`
- `last_seen` (descending)

**TypingIndicator:**
- `resource_id + context`
- `expires_at` (TTL index - auto-cleanup)
- `user_id + resource_id + context` (unique)

**EditLock:**
- `resource_id + lock_type`
- `locked_by`
- `expires_at` (TTL index - auto-cleanup)
- `is_active`

---

## 🧪 Testing Guide

### **Test Presence System**

```bash
# Terminal 1: User A
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "usera@test.com", "password": "password"}'

# Connect WebSocket with userId
# Should see: "User A is online"

# Terminal 2: User B
# Should receive presenceUpdate event for User A
```

### **Test Typing Indicators**

```bash
# User A starts typing in chat
socket.emit('startTyping', { context: 'chat', resourceId: 'chat123' });

# User B (in same chat) should see:
# "User A is typing..."

# After 5 seconds of no activity:
# Typing indicator auto-clears
```

### **Test Edit Locks**

```bash
# User A clicks edit on task
socket.emit('requestEditLock', { lockType: 'task', resourceId: 'task123' });
# Response: editLockGranted

# User B tries to edit same task
socket.emit('requestEditLock', { lockType: 'task', resourceId: 'task123' });
# Response: editLockDenied (locked by User A)

# User A saves/cancels
socket.emit('releaseEditLock', { lockType: 'task', resourceId: 'task123' });

# User B can now edit
```

---

## ⚡ Performance Considerations

### **Auto-Cleanup**
- Typing indicators expire after 5 seconds (TTL index)
- Edit locks expire after 5 minutes (TTL index)
- Presence updates only on state change (not constant polling)

### **Scalability**
- Multiple socket connections per user supported
- Room-based broadcasting (only to relevant users)
- Efficient queries with proper indexes

### **Battery Optimization**
- No constant heartbeat (WebSocket handles connection)
- Events only on user action
- Auto-away detection on client side

---

## 🔒 Security

### **Authorization**
- All events require authenticated WebSocket connection
- UserId from JWT token (not client input)
- Edit locks validated against user permissions

### **Rate Limiting**
- Typing events debounced on client
- Lock renewal max once per minute
- Presence updates throttled

---

## 📱 Mobile Support

All features work on mobile with:
- Touch-friendly UI
- Battery-efficient WebSocket
- Offline handling (auto-reconnect)
- Reduced data usage (efficient payloads)

---

## 🚀 Next Steps (Phase 4D)

Possible enhancements:
1. **Presence History** - Track user activity patterns
2. **Custom Status** - Rich presence (emoji + text)
3. **Notification on Availability** - Alert when user comes online
4. **Collaborative Cursor** - Show cursor positions in real-time
5. **Edit Conflict Resolution** - Merge changes automatically
6. **Session Recording** - Record edit sessions for audit

---

## ✅ Status

**Phase 4C Progress:**
- ✅ Presence System (100%)
- ✅ Typing Indicators (100%)
- ✅ Edit Locks (100%)
- ✅ WebSocket Gateway (100%)
- ✅ Database Schemas (100%)
- ✅ Documentation (100%)
- ⏳ Frontend Integration (0%)
- ⏳ Testing (0%)

**Ready for frontend integration!** 🎉
