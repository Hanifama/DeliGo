import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];

        if (!authHeader) {
            throw new UnauthorizedException('Token tidak disediakan!');
        }

        const [bearer, token] = authHeader.split(' ');

        if (bearer !== 'Bearer' || !token) {
            throw new UnauthorizedException('Format token tidak valid!');
        }

        try {
            const decoded = this.jwtService.verify(token);
            request.user = decoded; // Tambahkan user ke request untuk akses di controller
            return true;
        } catch (error) {
            throw new UnauthorizedException('Token tidak valid atau telah kedaluwarsa!');
        }
    }
}
