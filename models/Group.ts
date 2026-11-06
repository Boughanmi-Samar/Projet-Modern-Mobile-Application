import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGroup extends Document {
  nom: string;
  effectif: number;
  filiere: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    nom: { type: String, required: true, trim: true },
    effectif: { type: Number, default: 0, min: 0 },
    filiere: { type: Schema.Types.ObjectId, ref: 'Filiere', required: true },
  },
  { timestamps: true }
);

export const Group: Model<IGroup> = mongoose.models.Group || mongoose.model<IGroup>('Group', GroupSchema);
export default Group;
