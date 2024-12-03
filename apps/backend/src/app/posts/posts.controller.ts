import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(@Body() createPostDto: CreatePostDto) {
    return this.postsService.create(createPostDto);
  }

  @Get()
  findAll(@Req() req) {
    const userRole = req.user.role;
    if (userRole === 'ADMIN') {
      return this.postsService.findAll();
    }
    const userId = req.user.userId;
    return this.postsService.findUserPosts(userId);
  }

  @Get('/chart-data')
  generateChartData() {
    return this.postsService.generateChartData();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    if (!id) {
      throw new BadRequestException('Post ID is required');
    }
    return this.postsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.update(+id, updatePostDto);
  }

  @Delete('/bulk-delete')
  bulkRemove(@Body() body: any) {
    return this.postsService.bulkDelete(body.ids);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    if (!id) {
      throw new BadRequestException('Post ID is required');
    }
    return this.postsService.remove(+id);
  }
}
