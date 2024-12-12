// Import dari NestJS
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';

// Import dari Mongoose
import { Model } from 'mongoose';

// Import dari library pihak ketiga
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';

// Import dari schema dan DTO
import { User } from './users.schema';
import {
    ActivateDTO,
    LoginDTO,
    RegisterDTO,
    UpdateProfileDTO,
} from './users.dto';

// Import dari response API
import { ResponseAPI } from '../api/responses';

@Injectable()
export class UsersService {
    private transporter: nodemailer.Transporter;

    constructor(
        @InjectModel('User') private readonly userModel: Model<User>,
        private readonly jwtService: JwtService,
    ) {
        // Inisialisasi transporter untuk Nodemailer
        this.transporter = nodemailer.createTransport({
            service: 'Gmail', // Menggunakan layanan Gmail
            auth: {
                user: process.env.EMAIL_USER, // Email dari variabel lingkungan
                pass: process.env.EMAIL_PASS, // Password aplikasi dari variabel lingkungan
            },
        });
    }

    // Fungsi untuk membuat user baru
    async register(registerDto: RegisterDTO): Promise<ResponseAPI> {
        const { email, password, role, name, alamat, noTelp, guidApplication } = registerDto;

        // Cek apakah user sudah ada
        const existingUser = await this.userModel.findOne({ email, role });
        if (existingUser) {
            throw new Error('Akun dengan email dan peran ini sudah terdaftar!');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 1 * 60 * 1000);

        const newUser = new this.userModel({
            email,
            password: hashedPassword,
            role,
            name,
            alamat,
            noTelp,
            guidApplication,
            otp,
            otpExpires,
            isActive: false,
        });

        try {
            await newUser.save();
            await this.sendOtpEmail(email, otp);
            return ResponseAPI.successOnly('Register berhasil! Silakan aktifasi akun Anda.');
        } catch (error: any) {
            if (error.code === 11000) {
                return ResponseAPI.error('Email ini sudah digunakan!. Gunakan email berbeda.');
            }
            return ResponseAPI.error('Terjadi kesalahan saat registrasi. Silakan coba lagi.');
        }
    }

    // Aktivasi Akun menggunakan OTP
    async activate(activateDto: ActivateDTO): Promise<ResponseAPI> {
        const { email, activationToken } = activateDto;

        const user = await this.userModel.findOne({ email });
        if (!user) {
            return ResponseAPI.error('Akun Anda Belum Tersedia!');
        }

        if (user.isActive) {
            return ResponseAPI.error('Akun Anda sudah aktif! Silahkan Login');
        }

        if (user.otpExpires < new Date()) {
            // OTP sudah kedaluwarsa, buat OTP baru dan kirimkan
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpires = new Date(Date.now() + 1 * 60 * 1000);

            user.otp = otp;
            user.otpExpires = otpExpires;
            await user.save();

            await this.sendOtpEmail(user.email, otp);

            return ResponseAPI.error('OTP telah kedaluwarsa. Kode OTP baru telah dikirimkan ke email Anda.');
        }

        if (user.otp !== activationToken) {
            return ResponseAPI.error('Kode OTP Tidak Sesuai! Periksa Kembali Kode OTP');
        }

        // Aktivasi akun
        user.isActive = true;
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        return ResponseAPI.successOnly('Aktivasi Akun Berhasil! Silahkan Login');
    }

    // Fungsi untuk Login dan Membuat Token
    async login(loginDto: LoginDTO): Promise<ResponseAPI> {
        const { email, password, guidApplication } = loginDto;

        // Cek apakah email terdaftar
        const user = await this.userModel.findOne({ email });
        if (!user) {
            return ResponseAPI.error('Email tidak terdaftar. Silakan periksa kembali atau daftar.');
        }

        // Cek apakah guidApplication sesuai
        if (user.guidApplication !== guidApplication) {
            return ResponseAPI.error('GUID aplikasi tidak sesuai. Silakan coba lagi.');
        }

        // Cek apakah password cocok
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return ResponseAPI.error('Password salah. Silakan coba lagi.');
        }

        // Membuat app token dan user token
        const appToken = this.jwtService.sign(
            {
                email: user.email,
                role: user.role,
                guidApplication: user.guidApplication,
                userId: user._id
            },
            { expiresIn: '1d' }
        );

        const userToken = this.jwtService.sign(
            {
                email: user.email,
                role: user.role,
                guidApplication: user.guidApplication,
                userId: user._id
            },
            { expiresIn: '1h' }
        );

