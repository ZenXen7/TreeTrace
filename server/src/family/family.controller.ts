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
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
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

      // Similarity check is now handled asynchronously in the service
      
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
  @UseGuards(JwtAuthGuard)
  async findAll(@Request() req) {
    try {
      const userId = req.user.id;

      // Extract pagination and filter parameters from query
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        gender,
        country,
        status,
        search
      } = req.query;

      const filters: any = {};

      // Add filters if they exist
      if (gender && gender !== 'all') filters.gender = gender;
      if (country && country !== 'all') filters.country = country;
      if (status && status !== 'all') filters.status = status;
      if (search) filters.$text = { $search: search };

      // Pass pagination and filters to service method
      const result = await this.familyService.findAllWithPagination(
        userId,
        filters,
        {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          sortBy: sortBy as string,
          sortOrder: sortOrder as 'asc' | 'desc'
        }
      );

      return {
        statusCode: HttpStatus.OK,
        message: result.data.length > 0 ? 'Family members found' : 'No family members match the filters',
        data: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new HttpException(
        error.message || 'Error fetching family members',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('public/:userId')
  async getPublicFamilyTree(
    @Param('userId') userId: string,
  ): Promise<{ message: string; data: FamilyTreeNode[] }> {
    try {
      const familyTree = await this.familyService.getPublicFamilyTree(userId);
      return {
        message: 'Public family tree retrieved successfully',
        data: familyTree,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error fetching public family tree',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('user/:userId')
  async getAllFamilyMembersForUser(
    @Param('userId') userId: string,
  ) {
    try {
      const familyMembers = await this.familyService.findAllByUserId(userId);
      return {
        statusCode: HttpStatus.OK,
        message: familyMembers.length > 0 ? 'Family members found' : 'No family members found',
        data: familyMembers,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error fetching family members',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateFamilyMemberDto: Partial<CreateFamilyMemberDto>,
    @Request() req,
  ) {
    try {
      const updatedFamilyMember = await this.familyService.update(
        id,
        updateFamilyMemberDto,
      );

      // Similarity check is now handled asynchronously in the service
      
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
