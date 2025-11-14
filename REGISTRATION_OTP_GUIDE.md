# Hướng Dẫn Sử Dụng Tính Năng OTP Verification và Google OAuth

## ✨ Tính Năng Đã Hoàn Thành

### 1. **Đăng Ký Với OTP Verification**

#### Flow mới:
1. User điền form đăng ký (họ tên, email, mật khẩu)
2. Backend lưu thông tin vào `PendingRegistration` collection
3. Gửi OTP 6 số qua email (có hiệu lực 15 phút)
4. User nhập OTP trên trang `/auth/verify-email`
5. Sau khi verify thành công → Tạo user trong database
6. Redirect đến trang đăng nhập

#### Backend Endpoints:
- `POST /api/auth/register` - Đăng ký và gửi OTP
- `POST /api/auth/verify-registration-otp` - Xác thực OTP đăng ký
- `POST /api/auth/resend-registration-otp` - Gửi lại OTP

#### Database Schema:
```typescript
// PendingRegistration Collection
{
  full_name: string;
  email: string;
  password: string; // đã hash
  otp: string;
  otpExpiry: Date;
  provider: 'local' | 'google';
}

// User Schema - Thêm fields
{
  isVerified: boolean; // default: false
  provider: string; // 'local' | 'google'
  googleId?: string;
}
```

### 2. **Google OAuth Integration** (Backend Ready)

#### Flow:
1. User click "Đăng nhập bằng Google"
2. Frontend lấy Google ID Token
3. Gửi token đến `POST /api/auth/google`
4. Backend verify token với Google
5. **Nếu user đã tồn tại**: Trả về access_token → Đăng nhập
6. **Nếu user mới**:
   - Tạo PendingRegistration với provider='google'
   - Gửi OTP qua email
   - Frontend navigate đến `/auth/verify-email`
   - User verify OTP → Tạo user
   - Hiển thị popup đặt mật khẩu (SetPasswordDialog)
   - Gọi `POST /api/auth/set-password-after-google`
   - Đăng nhập thành công

#### Backend Endpoints:
- `POST /api/auth/google` - Xác thực Google ID Token
  ```typescript
  Body: { idToken: string }
  Response: {
    message: string;
    requiresOtpVerification: boolean;
    email?: string; // nếu cần verify
    access_token?: string; // nếu đã tồn tại
    user?: IUser;
  }
  ```

- `POST /api/auth/set-password-after-google` - Đặt mật khẩu sau Google OAuth
  ```typescript
  Body: { email: string, password: string }
  Response: {
    message: string;
    access_token: string;
    user: IUser;
  }
  ```

## 🚀 Các Bước Triển Khai Tiếp Theo

### Frontend: Tích hợp Google Sign-In

1. **Cài đặt Google Identity Services**
   ```bash
   npm install @react-oauth/google
   ```

