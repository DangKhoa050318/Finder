import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  MajorCourse,
  MajorCourseDocument,
} from '../models/major_course.schema';
import { Major, MajorDocument } from '../models/major.schema';
import { Course, CourseDocument } from '../models/course.schema';

@Injectable()
export class MajorCourseService {
  constructor(
    @InjectModel(MajorCourse.name)
    private majorCourseModel: Model<MajorCourseDocument>,
    @InjectModel(Major.name) private majorModel: Model<MajorDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
  ) {}

  async createDefaultMajorCourses() {
    const majorCourses = [
      {
        major_id: 'se',
        courses: [
          'CEA201',
          'CSI106',
          'MAE101',
          'PRF192',
          'SSL101c',
          'MAD101',
          'NWC204',
          'OSG202',
          'PRO192',
          'SSG104',
          'CSD201',
          'DBI202',
          'JPD113',
          'LAB211',
          'WED201c',
          'IOT102',
          'JPD123',
          'MAS291',
          'PRJ301',
          'SWE201c',
          'SE_COM1',
          'SWP391',
          'SWR302',
          'SWT301',
          'WDU203c',
          'ENW493c',
          'OJT202',
          'EXE101',
          'PMG201c',
          'SE_COM2',
          'SE_COM3',
          'SWD392',
          'EXE201',
          'ITE302c',
          'MLN111',
          'MLN122',
          'PRM392',
          'SE_COM*4_ELE',
          'HCM202',
          'MLN131',
          'SE_GRA_ELE',
          'VNR202',
        ],
      },
      {
        major_id: 'ai',
        courses: [
          'CSI106',
          'MAD101',
          'MAE101',
          'PFP191',
          'SSL101c',
          'AIG202c',
          'CEA201',
          'CSD203',
          'DBI202',
          'JPD113',
          'ITE303c',
          'JPD123',
          'MAI391',
          'MAS291',
          'AIL303m',
          'CPV301',
          'DAP391m',
          'SSG104',
          'DPL302m',
          'DWP301c',
          'NLP301c',
          'DAT301m',
          'EXE101',
          'PMG201c',
          'AID301c',
          'EXE201',
          'MLN111',
          'MLN122',
          'REL301m',
          'HCM202',
          'MLN131',
          'VNR202',
        ],
      },
      {
        major_id: 'ib',
        courses: [
          'ECO111',
          'ENM301',
          'MGT103',
          'MKT101',
          'SSL101c',
          'ACC101',
          'ECO121',
          'ENM401',
          'OBE102c',
          'SSG104',
          'ECO201',
          'FIN202',
          'HRM202c',
          'IBC201',
          'IBI101',
          'CHN113',
          'IBF301',
          'ITA203c',
          'MAS202',
          'SCM201',
          'CHN123',
          'IBS301m',
          'IEI301',
          'MKT205c',
          'SSB201',
          'ENW492c',
          'OJB202',
          'EXE101',
          'IB_COM*1',
          'IB_COM*2',
          'IB_COM*3',
          'LAW102',
          'EXE201',
          'IB_COM*.4',
          'MLN111',
          'MLN122',
          'PMG201c',
          'RMB301',
          'HCM202',
          'IB_GRA_ELE',
          'MLN131',
          'VNR202',
        ],
      },
    ];

    for (const major of majorCourses) {
      // Tìm major theo major_id
      const majorDoc = await this.majorModel.findOne({
        key: major.major_id,
      });
      if (!majorDoc) continue;

      for (const course_id of major.courses) {
        // Tìm course theo course_id
        const courseDoc = await this.courseModel.findOne({ course_id });
        if (!courseDoc) continue;

        // Kiểm tra đã tồn tại liên kết chưa
        const existed = await this.majorCourseModel.findOne({
          major_id: majorDoc._id,
          course_id: courseDoc._id,
        });
        if (!existed) {
          await new this.majorCourseModel({
            major_id: majorDoc._id,
            course_id: courseDoc._id,
          }).save();
        }
      }
    }
  }
}
