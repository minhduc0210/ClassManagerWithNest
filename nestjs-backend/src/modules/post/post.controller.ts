/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import express from 'express';

interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string; role: string };
}

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post(':classroomID/:slotID')
  @UseInterceptors(FileInterceptor('file'))
  async createPost(
    @UploadedFile() file: Express.Multer.File,
    @Param('classroomID') classroomID: string,
    @Param('slotID') slotID: string,
    @Req() req: AuthenticatedRequest,
    @Body() createPostDto: CreatePostDto,
  ) {
    const newPost = await this.postService.create(
      req.user.userId,
      classroomID,
      slotID,
      createPostDto,
      file,
    );

    return {
      success: true,
      data: newPost,
    };
  }

  @Get('/:classroomID')
  async getPostsByClassroom(@Param('classroomID') classroomID: string) {
    return this.postService.getPostsByClassroom(classroomID);
  }

  @Get('/:classroomID/:slotID')
  async getPostsBySlot(
    @Param('classroomID') classroomID: string,
    @Param('slotID') slotID: string,
    @Res() res: express.Response,
  ) {
    const posts = await this.postService.getPostsBySlot(classroomID, slotID);
    return res.status(200).json({ posts });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postService.findOne(+id);
  }

  @Patch('/:classroomID/:slotID/:postID')
  async update(
    @Param('classroomID') classroomID: string,
    @Param('slotID') slotID: string,
    @Param('postID') postID: string,
    @Body() updatePostDto: UpdatePostDto,
    @Res() res: express.Response,
  ) {
    const response = await this.postService.updatePost(
      classroomID,
      slotID,
      postID,
      updatePostDto,
    );
    return res.status(HttpStatus.OK).json({ success: true, data: response });
  }

  @Delete(':slotID/:postID')
  async deletePost(
    @Param('slotID') slotID: string,
    @Param('postID') postID: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: express.Response,
  ) {
    const uerID = req.user.userId;
    await this.postService.deletePost(uerID, slotID, postID);
    return res.status(HttpStatus.OK).json({ success: true });
  }
}