2. **Lấy Google Client ID** từ [Google Cloud Console](https://console.cloud.google.com/)
   - Tạo OAuth 2.0 Client ID
   - Thêm authorized origins: `http://localhost:5173`, `https://your-domain.com`
   - Lưu Client ID vào `.env`:
     ```
     VITE_GOOGLE_CLIENT_ID=your_client_id_here
     ```

3. **Wrap App với GoogleOAuthProvider** (trong `root.tsx` hoặc `app.tsx`)
   ```tsx
   import { GoogleOAuthProvider } from '@react-oauth/google';
   
   <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
     <App />
   </GoogleOAuthProvider>
   ```

4. **Cập nhật `signIn.tsx` và `signUp.tsx`**
   
   Thay thế placeholder trong `handleGoogleSignIn`:
   ```tsx
   import { useGoogleLogin } from '@react-oauth/google';
   
   const googleLogin = useGoogleLogin({
     onSuccess: async (response) => {
       // response.credential chứa ID token
       googleAuthMutation.mutate(
         { idToken: response.credential },
         {
           onSuccess: (data) => {
             if (data.data.requiresOtpVerification) {
               // Navigate đến verify OTP
               navigate(`/auth/verify-email?email=${data.data.email}`);
             } else {
               // Đăng nhập thành công
               sessionStorage.setItem(
                 LOCAL_STORAGE_KEYS.ACCESS_TOKEN,
                 data.data.access_token!
               );
               navigate('/dashboard');
             }
           },
         }
       );
     },
     onError: () => {
       toast.error('Đăng nhập Google thất bại');
     },
   });
   
   const handleGoogleSignIn = () => {
     googleLogin();
   };
   ```

5. **Cập nhật `verifyEmail.tsx`**
   
   Thêm logic kiểm tra provider để hiển thị SetPasswordDialog:
   ```tsx
   const [needsPassword, setNeedsPassword] = useState(false);
   const [verifiedEmail, setVerifiedEmail] = useState("");
   
   const onSubmit = async (data: VerifyEmailForm) => {
     if (!email) return;
   
     verifyEmailMutation.mutate(
       { email, otp: data.otp },
       {
         onSuccess: () => {
           // Check if this is Google OAuth registration
           const isGoogleAuth = searchParams.get('provider') === 'google';
           
           if (isGoogleAuth) {
             setVerifiedEmail(email);
             setNeedsPassword(true);
           } else {
             navigate('/auth/signIn');
           }
         }
       }
     );
   };
   
   // Add at the end of component
   <SetPasswordDialog
     open={needsPassword}
     onOpenChange={setNeedsPassword}
     email={verifiedEmail}
     onSuccess={(accessToken) => {
       sessionStorage.setItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
       navigate('/dashboard');
     }}
   />
   ```

## 📧 Email Templates

Đã tạo 2 email templates:

1. **Registration OTP Email** (`sendRegistrationOtpEmail`)
   - Subject: "Mã OTP xác thực đăng ký - Finder"
   - Thiết kế giống reset password email
   - Chủ đề: "Chào mừng đến với Finder!"

2. **Password Reset OTP Email** (`sendOtpEmail`)
   - Subject: "Mã OTP đặt lại mật khẩu - Finder"
   - Đã có sẵn từ trước

## 🧪 Testing

### Test Registration Flow:
1. Đăng ký với email mới
2. Kiểm tra email nhận OTP
3. Nhập OTP đúng → Account được tạo
4. Thử đăng nhập với email/password vừa tạo

### Test Google OAuth (Sau khi implement frontend):
1. Click "Đăng nhập bằng Google"
2. **User đã tồn tại**: Đăng nhập trực tiếp
3. **User mới**:
   - Nhận OTP qua email
   - Verify OTP
   - Đặt mật khẩu trong popup
   - Đăng nhập thành công

### Test Cases:
- ✅ OTP hết hạn sau 15 phút
- ✅ Resend OTP tạo mã mới
- ✅ Email đã đăng ký không thể đăng ký lại
- ✅ PendingRegistration bị xóa sau khi verify thành công
- ✅ Google user phải verify OTP trước khi set password

## 📝 Notes

- **Security**: Google ID Token được verify bằng `google-auth-library`
- **Password**: Google users vẫn cần password để có thể đăng nhập bằng email/password sau này
- **OTP Expiry**: 15 phút (có thể điều chỉnh trong `AuthService.register()`)
- **Email Service**: Sử dụng Gmail SMTP (cấu hình trong `.env`)

## 🔐 Environment Variables

Backend `.env`:
```env
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
```

Frontend `.env`:
```env
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## 🐛 Troubleshooting

### Email không gửi được:
- Kiểm tra `MAIL_USER` và `MAIL_PASS`
- Gmail: Bật "App Password" thay vì mật khẩu thường
- Kiểm tra logs: `[EMAIL] Failed to send`

### Google OAuth không hoạt động:
- Verify `VITE_GOOGLE_CLIENT_ID` đúng
- Check authorized origins trong Google Console
- Xem browser console logs

### OTP không hợp lệ:
- Kiểm tra timezone server
- Verify OTP chưa hết hạn
- Check case-sensitive (OTP là chuỗi số)

## 📚 API Documentation

Swagger docs: `http://localhost:3000/api-docs`

Các endpoint mới đã được thêm vào Swagger với đầy đủ:
- Description
- Request/Response schemas
- Error codes
