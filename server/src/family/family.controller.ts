import { Controller, Post, Get, Body } from '@nestjs/common';
import { FamilyService } from './family.service';
import { FamilyMember } from './family-member.schema';

@Controller('family')
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Post('add')
  async createFamilyMember(
    @Body() createFamilyMemberDto: Partial<FamilyMember>,
  ) {
    return this.familyService.createFamilyMember(createFamilyMemberDto);
  }

  @Get('tree')
  async getFamilyTree(): Promise<FamilyMember[]> {
    return this.familyService.getFamilyTree();
  }
}
