import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MedicalService } from './medical.service';
import { MedicalController } from './medical.controller';
import { MedicalHistory, MedicalHistorySchema } from './medical-history.schema';
import { FamilyMember, FamilyMemberSchema } from '../family/family-member.schema';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MedicalHistory.name, schema: MedicalHistorySchema },
      { name: FamilyMember.name, schema: FamilyMemberSchema },
    ]),
    UserModule,
  ],
  controllers: [MedicalController],
  providers: [MedicalService],
  exports: [MedicalService],
})
export class MedicalModule {} 