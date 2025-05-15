import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FamilyMember, FamilyMemberSchema } from './family-member.schema';
import { HealthCondition, HealthConditionSchema } from './health-condition.schema';
import { FamilyService } from './family.service';
import { FamilyController } from './family.controller';
import { UserModule } from 'src/user/user.module';
import { User, UserSchema } from 'src/user/schemas/user.schema';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FamilyMember.name, schema: FamilyMemberSchema },
      { name: HealthCondition.name, schema: HealthConditionSchema },
      { name: User.name, schema: UserSchema },
    ]),
    UserModule,
    NotificationModule,
  ],
  controllers: [FamilyController],
  providers: [FamilyService],
  exports: [FamilyService],
})
export class FamilyModule {}
