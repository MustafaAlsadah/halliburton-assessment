import { Injectable, NotFoundException } from '@nestjs/common';

import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Not } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string) {
    console.log(email, password);
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const correctPassword = await bcrypt.compare(password, user.password);
    if (user && correctPassword) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: User) {
    const jwtPayload = { email: user.email, sub: user.id, role: user.role };
    const token = await this.jwtService.signAsync(jwtPayload);
    return {
      access_token: token,
      user_id: user.id,
      role: user.role,
    };
  }
}
