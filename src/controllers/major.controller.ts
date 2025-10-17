import { Controller, Get } from '@nestjs/common';
import { MajorService } from '../services/major.service';
import { Public } from 'src/decorators/public.decorator';

@Controller('major')
export class MajorController {
  constructor(private majorService: MajorService) {}

  @Public()
  @Get()
  async getMajors() {
    return this.majorService.getAll();
  }
}
