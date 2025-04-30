import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from './notification.schema';
import { NotificationService } from './notification.service';
import { SurnameSimilarityService } from './surname-similarity.service';
import { FamilyMember, FamilyMemberSchema } from '../family/family-member.schema';
import { NotificationController } from './notification.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: FamilyMember.name, schema: FamilyMemberSchema },
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, SurnameSimilarityService],
  exports: [NotificationService, SurnameSimilarityService],
})
export class NotificationModule {}