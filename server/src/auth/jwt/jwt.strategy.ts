import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { JwtPayload } from './interfaces/jwt-payload.interface'; // Define your JWT Payload interface

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Optionally set expiration check
      secretOrKey: process.env.JWT_SECRET, // Use your secret or key
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userService.findOne(payload.sub); // Assuming 'sub' is the user ID in the payload
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user; // This attaches the user to `req.user`
  }
}
