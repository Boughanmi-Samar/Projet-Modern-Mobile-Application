import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'admin' | 'teacher' | 'student';

export interface IUser extends Document {
  nom: string;
  email: string;
  password: string;
  role: UserRole;
  photo?: string;
  groupe?: mongoose.Types.ObjectId;
  telephone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    nom: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'teacher', 'student'], default: 'student', required: true },
    photo: { type: String, default: '' },
    groupe: { type: Schema.Types.ObjectId, ref: 'Group', default: null },
    telephone: { type: String, default: '' },
  },
  { timestamps: true }
);

// Prevent model recompilation in Next.js hot reload
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
