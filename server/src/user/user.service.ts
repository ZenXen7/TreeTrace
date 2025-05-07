import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const existingUser = await this.userModel.findOne({
        email: createUserDto.email,
      });
      if (existingUser) {
        throw new HttpException(
          'User with this email already exists',
          HttpStatus.CONFLICT,
        );
      }

      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      const newUser = new this.userModel({
        ...createUserDto,
        password: hashedPassword,
      });

      return await newUser.save();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error creating user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string): Promise<User> {
    try {
      if (!id) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
      }

      const user = await this.userModel.findById(id).exec();
      if (!user) {
        throw new HttpException(
          `User with id ${id} not found`,
          HttpStatus.NOT_FOUND
        );
      }
      return user;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error finding user',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      if (!id) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
      }

      const updateData = { ...updateUserDto };
      
      if (updateData.password) {
        const hashedPassword = await bcrypt.hash(updateData.password, 10);
        updateData.password = hashedPassword;
      }

      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .exec();

      if (!updatedUser) {
        throw new HttpException(
          `User with id ${id} not found`,
          HttpStatus.NOT_FOUND
        );
      }

      return updatedUser;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error updating user',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async remove(id: string): Promise<User> {
    const deletedUser = await this.userModel.findByIdAndDelete(id).exec();
    if (!deletedUser) {
      throw new Error(`User with id ${id} not found`);
    }
    return deletedUser;
  }

  async findByEmail(email: string): Promise<User> {
    try {
      const user = await this.userModel.findOne({ 
        email: email.toLowerCase().trim() 
      })
      .select('+password')
      .exec();
      
      if (!user) {
        throw new HttpException(
          'Invalid email or password',
          HttpStatus.UNAUTHORIZED
        );
      }
      return user;
    } catch (error) {
      throw new HttpException(
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED
      );
    }
  }

  async searchUsers(searchTerm: string): Promise<User[]> {
    try {
      if (!searchTerm || searchTerm.trim() === '') {
        return [];
      }

      const regex = new RegExp(searchTerm, 'i');
      
      return await this.userModel.find({
        $or: [
          { firstName: { $regex: regex } },
          { lastName: { $regex: regex } },
        ]
      })
      .select('_id firstName lastName email')
      .limit(10)
      .exec();
    } catch (error) {
      throw new HttpException(
        'Error searching users',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
