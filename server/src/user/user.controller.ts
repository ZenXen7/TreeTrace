import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpException,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.userService.create(createUserDto);
      return {
        statusCode: HttpStatus.CREATED,
        message: 'User created successfully',
        data: user,
      };
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Error creating user',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('search')
  async searchUsers(@Request() req) {
    try {
      const { query } = req.query;
      
      if (!query) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Search query is required',
          data: [],
        };
      }
      
      const users = await this.userService.searchUsers(query);
      
      return {
        statusCode: HttpStatus.OK,
        message: users.length > 0 ? 'Users found' : 'No users found',
        data: users,
      };
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Error searching users',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    try {
      const user = await this.userService.findOne(req.user.id);
      return {
        statusCode: HttpStatus.OK,
        message: 'Profile retrieved successfully',
        data: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          gender: user.gender,
          birthDate: user.birthDate,
        },
      };
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'An unexpected error occurred',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async update(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    try {
      const updatedUser = await this.userService.update(req.user.id, updateUserDto);
      return {
        statusCode: HttpStatus.OK,
        message: 'Profile updated successfully',
        data: {
          id: updatedUser._id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          gender: updatedUser.gender,
          birthDate: updatedUser.birthDate,
        },
      };
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'An unexpected error occurred',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    try {
      return await this.userService.findAll();
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'An unexpected error occurred',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const user = await this.userService.findOne(id);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      
      // Only return public information
      return {
        statusCode: HttpStatus.OK,
        message: 'User found',
        data: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          birthDate: user.birthDate,
        },
      };
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'An unexpected error occurred',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const user = await this.userService.remove(id);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      return user;
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'An unexpected error occurred',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