        return ResponseAPI.success({ appToken, userToken }, 'Selamat Login berhasil!');
    }

    // Mengambil semua data pengguna
    async getAllUsers(): Promise<ResponseAPI> {
        try {
            const users = await this.userModel.find().select('-otp -otpExpires -password');
            return ResponseAPI.success(users, 'Berhasil mengambil semua data pengguna.');
        } catch (error) {
            console.error('Error saat mengambil data pengguna:', error);
            return ResponseAPI.error('Gagal mengambil data pengguna.');
        }
    }

    // Mengambil data pengguna berdasarkan userID
    async findById(userId: string): Promise<ResponseAPI> {
        try {
            const user = await this.userModel.findById(userId).select('-otp -otpExpires -password');
            if (!user) {
                return ResponseAPI.error('Pengguna tidak ditemukan!');
            }
            return ResponseAPI.success(user, 'Berhasil mengambil profil pengguna.');
        } catch (error) {
            return ResponseAPI.error('Gagal mengambil profil pengguna.');
        }
    }

    // Update data pengguna
    async updateProfile(userId: string, updateProfileDto: UpdateProfileDTO): Promise<ResponseAPI> {
        try {
            const user = await this.userModel.findById(userId);
            if (!user) {
                return ResponseAPI.error('Pengguna tidak ditemukan!');
            }

            // Update data pengguna
            user.name = updateProfileDto.name || user.name;
            user.alamat = updateProfileDto.alamat || user.alamat;
            user.noTelp = updateProfileDto.noTelp || user.noTelp;

            // Simpan perubahan ke database
            await user.save();

            return ResponseAPI.successOnly('Profil pengguna berhasil diperbarui.');
        } catch (error) {
            return ResponseAPI.error('Gagal memperbarui profil pengguna.');
        }
    }

    // Lupa password pengguna
    async forgotPassword(email: string): Promise<ResponseAPI> {
        try {
            const user = await this.userModel.findOne({ email });
            if (!user) {
                return ResponseAPI.error('User  tidak ditemukan', 404);
            }

            const resetPassword = Math.floor(100000 + Math.random() * 900000).toString(); // 6 angka random
            const hashedPassword = await bcrypt.hash(resetPassword, 10);
            user.password = hashedPassword;
            user.otpExpires = null;
            await user.save();

            await this.sendResetPassword(email, resetPassword);

            return ResponseAPI.successOnly('Riset Sandi Telah Dikirim ke Email Anda !');
        } catch (error) {
            return ResponseAPI.error('Gagal mengirim riset sandi');
        }
    }

    // Update password data pengguna
    async updatePassword(email: string, passwordLama: string, passwordBaru: string, userToken: string): Promise<ResponseAPI> {
        try {
            const user = await this.userModel.findOne({ email });
            if (!user) {
                return ResponseAPI.error('User  tidak ditemukan', 404);
            }

            const isValidPassword = await bcrypt.compare(passwordLama, user.password);
            if (!isValidPassword) {
                return ResponseAPI.error('Password lama salah', 400);
            }

            const hashedPasswordBaru = await bcrypt.hash(passwordBaru, 10);
            user.password = hashedPasswordBaru;
            await user.save();

            return ResponseAPI.successOnly('Password berhasil diupdate');
        } catch (error) {
            return ResponseAPI.error('Gagal mengupdate password');
        }
    }

    // Menghapus pengguna berdasarkan ID
    async deleteUser(userId: string): Promise<ResponseAPI> {
        try {
            const user = await this.userModel.findById(userId);
            if (!user) {
                return ResponseAPI.error('User  tidak ditemukan', 404);
            }
            await this.userModel.findByIdAndDelete(userId);
            return ResponseAPI.successOnly('User  berhasil dihapus');
        } catch (error) {
            return ResponseAPI.error('Gagal menghapus user');
        }
    }

    // Fungsi untuk mengirimkan email OTP
    private async sendOtpEmail(email: string, otp: string): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Aktivasi Akun Anda - Kode OTP untuk Verifikasi',
                text: `
                    Hallo Selamat Datang!,
                    Terima kasih telah mendaftar di layanan kami. Untuk melengkapi proses registrasi, 
                    silakan masukkan kode OTP berikut untuk mengaktifkan akun Anda:
                    Kode OTP: ${otp}
                    Kode OTP ini berlaku selama semenit. Jika Anda tidak melakukan registrasi, 
                    abaikan email ini.
                    Hormat kami,
                    Tim Support
                `,
            });
        } catch (error) {
            console.error('Error saat mengirim email OTP:', error);
            throw new Error('Gagal mengirim email OTP');
        }
    }

    // Fungsi untuk mengirimkan email OTP
    private async sendResetPassword(email: string, resetPassword: string): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Reset Password - Reset Sandi Untuk Login',
                text: `
              Hallo Selamat Datang!,
              Terima kasih telah menggunakan layanan kami. Untuk mereset password Anda, 
              silakan masukkan kode riset dibawah ini,
              sandi Reset Password Anda: ${resetPassword},
              sandi ini berlaku selama 3 menit. Segera dipakai untuk login, dan jika Anda tidak melakukan permintaan ini, 
              abaikan email ini.
              Hormat kami,
              Tim Support
            `,
            });
        } catch (error) {
            console.error('Error saat mengirim email riset password:', error);
            throw new Error('Gagal mengirim riset password');
        }
    }
}


