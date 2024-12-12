import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt'; // Import JwtModule
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserSchema } from './users.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    JwtModule.register({
      secret: 'secretKey', // Replace with your own secret
      signOptions: { expiresIn: '1h' }, // Adjust expiration time as needed
    }),
  ],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
