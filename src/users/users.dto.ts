// DTO untuk Registrasi Pengguna
export class RegisterDTO {
    name: string;
    alamat: string;
    noTelp: string;
    email: string;
    password: string;
    guidApplication: string;
    role: 'customer' | 'admin' | 'driver' | 'masteradmin';
}

// DTO untuk Login Pengguna
export class LoginDTO {
    email: string;
    password: string;
    guidApplication: string;
}

// DTO untuk Aktivasi Akun Pengguna
export class ActivateDTO {
    name: string;
    email: string;
    activationToken: string;
    guidApplication: string;
    role: string;
}

export class UpdateProfileDTO {
    name?: string;
    alamat?: string;
    noTelp?: string;
}

export class UpdatePasswordDto {
    email: string;
    passwordLama: string;
    passwordBaru: string;
  }

