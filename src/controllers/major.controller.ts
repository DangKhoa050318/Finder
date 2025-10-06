import { Controller, Get } from '@nestjs/common';
import { MajorService } from '../services/major.service';

@Controller('major')
export class MajorController {
  constructor(private majorService: MajorService) {}

  @Get()
  async getMajors() {
    return this.majorService.getAll();
  }
}

