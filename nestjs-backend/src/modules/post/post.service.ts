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
import { FileUploadService } from '../file-upload/file-upload.service';

@Injectable()
export class PostService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Classroom.name)
    private classModel: Model<ClassroomDocument>,
    @InjectModel(Slot.name)
    private slotModel: Model<SlotDocument>,
    private readonly fileUploadService: FileUploadService,
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
      .select('slots')
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
      // 1. GỌI DỊCH VỤ XỬ LÝ FILE ĐỘC LẬP
      fileUrl = await this.fileUploadService.processAndGetFileUrl(
        file,
        userID,
        classroomID,
        slotID,
      );
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
  ): Promise<PostDocument> {
    console.log(updateDTO);
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
      .select('slots')
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
    if (!slot.posts.includes(postMongooseID)) {
      throw new NotFoundException('Not found this post in slot');
    }
    const updatedPost = await this.postModel.findByIdAndUpdate(
      postMongooseID,
      { $set: updateDTO },
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

    if (!deletedPost) {
      throw new NotFoundException('Bài đăng không thể xóa hoặc đã bị xóa.');
    }

    await this.slotModel
      .updateOne({ _id: slotMongooseID }, { $pull: { posts: postMongooseID } })
      .exec();
  }

  async getPostsByClassroom(classroomID: string): Promise<PostDocument[]> {
    // 1. Kiểm tra ID
    if (!Types.ObjectId.isValid(classroomID)) {
      throw new BadRequestException('ID lớp học không hợp lệ.');
    }

    const classroomMongooseID = new Types.ObjectId(classroomID);

    // 2. Kiểm tra Classroom có tồn tại không
    const classroomExists = await this.classModel.exists({
      _id: classroomMongooseID,
    });
    if (!classroomExists) {
      throw new NotFoundException('Không tìm thấy lớp học này.');
    }

    // 3. Thực hiện Aggregation Pipeline
    try {
      const posts = (await this.classModel
        .aggregate([
          // GĐ 1: Lọc Classroom theo ID
          { $match: { _id: classroomMongooseID } },

          // GĐ 2: Lấy tất cả Slot IDs (Chỉ cần mảng slots)
          { $project: { slots: 1, _id: 0 } },

          // GĐ 3: Tách mảng slots thành các documents riêng lẻ (từng Slot ID một)
          { $unwind: '$slots' },

          // GĐ 4: Lookup (populate) các Slot Document
          {
            $lookup: {
              from: 'slots', // Tên Collection Slot (chuẩn Mongoose: tên Class ở dạng số nhiều, chữ thường)
              localField: 'slots',
              foreignField: '_id',
              as: 'slotDetails',
            },
          },
          { $unwind: '$slotDetails' }, // Tách mảng Slot (vì lookup trả về mảng)

          // GĐ 5: Tách mảng Post IDs từ SlotDetails
          { $unwind: '$slotDetails.posts' },

          // GĐ 6: Lookup (populate) các Post Document
          {
            $lookup: {
              from: 'posts', // Tên Collection Post
              localField: 'slotDetails.posts',
              foreignField: '_id',
              as: 'postDetails',
            },
          },
          { $unwind: '$postDetails' }, // Tách mảng Post (vì lookup trả về mảng)

          // GĐ 7: Populate Author bên trong Post (vì Aggregation không hỗ trợ Populate lồng)
          {
            $lookup: {
              from: 'users', // Giả định tên Collection là 'users'
              localField: 'postDetails.author',
              foreignField: '_id',
              as: 'postDetails.author',
            },
          },
          { $unwind: '$postDetails.author' }, // Tách Author (nếu không phải là mảng)

          // GĐ 8: Sắp xếp và Định hình lại Output
          { $sort: { 'postDetails.createdAt': -1 } }, // Sắp xếp: Post mới nhất lên đầu

          // Chỉ lấy những trường của Post Document làm output
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
    // 1. Kiểm tra ID
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
