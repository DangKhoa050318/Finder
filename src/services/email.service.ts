import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '../shared/config.service';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.env.mailUser,
        pass: this.configService.env.mailPass,
      },
    });
  }

  /**
   * Send OTP email for password reset
   */
  async sendOtpEmail(email: string, otp: string, fullName: string): Promise<void> {
    const mailOptions = {
      from: `"Finder - Study Together" <${this.configService.env.mailUser}>`,
      to: email,
      subject: 'Mã OTP đặt lại mật khẩu - Finder',
      html: this.getOtpEmailTemplate(otp, fullName),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ [EMAIL] OTP sent successfully to ${email}`);
    } catch (error) {
      console.error(`❌ [EMAIL] Failed to send OTP to ${email}:`, error);
      throw new Error('Không thể gửi email. Vui lòng thử lại sau.');
    }
  }

  /**
   * Generate OTP email template
   */
  private getOtpEmailTemplate(otp: string, fullName: string): string {
    return `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mã OTP đặt lại mật khẩu</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            color: #333333;
            margin-bottom: 20px;
          }
          .message {
            font-size: 16px;
            color: #555555;
            line-height: 1.6;
            margin-bottom: 30px;
          }
          .otp-box {
            background-color: #f8f9fa;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 25px;
            text-align: center;
            margin: 30px 0;
          }
          .otp-label {
            font-size: 14px;
            color: #666666;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .otp-code {
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .warning-text {
            font-size: 14px;
            color: #856404;
            margin: 0;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            font-size: 14px;
            color: #666666;
          }
          .footer a {
            color: #667eea;
            text-decoration: none;
          }
          .security-note {
            font-size: 13px;
            color: #999999;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #eeeeee;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Đặt lại mật khẩu</h1>
          </div>
          
          <div class="content">
            <div class="greeting">
              Xin chào <strong>${fullName}</strong>,
            </div>
            
            <div class="message">
              Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản Finder của bạn. 
              Vui lòng sử dụng mã OTP bên dưới để tiếp tục quá trình đặt lại mật khẩu.
            </div>
            
            <div class="otp-box">
              <div class="otp-label">Mã OTP của bạn</div>
              <div class="otp-code">${otp}</div>
            </div>
            
            <div class="warning">
              <p class="warning-text">
                ⏰ <strong>Lưu ý quan trọng:</strong> Mã OTP này sẽ hết hạn sau <strong>15 phút</strong>. 
                Vui lòng hoàn tất quá trình đặt lại mật khẩu trước thời gian này.
              </p>
            </div>
            
            <div class="message">
              Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. 
              Tài khoản của bạn vẫn an toàn và không có thay đổi nào được thực hiện.
            </div>
            
            <div class="security-note">
              🔒 <strong>Bảo mật:</strong> Không chia sẻ mã OTP này với bất kỳ ai. 
              Đội ngũ Finder sẽ không bao giờ yêu cầu mã OTP của bạn qua email hoặc điện thoại.
            </div>
          </div>
          
          <div class="footer">
            <p>
              Cần hỗ trợ? Liên hệ với chúng tôi tại 
              <a href="mailto:${this.configService.env.mailUser}">${this.configService.env.mailUser}</a>
            </p>
            <p style="margin-top: 10px; color: #999999;">
              © 2025 Finder - Study Together. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send OTP email for registration verification
   */
  async sendRegistrationOtpEmail(email: string, otp: string, fullName: string): Promise<void> {
    const mailOptions = {
      from: `"Finder - Study Together" <${this.configService.env.mailUser}>`,
      to: email,
      subject: 'Mã OTP xác thực đăng ký - Finder',
      html: this.getRegistrationOtpEmailTemplate(otp, fullName),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ [EMAIL] Registration OTP sent successfully to ${email}`);
    } catch (error) {
      console.error(`❌ [EMAIL] Failed to send registration OTP to ${email}:`, error);
      throw new Error('Không thể gửi email. Vui lòng thử lại sau.');
    }
  }

  /**
   * Send password reset success notification
   */
  async sendPasswordResetSuccessEmail(email: string, fullName: string): Promise<void> {
    const mailOptions = {
      from: `"Finder - Study Together" <${this.configService.env.mailUser}>`,
      to: email,
      subject: 'Mật khẩu đã được đặt lại thành công - Finder',
      html: this.getPasswordResetSuccessTemplate(fullName),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ [EMAIL] Password reset success notification sent to ${email}`);
    } catch (error) {
      console.error(`❌ [EMAIL] Failed to send success notification to ${email}:`, error);
      // Don't throw error here as password is already reset
    }
  }

  /**
   * Generate registration OTP email template
   */
  private getRegistrationOtpEmailTemplate(otp: string, fullName: string): string {
    return `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Xác thực đăng ký tài khoản</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            color: #333333;
            margin-bottom: 20px;
          }
          .message {
            font-size: 16px;
            color: #555555;
            line-height: 1.6;
            margin-bottom: 30px;
          }
          .otp-box {
            background-color: #f8f9fa;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 25px;
            text-align: center;
            margin: 30px 0;
          }
          .otp-label {
            font-size: 14px;
            color: #666666;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .otp-code {
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .warning-text {
            font-size: 14px;
            color: #856404;
            margin: 0;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            font-size: 14px;
            color: #666666;
          }
          .footer a {
            color: #667eea;
            text-decoration: none;
          }
          .security-note {
            font-size: 13px;
            color: #999999;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #eeeeee;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Chào mừng đến với Finder!</h1>
          </div>
          
          <div class="content">
            <div class="greeting">
              Xin chào <strong>${fullName}</strong>,
            </div>
            
            <div class="message">
              Cảm ơn bạn đã đăng ký tài khoản Finder - Study Together! 
              Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã OTP bên dưới để xác thực email của bạn.
            </div>
            
            <div class="otp-box">
              <div class="otp-label">Mã OTP của bạn</div>
              <div class="otp-code">${otp}</div>
            </div>
            
            <div class="warning">
              <p class="warning-text">
                ⏰ <strong>Lưu ý quan trọng:</strong> Mã OTP này sẽ hết hạn sau <strong>15 phút</strong>. 
                Vui lòng hoàn tất quá trình xác thực trước thời gian này.
              </p>
            </div>
            
            <div class="message">
              Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này. 
              Không có tài khoản nào được tạo nếu bạn không xác thực mã OTP.
            </div>
            
            <div class="security-note">
              🔒 <strong>Bảo mật:</strong> Không chia sẻ mã OTP này với bất kỳ ai. 
              Đội ngũ Finder sẽ không bao giờ yêu cầu mã OTP của bạn qua email hoặc điện thoại.
            </div>
          </div>
          
          <div class="footer">
            <p>
              Cần hỗ trợ? Liên hệ với chúng tôi tại 
              <a href="mailto:${this.configService.env.mailUser}">${this.configService.env.mailUser}</a>
            </p>
            <p style="margin-top: 10px; color: #999999;">
              © 2025 Finder - Study Together. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate password reset success email template
   */
  private getPasswordResetSuccessTemplate(fullName: string): string {
    return `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mật khẩu đã được đặt lại</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: #ffffff;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
          }
          .success-icon {
            text-align: center;
            font-size: 64px;
            margin-bottom: 20px;
          }
          .message {
            font-size: 16px;
            color: #555555;
            line-height: 1.6;
            margin-bottom: 20px;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            font-size: 14px;
            color: #666666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Đặt lại mật khẩu thành công</h1>
          </div>
          
          <div class="content">
            <div class="success-icon">🎉</div>
            
            <div class="message">
              Xin chào <strong>${fullName}</strong>,
            </div>
            
            <div class="message">
              Mật khẩu của bạn đã được đặt lại thành công. Bạn có thể đăng nhập vào tài khoản Finder 
              của mình bằng mật khẩu mới.
            </div>
            
            <div class="message">
              Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ với chúng tôi ngay lập tức 
              để bảo vệ tài khoản của bạn.
            </div>
          </div>
          
          <div class="footer">
            <p>
              Cần hỗ trợ? Liên hệ với chúng tôi tại 
              <a href="mailto:${this.configService.env.mailUser}">${this.configService.env.mailUser}</a>
            </p>
            <p style="margin-top: 10px; color: #999999;">
              © 2025 Finder - Study Together. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

