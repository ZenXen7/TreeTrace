import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from './notification.schema';
import { NotificationService } from './notification.service';
import { FamilyMemberSimilarityService } from './family-member-similarity.service';
import { FamilyMember, FamilyMemberSchema } from '../family/family-member.schema';
import { NotificationController } from './notification.controller';
import { ProcessedSuggestion, ProcessedSuggestionSchema } from './processed-suggestion.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: FamilyMember.name, schema: FamilyMemberSchema },
      { name: ProcessedSuggestion.name, schema: ProcessedSuggestionSchema },
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, FamilyMemberSimilarityService],
  exports: [NotificationService, FamilyMemberSimilarityService],
})
export class NotificationModule {}