import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FamilyMember, FamilyMemberSchema } from './family-member.schema';
import { FamilyService } from './family.service';
import { FamilyController } from './family.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FamilyMember.name, schema: FamilyMemberSchema },
    ]),
  ],
  controllers: [FamilyController],
  providers: [FamilyService],
  exports: [FamilyService],
})
export class FamilyModule {}
