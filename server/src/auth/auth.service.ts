/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserPayload, LoginResponse } from './interfaces/user.interface';
import { UserDocument } from '../user/schemas/user.schema';
import { UserService } from 'src/user/user.service';
import { JwtPayload } from './jwt/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<LoginResponse> {
    try {
      const user = await this.userService.create({
        ...createUserDto,
        email: createUserDto.email.toLowerCase().trim(),
      });

      const payload: UserPayload = {
        _id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      };

      return this.login(payload);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new UnauthorizedException(
        'Registration failed: ' + (error.message || 'Invalid input')
      );
    }
  }

  async validateUser(email: string, password: string): Promise<UserPayload> {
    try {
      const user = await this.userService.findByEmail(email.toLowerCase().trim());
      
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      return {
        _id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid email or password');
    }
  }

  login(user: UserPayload): Promise<LoginResponse> {
    const payload: JwtPayload = {
      sub: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    return Promise.resolve({
      access_token: this.jwtService.sign(payload),
      user,
    });
  }
}
