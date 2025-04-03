import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    try {
      return await this.authService.register(createUserDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Registration failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    try {
      const user = await this.authService.validateUser(
        loginDto.email,
        loginDto.password,
      );

      if (!user) {
        throw new HttpException(
          'Invalid email or password',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const result = await this.authService.login(user);
      return {
        statusCode: HttpStatus.OK,
        message: 'Login successful',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Login failed',
        error.status || HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
