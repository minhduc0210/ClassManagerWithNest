/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument } from './entities/post.entity';
import { Model, Types } from 'mongoose';
import {
  Classroom,
  ClassroomDocument,
} from '../classroom/entities/classroom.entity';
import { Slot, SlotDocument } from '../slot/entities/slot.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class PostService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Classroom.name)
    private classModel: Model<ClassroomDocument>,
    @InjectModel(Slot.name)
    private slotModel: Model<SlotDocument>,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async create(
    userID: string,
    classroomID: string,
    slotID: string,
    createPostDto: CreatePostDto,
    file?: Express.Multer.File,
  ): Promise<PostDocument> {
    if (
      !Types.ObjectId.isValid(classroomID) ||
      !Types.ObjectId.isValid(slotID) ||
      !Types.ObjectId.isValid(userID)
    ) {
      throw new BadRequestException('ID truyền không hợp lệ.');
    }

    const classroomMongooseID = new Types.ObjectId(classroomID);
    const slotMongooseID = new Types.ObjectId(slotID);
    const userMongooseID = new Types.ObjectId(userID);
    const classroom = await this.classModel
      .findById(classroomMongooseID)
      .select('slots title')
      .exec();
    if (!classroom) {
      throw new NotFoundException('Không tìm thấy lớp học này.');
    }
    const slot = await this.slotModel.findById(slotMongooseID);
    if (!slot) {
      throw new NotFoundException('Không tìm thấy slot này.');
    }
    if (!classroom.slots.includes(slotMongooseID)) {
      throw new NotFoundException('Not found this slot in classroom');
    }

    let fileUrl: string | undefined;
    if (file) {
      const folderPath = `class-manager/${classroom.title}/${slot.title}`;
      const uploadResult = await this.cloudinary.uploadFile(file, folderPath);
      fileUrl = uploadResult.secure_url;
    }

    const newPost = await this.postModel.create({
      ...createPostDto,
      author: userMongooseID,
      file: fileUrl,
    });
    slot?.posts.push(newPost._id);
    await slot?.save();
    return newPost;
  }

  async updatePost(
    classroomID: string,
    slotID: string,
    postID: string,
    updateDTO: UpdatePostDto,
    file?: Express.Multer.File,
  ): Promise<PostDocument> {
    if (
      !Types.ObjectId.isValid(classroomID) ||
      !Types.ObjectId.isValid(slotID) ||
      !Types.ObjectId.isValid(postID)
    ) {
      throw new BadRequestException('ID truyền không hợp lệ.');
    }

    const classroomMongooseID = new Types.ObjectId(classroomID);
    const slotMongooseID = new Types.ObjectId(slotID);
    const postMongooseID = new Types.ObjectId(postID);
    const classroom = await this.classModel
      .findById(classroomMongooseID)
      .select('slots title')
      .exec();
    if (!classroom) {
      throw new NotFoundException('Không tìm thấy lớp học này.');
    }

    const post = await this.postModel.findById(postID);
    if (!post) throw new NotFoundException('Không tìm thấy bài đăng.');

    const slot = await this.slotModel.findById(slotMongooseID);
    if (!slot) {
      throw new NotFoundException('Không tìm thấy slot này.');
    }
    if (!classroom.slots.includes(slotMongooseID)) {
      throw new NotFoundException('Not found this slot in classroom');
    }
    if (!slot.posts.includes(postMongooseID)) {
      throw new NotFoundException('Not found this post in slot');
    }

    let newFileUrl = updateDTO.file;
    if (file) {
      if (post.file) {
        try {
          const assetInfo = this.cloudinary.extractAssetInfo(post.file);
          console.log(assetInfo);

          await this.cloudinary.deleteFile(
            assetInfo.publicId,
            assetInfo.resourceType,
          );
        } catch (error) {
          console.error('Failed to delete old file from Cloudinary:', error);
        }
      }
      const folderPath = `class-manager/${classroom.title}/${slot.title}`;
      const uploadResult = await this.cloudinary.uploadFile(file, folderPath);
      newFileUrl = uploadResult.secure_url;
    }

    const updatedPost = await this.postModel.findByIdAndUpdate(
      postMongooseID,
      {
        $set: {
          ...updateDTO,
          file: newFileUrl,
        },
      },
      { new: true, runValidators: true },
    );
    if (!updatedPost) throw new NotFoundException('Not found this post');
    return updatedPost;
  }

  async deletePost(
    userID: string,
    slotID: string,
    postID: string,
  ): Promise<void> {
    if (
      !Types.ObjectId.isValid(userID) ||
      !Types.ObjectId.isValid(slotID) ||
      !Types.ObjectId.isValid(postID)
    ) {
      throw new BadRequestException('ID truyền không hợp lệ.');
    }

    const slotMongooseID = new Types.ObjectId(slotID);
    const postMongooseID = new Types.ObjectId(postID);
    const userMongooseID = new Types.ObjectId(userID);

    const post = await this.postModel
      .findById(postMongooseID)
      .select('author')
      .exec();
    if (!post) {
      throw new NotFoundException('Không tìm thấy bài đăng này.');
    }

    if (!post.author) {
      throw new NotFoundException('Không tìm thấy tác giả bài đăng này.');
    }

    if (!post.author.equals(userMongooseID)) {
      throw new UnauthorizedException(
        'Bạn không phải là tác giả của bài đăng này.',
      );
    }

    const slot = await this.slotModel.findById(slotMongooseID).exec();
    if (!slot || !slot.posts.some((id) => id.equals(postMongooseID))) {
      throw new NotFoundException('Bài đăng không thuộc Slot này.');
    }

    const deletedPost = await this.postModel
      .findByIdAndDelete(postMongooseID)
      .exec();

    if (deletedPost?.file) {
      try {
        const assetInfo = this.cloudinary.extractAssetInfo(deletedPost.file);
        await this.cloudinary.deleteFile(
          assetInfo.publicId,
          assetInfo.resourceType,
        );
      } catch (error) {
        console.log('Fail to delete cloudinary file: ', error);
      }
    }

    if (!deletedPost) {
      throw new NotFoundException('Bài đăng không thể xóa hoặc đã bị xóa.');
    }

    await this.slotModel
      .updateOne({ _id: slotMongooseID }, { $pull: { posts: postMongooseID } })
      .exec();
  }

  async deleteManyPosts(postIds: Types.ObjectId[]): Promise<void> {
    if (!postIds || postIds.length === 0) return;
    const validIds = postIds.every((id) =>
      Types.ObjectId.isValid(id.toString()),
    );
    if (!validIds) {
      throw new BadRequestException('Một hoặc nhiều ID bài đăng không hợp lệ.');
    }

    const posts = await this.postModel.find({ _id: { $in: postIds } }).exec();

    if (posts.length === 0) return;

    await Promise.all(
      posts.map(async (post) => {
        if (post.file) {
          try {
            const { publicId, resourceType } = this.cloudinary.extractAssetInfo(
              post.file,
            );
            const result = await this.cloudinary.deleteFile(
              publicId,
              resourceType,
            );

            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (result?.result !== 'ok') {
              console.warn(
                `Cloudinary asset not found during bulk delete: ${publicId}`,
              );
            }
          } catch (error) {
            console.error(
              `Failed to cleanup Cloudinary for post ${post.title}:`,
              error,
            );
          }
        }
      }),
    );

    await this.postModel.deleteMany({ _id: { $in: postIds } }).exec();
  }

  async getPostsByClassroom(classroomID: string): Promise<PostDocument[]> {
    if (!Types.ObjectId.isValid(classroomID)) {
      throw new BadRequestException('ID lớp học không hợp lệ.');
    }
    const classroomMongooseID = new Types.ObjectId(classroomID);
    const classroomExists = await this.classModel.exists({
      _id: classroomMongooseID,
    });
    if (!classroomExists) {
      throw new NotFoundException('Không tìm thấy lớp học này.');
    }

    try {
      const posts = (await this.classModel
        .aggregate([
          { $match: { _id: classroomMongooseID } },
          { $project: { slots: 1, _id: 0 } },
          { $unwind: '$slots' },
          {
            $lookup: {
              from: 'slots',
              localField: 'slots',
              foreignField: '_id',
              as: 'slotDetails',
            },
          },
          { $unwind: '$slotDetails' },
          { $unwind: '$slotDetails.posts' },
          {
            $lookup: {
              from: 'posts',
              localField: 'slotDetails.posts',
              foreignField: '_id',
              as: 'postDetails',
            },
          },
          { $unwind: '$postDetails' },
          {
            $lookup: {
              from: 'users',
              localField: 'postDetails.author',
              foreignField: '_id',
              as: 'postDetails.author',
            },
          },
          { $unwind: '$postDetails.author' },
          { $sort: { 'postDetails.createdAt': -1 } },
          { $replaceRoot: { newRoot: '$postDetails' } },
        ])
        .exec()) as unknown as PostDocument[];

      return posts;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Lỗi khi thực hiện Aggregation lấy posts:', error);
      throw new InternalServerErrorException(
        'Lỗi server khi truy vấn bài đăng.',
      );
    }
  }

  async getPostsBySlot(classroomID: string, slotID: string) {
    if (
      !Types.ObjectId.isValid(classroomID) ||
      !Types.ObjectId.isValid(slotID)
    ) {
      throw new BadRequestException('ID lớp học hoặc Slot không hợp lệ.');
    }

    const classroomMongooseID = new Types.ObjectId(classroomID);
    const slotMongooseID = new Types.ObjectId(slotID);

    try {
      // 2. Kiểm tra tính sở hữu (Ownership Check)
      // Tìm Classroom có ID khớp VÀ Slot ID phải nằm trong mảng slots của Classroom
      const isSlotOwnedByClassroom = await this.classModel.exists({
        _id: classroomMongooseID,
        slots: { $in: [slotMongooseID] },
      });

      if (!isSlotOwnedByClassroom) {
        // Nếu lớp học không tồn tại hoặc Slot không thuộc về lớp học đó
        throw new NotFoundException(
          `Slot ID ${slotID} không thuộc về Classroom ID ${classroomID}.`,
        );
      }

      // 3. Truy xuất Slot và Populate Posts & Author (Nested Populate)
      const posts = await this.slotModel
        .findById(slotMongooseID)
        .populate({
          path: 'posts', // Populate mảng Post IDs
          // Tham số populate thứ hai để populate lồng vào bên trong Post Document
          populate: {
            path: 'author', // Populate trường Author trong mỗi Post
            model: 'User', // Tên Model User (ref: 'User' trong Post Schema)
          },
        })
        .exec();

      return posts;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Lỗi khi truy vấn Post theo Slot:', error);
      throw new InternalServerErrorException(
        'Lỗi server khi truy vấn bài đăng.',
      );
    }
  }

  findAll() {
    return `This action returns all post`;
  }

  findOne(id: number) {
    return `This action returns a #${id} post`;
  }
}
