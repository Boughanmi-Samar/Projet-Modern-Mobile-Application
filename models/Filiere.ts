import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFiliere extends Document {
  nom: string;
  niveau: string;
  departement: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FiliereSchema = new Schema<IFiliere>(
  {
    nom: { type: String, required: true, trim: true },
    niveau: { type: String, required: true, trim: true },
    departement: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  },
  { timestamps: true }
);

export const Filiere: Model<IFiliere> =
  mongoose.models.Filiere || mongoose.model<IFiliere>('Filiere', FiliereSchema);
export default Filiere;
