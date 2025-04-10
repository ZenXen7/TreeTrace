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

@Controller('family-members')
@UseGuards(JwtAuthGuard)
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  // Create a family member
  @Post()
  async create(
    @Body() createFamilyMemberDto: CreateFamilyMemberDto,
    @Request() req,
  ) {
    try {
      const userId = req.user.id; // Extract userId from the authenticated user's token
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
      throw new HttpException(
        error.message || 'Error creating family member',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Get all family members for the authenticated user
  @Get()
  async findAll(@Request() req) {
    try {
      const userId = req.user.id;
      const familyMembers = await this.familyService.findAll(userId);
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

  // Get a single family member by ID
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

  // Get a family member with their children
  @Get(':id/with-children')
  async findFamilyMemberWithChildren(@Param('id') id: string) {
    try {
      const familyMember =
        await this.familyService.findFamilyMemberWithChildren(id);
      if (!familyMember) {
        throw new HttpException(
          'Family member not found',
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        statusCode: HttpStatus.OK,
        message: 'Family member with children found',
        data: familyMember,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error fetching family member with children',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Update a family member
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

  // Delete a family member
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
