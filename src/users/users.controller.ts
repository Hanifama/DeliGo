// Import dari NestJS
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Res,
  Delete,
  Param,
  Req,
  Put,
} from '@nestjs/common';

// Import dari service dan DTO
import { UsersService } from './users.service';
import {
  ActivateDTO,
  LoginDTO,
  RegisterDTO,
  UpdatePasswordDto,
  UpdateProfileDTO,
} from './users.dto';

// Import dari guard dan decorator
import { RolesGuard } from './config/roles.guard';
import { Roles } from './config/roles.decorator';
import { AuthGuard } from './config/authGuard';

// Import dari express
import { Response } from 'express';

// Import dari response API
import { ResponseAPI } from '../api/responses';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  /**
  * Endpoint untuk registrasi pengguna baru.
  * Setelah registrasi, pengguna akan menerima email OTP.
  */
  @Post('register')
  async register(@Body() registerDto: RegisterDTO) {
    try {
      return await this.usersService.register(registerDto);
    } catch (error) {
      return error;
    }
  }

  /**
   * Endpoint untuk mengaktifkan akun menggunakan kode OTP.
   * Jika OTP kedaluwarsa, akan mengirimkan OTP baru.
   */
  @Post('activate')
  async activate(@Body() activateDto: ActivateDTO) {
    try {
      const response = await this.usersService.activate(activateDto);
      return response;
    } catch (error) {
      return ResponseAPI.error(error.message, 400);
    }
  }

  /**
   * Endpoint untuk login pengguna.
   * Menghasilkan token aplikasi dan token pengguna.
   */
  @Post('login')
  async login(@Body() loginDto: LoginDTO) {
    return this.usersService.login(loginDto);
  }

  /**
   * Endpoint untuk mengambil semua data pengguna.
   */
  @Get('all')
  async getAllUsers(@Res() res: Response) {
    const response = await this.usersService.getAllUsers();
    return res.status((response as any).statusCode).json(response);
  }

  /**
   * Endpoint untuk mengambil data profile pengguna.
   */
  @Get('profile')
  @UseGuards(AuthGuard)
  async getProfile(@Req() request): Promise<any> {
    const userId = request.user.userId;
    console.log('UserID:', userId);

    return this.usersService.findById(userId);
  }

  /**
   * Endpoint untuk update data profile pengguna.
   */
  @Put('profile')
  @UseGuards(AuthGuard)
  async updateProfile(
    @Req() request,
    @Body() updateProfileDto: UpdateProfileDTO,
    @Res() res: Response
  ): Promise<any> {
    const userId = request.user.userId;  // Ambil userId dari token
    const response = await this.usersService.updateProfile(userId, updateProfileDto);
    return res.status((response as any).statusCode).json(response);
  }

  /**
   * Endpoint untuk lupa password pengguna.
   */
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string, @Res() res: Response) {
    const response = await this.usersService.forgotPassword(email);
    return res.status((response as any).statusCode).json(response);
  }

  /**
   * Endpoint untuk update password pengguna.
   */
  @Put('/update-password')
  @UseGuards(AuthGuard)
  async updatePassword(@Body() updatePasswordDto: UpdatePasswordDto, @Req() req: Request, @Res() res: Response): Promise<any> {
    const { email, passwordLama, passwordBaru } = updatePasswordDto;
    const userToken = req.headers['user-token'];
    const response = await this.usersService.updatePassword(email, passwordLama, passwordBaru, userToken);
    return res.status((response as any).statusCode).json(response);
  }


  /**
   * Endpoint untuk menghapus pengguna berdasarkan ID.
   * Hanya dapat diakses oleh admin.
   */
  @Delete(':id')
  async deleteUser(@Param('id') userId: string, @Res() res: Response): Promise<any> {
    const response = await this.usersService.deleteUser(userId);
    return res.status((response as any).statusCode).json(response);
  }

  /**
   * Endpoint yang hanya bisa diakses oleh pengguna dengan role 'admin'.
   */
  @Post('admin-only')
  @Roles('admin') // Menambahkan role guard untuk admin
  @UseGuards(RolesGuard)
  async adminOnly() {
    return 'Admin area accessed!';
  }
}
