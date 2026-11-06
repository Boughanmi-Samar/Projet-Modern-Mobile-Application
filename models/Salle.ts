import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISalle extends Document {
  nom: string;
  capacite: number;
  type?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SalleSchema = new Schema<ISalle>(
  {
    nom: { type: String, required: true, unique: true, trim: true },
    capacite: { type: Number, required: true, min: 1 },
    type: { type: String, default: 'Salle de cours' },
  },
  { timestamps: true }
);

export const Salle: Model<ISalle> = mongoose.models.Salle || mongoose.model<ISalle>('Salle', SalleSchema);
export default Salle;
