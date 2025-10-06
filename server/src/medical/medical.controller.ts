import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MedicalService } from './medical.service';
import { CreateMedicalHistoryDto } from './dto/create-medical-history.dto';
import { UpdateMedicalHistoryDto } from './dto/update-medical-history.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { Types } from 'mongoose';

@Controller('medical-history')
@UseGuards(JwtAuthGuard)
export class MedicalController {
  constructor(private readonly medicalService: MedicalService) {}

  @Post()
  async create(@Request() req, @Body() createMedicalHistoryDto: CreateMedicalHistoryDto) {
    const userId = new Types.ObjectId(req.user.id);

    
    const createdMedicalHistory = await this.medicalService.create(userId, createMedicalHistoryDto);
    
    return {
      success: true,
      message: 'Medical history created successfully',
      data: createdMedicalHistory,
    };
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const userId = new Types.ObjectId(req.user.id);
    const medicalHistory = await this.medicalService.findOne(userId, id);
    
    return {
      success: true,
      data: medicalHistory,
    };
  }

  @Get('family-member/:familyMemberId')
  async findByFamilyMemberId(@Request() req, @Param('familyMemberId') familyMemberId: string) {
    const userId = new Types.ObjectId(req.user.id);
    const medicalHistory = await this.medicalService.findByFamilyMemberId(userId, familyMemberId);
    

    return {
      success: true,
      data: medicalHistory, 
      exists: medicalHistory !== null,
    };
  }

  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateMedicalHistoryDto: UpdateMedicalHistoryDto,
  ) {
    const userId = new Types.ObjectId(req.user.id);
    const updatedMedicalHistory = await this.medicalService.update(userId, id, updateMedicalHistoryDto);
    
    return {
      success: true,
      message: 'Medical history updated successfully',
      data: updatedMedicalHistory,
    };
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    const userId = new Types.ObjectId(req.user.id);
    const result = await this.medicalService.remove(userId, id);
    
    return {
      success: true,
      message: 'Medical history deleted successfully',
      data: result,
    };
  }
} 