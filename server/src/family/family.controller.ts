/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  HttpStatus,
  HttpException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { FamilyService, FamilyTreeNode } from './family.service';
import { CreateFamilyMemberDto } from './dto/create-family-member.dto';
import { Model, Types } from 'mongoose';
@Controller('family-members')
@UseGuards(JwtAuthGuard)
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Post()
  async create(
    @Body() createFamilyMemberDto: CreateFamilyMemberDto,
    @Request() req,
  ) {
    try {
      const userId = req.user.id;

      if (createFamilyMemberDto.birthDate && typeof createFamilyMemberDto.birthDate === 'string') {
        createFamilyMemberDto.birthDate = new Date(createFamilyMemberDto.birthDate);
      }
      if (createFamilyMemberDto.deathDate && typeof createFamilyMemberDto.deathDate === 'string') {
        createFamilyMemberDto.deathDate = new Date(createFamilyMemberDto.deathDate);
      }
      const familyMember = await this.familyService.createFamilyMember(
        userId,
        createFamilyMemberDto,
      );
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Family member created successfully',
        data: familyMember,
      };
    } catch (error) {
      console.error('Error creating family member:', error);
      throw new HttpException(
        error.message || 'Error creating family member',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async findAll(@Request() req) {
    try {
      const userId = req.user.id;
      
      // Extract filter parameters from query
      const { gender, country, status } = req.query;
      const filters = {};
      
      // Add filters if they exist
      if (gender && gender !== 'all') filters['gender'] = gender;
      if (country && country !== 'all') filters['country'] = country;
      if (status && status !== 'all') filters['status'] = status;
      
      console.log(`API received filter request: ${JSON.stringify(filters)}`);
      
      // Pass filters to service method
      const familyMembers = await this.familyService.findAll(userId, filters);
      
      // Don't throw an error if no members found, just return empty array
      return {
        statusCode: HttpStatus.OK,
        message: familyMembers.length > 0 ? 'Family members found' : 'No family members match the filters',
        data: familyMembers,
      };
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new HttpException(
        error.message || 'Error fetching family members',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
//   @Get()
// async findAll(@Request() req) {
//   try {
//     const userId = req.user.id;
//     const familyMembers = await this.familyService.findAll(userId);
//     return {
//       statusCode: HttpStatus.OK,
//       message: 'Family members fetched successfully',
//       data: familyMembers, // can be empty array
//     };
//   } catch (error) {
//     throw new HttpException(
//       error.message || 'Error fetching family members',
//       error.status || HttpStatus.INTERNAL_SERVER_ERROR,
//     );
//   }
// }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const familyMember = await this.familyService.findOne(id);
      if (!familyMember) {
        throw new HttpException(
          'Family member not found',
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        statusCode: HttpStatus.OK,
        message: 'Family member found',
        data: familyMember,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error fetching family member',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateFamilyMemberDto: Partial<CreateFamilyMemberDto>,
  ) {
    try {
      const updatedFamilyMember = await this.familyService.update(
        id,
        updateFamilyMemberDto,
      );
      return {
        statusCode: HttpStatus.OK,
        message: 'Family member updated successfully',
        data: updatedFamilyMember,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error updating family member',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const deletedFamilyMember = await this.familyService.remove(id);
      return {
        statusCode: HttpStatus.OK,
        message: 'Family member deleted successfully',
        data: deletedFamilyMember,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error deleting family member',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/family-tree')
  async getFamilyTree(
    @Param('id') id: string,
  ): Promise<{ message: string; data: FamilyTreeNode }> {
    try {
      const familyTree = await this.familyService.getFamilyTree(id);
      return {
        message: 'Family tree retrieved successfully',
        data: familyTree,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error fetching family tree',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
