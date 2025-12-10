/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { User, UserDocument } from './entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { AuthService } from '../auth/auth.service';
import { ChangeInformationDto } from './dto/change-information.dto';
import {
  Classroom,
  ClassroomDocument,
} from '../classroom/entities/classroom.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Classroom.name)
    private readonly classroomModel: Model<ClassroomDocument>,
    private authService: AuthService,
    private readonly mailService: MailService,
  ) {}

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async findById(_id: string) {
    const user = await this.userModel.findById({ _id });
    if (!user) throw new NotFoundException();
    return user;
  }

  async register(registerData: RegisterDto): Promise<Partial<User>> {
    const { email, password } = registerData;
    const user = await this.userModel.findOne({ email });
    if (user) {
      throw new ConflictException('Email has been registered!');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await this.userModel.create({
      ...registerData,
      password: hashedPassword,
    });
    const newUserWithoutPass = {
      name: newUser.name,
      lastname: newUser.lastname,
      email: newUser.email,
      role: newUser.role,
    };
    return newUserWithoutPass;
  }

  async login(loginData: LoginDto) {
    const { email, password } = loginData;
    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('Email not found!');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException();
    const accessToken = this.authService.createAccessToken(user);
    const refreshToken = this.authService.createRefreshToken(user);
    await user.save();
    await this.authService.saveRefreshToken(user._id.toString(), refreshToken);
    const formattedUser = {
      id: user._id,
      name: user.name,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
      accessToken,
      refreshToken,
    };
    return formattedUser;
  }

  async logout(userID: string): Promise<void> {
    await this.authService.deleteRefreshToken(userID);
  }

  async changeInformation(
    userID: string,
    changeInfoDto: ChangeInformationDto,
  ): Promise<Partial<User>> {
    const { name, lastname } = changeInfoDto;
    const user = await this.userModel
      .findByIdAndUpdate(userID, { name, lastname }, { new: true })
      .select('-password');
    if (!user) throw new ConflictException('Not found this user.');
    return user;
  }

  async getUserInformation(userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    const user = await this.userModel
      .findById(userObjectId)
      .select('-password -__v')
      .exec();

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại.');
    }

    // 2. Lớp học đã tham gia (students: user.id)
    const attended = await this.classroomModel
      .find({
        students: userObjectId,
      })
      .select('title subtitle teacher')
      .populate({
        path: 'teacher',
        select: 'name lastname',
      })
      .exec();

    // 3. Lớp học đã tạo (teacher: user.id)
    const createdBy = await this.classroomModel
      .find({
        teacher: userObjectId,
      })
      .select('title subtitle teacher')
      .populate({
        path: 'teacher',
        select: 'name lastname',
      })
      .exec();

    const classrooms = [...createdBy, ...attended];

    const userObject = user.toObject();
    const userDataWithoutPass = {
      name: userObject.name,
      lastname: userObject.lastname,
      email: userObject.email,
      role: userObject.role,
    };

    return { user: userDataWithoutPass, classrooms };
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại.');
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      throw new BadRequestException({
        message: 'Mật khẩu cũ không đúng.',
        errors: [{ path: 'oldPassword', msg: 'Old password is incorrect' }],
      });
    }

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();
    } catch (error) {
      console.error('Lỗi khi hash hoặc lưu mật khẩu:', error);
      throw new InternalServerErrorException(
        'Không thể cập nhật mật khẩu do lỗi server.',
      );
    }
  }

  async resetPassword(email: string): Promise<string> {
    try {
      const user = await this.userModel.findOne({ email });
      if (!user) {
        throw new NotFoundException('Not found user with this email!');
      }
      const tempPassword = Math.random().toString(36).slice(-6);
      user.tempPassword = tempPassword;
      await user.save();
      await this.mailService.sendResetPasswordEmail(email, tempPassword);
      return tempPassword;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async verifyPassword(
    email: string,
    tempPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('Not found user with this email!');
    }
    if (tempPassword !== user.tempPassword) {
      throw new UnauthorizedException('Invalid passowrd!');
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
  }

  // Thêm hàm này:
  async getUserName(userId: string): Promise<string> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new Error('User not found.');
    }
    return `${user.name} ${user.lastname}`;
  }
}
