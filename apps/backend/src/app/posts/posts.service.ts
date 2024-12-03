import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { User } from '../users/entities/user.entity';

interface ChartFormat {
  id: number;
  user_fname: string;
  user_lname: string;
  n_restricted: number;
  n_non_restricted: number;
}

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
    if (!createPostDto.title || !createPostDto.content) {
      throw new BadRequestException('Title and content are required');
    }
    const post = this.postRepository.create({
      ...createPostDto,
      thumbnail:
        createPostDto.thumbnail ||
        'https://www.logotypes101.com/logos/564/B73219CE0A6FF2556B5CC1F935D3151E/Halliburton22.png',
    });

    return await this.postRepository.save(post);
  }

  async findUserPosts(userId: number) {
    return await this.postRepository.find({
      where: { userId },
      relations: ['user'],
    });
  }

  async generateChartData() {
    const posts = await this.postRepository.find({ relations: ['user'] });
    const chartData: ChartFormat[] = [];
    posts.map((post: Post) => {
      // if user already exists in the chartData array, increment the count
      // otherwise, add a new entry to the chartData array
      const userIndex = chartData.findIndex((data) => data.id === post.user.id);
      if (userIndex !== -1) {
        if (post.containsRestricted) {
          chartData[userIndex].n_restricted += 1;
        } else {
          chartData[userIndex].n_non_restricted += 1;
        }
      } else {
        const newEntry: ChartFormat = {
          id: post.user.id,
          user_fname: post.user.firstName,
          user_lname: post.user.lastName,
          n_restricted: post.containsRestricted ? 1 : 0,
          n_non_restricted: post.containsRestricted ? 0 : 1,
        };
        chartData.push(newEntry);
      }
    });
    return chartData;
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
    // we nned to use .save() method to update the post
    // await this.postRepository.update(id, updatePostDto); // Update the post
    // return await this.findById(id); // Return the updated post
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) {
      throw new Error('Post not found');
    }
    const newPost = this.postRepository.create({
      ...post,
      ...updatePostDto,
    });
    return await this.postRepository.save(newPost);
  }

  async remove(id: number) {
    return await this.postRepository.delete(id);
  }

  async findById(id: number) {
    return await this.postRepository.findOne({ where: { id } });
  }

  async bulkDelete(ids: number[]) {
    return await this.postRepository.delete({ id: In(ids) });
  }
}
