import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async create(createPostDto: CreatePostDto) {
    const user = await this.userRepository.findOne({
      where: { id: createPostDto.userId },
    });
    if (!user) {
      throw new Error('User not found');
    }

    const post = this.postRepository.create({
      ...createPostDto,
      thumbnail:
        createPostDto.thumbnail ||
        'https://www.logotypes101.com/logos/564/B73219CE0A6FF2556B5CC1F935D3151E/Halliburton22.png',
    });

    return await this.postRepository.save(post);
  }

  async findAll() {
    return await this.postRepository.find({ relations: ['user'] });
  }

  async findOne(id: number) {
    return await this.postRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async update(id: number, updatePostDto: UpdatePostDto) {
    return await this.postRepository.update(id, updatePostDto);
  }

  async remove(id: number) {
    return await this.postRepository.delete(id);
  }
}
