import {
  Controller,
  Post,
  Body,
  Get,
  HttpStatus,
  HttpException,
  Request,
} from '@nestjs/common';
import { CreateFamilyMemberDto } from './dto/create-family-member.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/jwt/jwt-auth.guard';
import { FamilyService } from './family.service';

@Controller('family-members')
export class FamilyController {
  constructor(private readonly familyMemberService: FamilyService) {}

  // Create a family member and associate it with a user
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createFamilyMemberDto: CreateFamilyMemberDto,
    @Request() req,
  ) {
    try {
      console.log('Authenticated user:', req.user); // Debugging line

      // Extract userId from the authenticated user's token
      const userId = String(req.user.id);

      // Pass the userId and family member data to the service
      const familyMember = await this.familyMemberService.createFamilyMember(
        userId,
        createFamilyMemberDto,
      );

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Family member created successfully',
        data: familyMember,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error creating family member',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Get all family members linked to the authenticated user
  @Get()
  @UseGuards(JwtAuthGuard) // Ensure only authenticated users can access this route
  async findByUser(@Request() req) {
    try {
      const userId = req.user.id; // Get the authenticated user's ID from the token
      const familyMembers = await this.familyMemberService.findByUser(userId);

      if (!familyMembers || familyMembers.length === 0) {
        throw new HttpException(
          'No family members found',
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Family members found',
        data: familyMembers,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error fetching family members',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
