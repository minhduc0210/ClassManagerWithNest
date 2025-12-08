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

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Classroom.name)
    private readonly classroomModel: Model<ClassroomDocument>,
    private authService: AuthService,
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await this.userModel.create({
      ...registerData,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
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
      // Tương đương với return res.status(404).json({ message: "User not found" });
      throw new NotFoundException('Người dùng không tồn tại.');
    }

    // 2. So sánh mật khẩu cũ
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      throw new BadRequestException({
        message: 'Mật khẩu cũ không đúng.',
        errors: [{ path: 'oldPassword', msg: 'Old password is incorrect' }],
      });
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      user.password = hashedPassword;
      await user.save();
    } catch (error) {
      console.error('Lỗi khi hash hoặc lưu mật khẩu:', error);
      throw new InternalServerErrorException(
        'Không thể cập nhật mật khẩu do lỗi server.',
      );
    }
  }
}
