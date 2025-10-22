import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BanService } from '../services/ban.service';
import { ReminderService } from '../services/reminder.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly banService: BanService,
    private readonly reminderService: ReminderService,
  ) {}

  /**
   * Cron job: Expire old bans
   * Runs every day at midnight (00:00)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpireOldBans() {
    this.logger.log('🔄 Running cron job: Expire old bans');
    try {
      const result = await this.banService.expireOldBans();
      this.logger.log(`✅ Expired ${result.count} old bans`);
    } catch (error) {
      this.logger.error('❌ Error expiring old bans:', error);
    }
  }

  /**
   * Cron job: Send due reminders
   * Runs every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleSendDueReminders() {
    this.logger.debug('🔔 Running cron job: Send due reminders');
    try {
      const result = await this.reminderService.sendDueReminders();
      if (result.sent > 0 || result.failed > 0) {
        this.logger.log(
          `📨 Sent ${result.sent} reminders, ${result.failed} failed`,
        );
      }
    } catch (error) {
      this.logger.error('❌ Error sending due reminders:', error);
    }
  }

  /**
   * Optional: Health check every 30 minutes
   * Can be used to log system status
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  handleHealthCheck() {
    this.logger.debug('💚 Cron jobs health check - All systems operational');
  }
}
