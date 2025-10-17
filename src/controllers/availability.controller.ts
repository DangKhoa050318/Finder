import { Body, Controller, Delete, Get, Param, Patch, Post, Logger } from '@nestjs/common';
import { AvailabilityService } from '../services/availability.service';

@Controller('availability')
export class AvailabilityController {
  private readonly logger = new Logger(AvailabilityController.name);
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post()
  create(@Body() body: { user_id: string; day_of_week: number; start_time: string; end_time: string }) {
    this.logger.debug(`POST /availability body=${JSON.stringify(body)}`);
    return this.availabilityService.create(body);
  }

  @Get('user/:userId')
  listByUser(@Param('userId') userId: string) {
    this.logger.debug(`GET /availability/user/${userId}`);
    return this.availabilityService.listByUser(userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: Partial<{ day_of_week: number; start_time: string; end_time: string }>,
  ) {
    this.logger.debug(`PATCH /availability/${id} body=${JSON.stringify(body)}`);
    return this.availabilityService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    this.logger.debug(`DELETE /availability/${id}`);
    return this.availabilityService.remove(id);
  }
}
