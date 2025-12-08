import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RegisterDto } from './dto/register.dto';
import { User, UserDocument } from './entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private authService: AuthService,
  ) {}

  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
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
}
