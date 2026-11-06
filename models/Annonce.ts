import mongoose, { Schema, Document, Model } from 'mongoose';

export type PorteeAnnonce = 'generale' | 'groupe';

export interface IAnnonce extends Document {
  titre: string;
  contenu: string;
  date: Date;
  portee: PorteeAnnonce;
  auteur: mongoose.Types.ObjectId;
  groupe?: mongoose.Types.ObjectId;
  priorite?: 'normale' | 'importante' | 'urgente';
  createdAt: Date;
  updatedAt: Date;
}

const AnnonceSchema = new Schema<IAnnonce>(
  {
    titre: { type: String, required: true, trim: true },
    contenu: { type: String, required: true },
    date: { type: Date, default: Date.now },
    portee: {
      type: String,
      enum: ['generale', 'groupe'],
      default: 'generale',
      required: true,
    },
    auteur: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    groupe: { type: Schema.Types.ObjectId, ref: 'Group', default: null },
    priorite: {
      type: String,
      enum: ['normale', 'importante', 'urgente'],
      default: 'normale',
    },
  },
  { timestamps: true }
);

export const Annonce: Model<IAnnonce> =
  mongoose.models.Annonce || mongoose.model<IAnnonce>('Annonce', AnnonceSchema);
export default Annonce;
