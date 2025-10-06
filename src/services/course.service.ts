import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course, CourseDocument } from '../models/course.schema';

@Injectable()
export class CourseService {
  constructor(@InjectModel(Course.name) private courseModel: Model<CourseDocument>) {}

  async createDefaultCourses() {
    const courseIds = [
      'CEA201', 'CSI106', 'DBI202', 'JPD113', 'JPD123', 'MAD101', 'MAE101', 'MAS291', 'EXE101', 'EXE201',
      'HCM202', 'MLN111', 'MLN122', 'MLN131', 'PMG201c', 'SSG104', 'SSL101c', 'VNR202', 'ACC101', 'AID301c',
      'AIG202c', 'AIL303m', 'CHN113', 'CHN123', 'CPV301', 'CSD201', 'CSD203', 'DAP391m', 'DAT301m', 'DPL302m',
      'DWP301c', 'ECO111', 'ECO121', 'ECO201', 'ENM301', 'ENM401', 'ENW492c', 'ENW493c', 'FIN202', 'HRM202c',
      'IBC201', 'IBF301', 'IBI101', 'IBS301m', 'IB_COM*.4', 'IB_COM1', 'IB_COM2', 'IB_COM3', 'IB_GRA_ELE',
      'IEI301', 'IOT102', 'ITA203c', 'ITE302c', 'ITE303c', 'LAB211', 'LAW102', 'MAI391', 'MAS202', 'MGT103',
      'MKT101', 'MKT205c', 'NLP301c', 'NWC204', 'OBE102c', 'OJB202', 'OJT202', 'OSG202', 'PFP191', 'PRF192',
      'PRJ301', 'PRM392', 'PRO192', 'REL301m', 'RMB301', 'SCM201', 'SE_COM4_ELE', 'SE_COM1', 'SE_COM2',
      'SE_COM3', 'SE_GRA_ELE', 'SSB201', 'SWD392', 'SWE201c', 'SWP391', 'SWR302', 'SWT301', 'WDU203c', 'WED201c'
    ];

    for (const course_id of courseIds) {
      const existed = await this.courseModel.findOne({ course_id });
      if (!existed) {
        await new this.courseModel({ course_id, course_name: course_id }).save();
      }
    }
  }
}