import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const newUserRole = createUserDto.role;
    const newAdminRegistration = newUserRole === 'ADMIN';
    const isAdminExisits = await this.isAdminExists();
    if (newAdminRegistration && isAdminExisits.adminExists) {
      const admin = await this.findAdmin();
      this.changeRole(admin.id, 'USER');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      saltRounds
    );
    createUserDto.password = hashedPassword;

    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }

  async findAll() {
    return await this.userRepository.find();
  }

  async findBlockedUsers() {
    return await this.userRepository.find({ where: { isBlocked: true } });
  }

  async findOne(id: number) {
    return await this.userRepository.findOne({ where: { id } });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    return await this.userRepository.update(id, updateUserDto);
  }

  async remove(id: number) {
    return await this.userRepository.delete(id);
  }

  async findByEmail(email: string) {
    return await this.userRepository.findOne({ where: { email } });
  }

  async isAdminExists() {
    const admin = await this.userRepository.find({ where: { role: 'ADMIN' } });
    const adminExists = admin.length > 0;
    return { adminExists };
  }

  async findAdmin() {
    return await this.userRepository.findOne({ where: { role: 'ADMIN' } });
  }

  async changeRole(id: number, role: 'ADMIN' | 'USER') {
    return await this.userRepository.update(id, { role });
  }
}
