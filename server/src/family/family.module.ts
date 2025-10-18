import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FamilyMember, FamilyMemberSchema } from './family-member.schema';
import { FamilyService } from './family.service';
import { FamilyController } from './family.controller';
import { UserModule } from '../user/user.module';
import { User, UserSchema } from '../user/schemas/user.schema';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FamilyMember.name, schema: FamilyMemberSchema },
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
