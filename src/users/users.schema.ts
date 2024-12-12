import { Schema, Document } from "mongoose";

// Interface untuk User
// Menentukan struktur data pengguna yang akan disimpan di database
export interface User extends Document {
    name: string,
    alamat: string,
    noTelp: string,
    email: string; 
    password: string;
    role: 'customer' | 'admin' | 'driver' | 'masteradmin'; 
    guidApplication: string,
    isActive: boolean; 
    createdAt: Date; 
    otp?: string;
    otpExpires?: Date; 
}

// Skema untuk User
// Skema ini mendefinisikan struktur data yang disimpan dalam database
export const UserSchema = new Schema({
    name: { type: String, required: true }, 
    alamat: { type: String, required: true }, 
    noTelp: { type: String, required: true }, 
    email: { type: String, required: true }, 
    password: { type: String, required: true }, 
    role: { type: String, enum: ['customer', 'admin', 'driver', 'masteradmin'], required: true },
    guidApplication: { type: String, required: false },
    isActive: { type: Boolean, default: false },
    otp: { type: String, required: false }, 
    otpExpires: { type: Date, required: false }, 
    createdAt: { type: Date, default: Date.now }, 
})

//indeks unik untuk kombinasi email dan role
UserSchema.index({ email: 1, role: 1 }, { unique: true });
