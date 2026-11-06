import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAffectation extends Document {
  anneeUniversitaire: string;
  matiere: mongoose.Types.ObjectId;
  enseignant: mongoose.Types.ObjectId;
  groupe: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AffectationSchema = new Schema<IAffectation>(
  {
    anneeUniversitaire: { type: String, required: true, default: '2025-2026' },
    matiere: { type: Schema.Types.ObjectId, ref: 'Matiere', required: true },
    enseignant: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    groupe: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
  },
  { timestamps: true }
);

// Compound index to avoid duplicate assignments
AffectationSchema.index({ anneeUniversitaire: 1, matiere: 1, enseignant: 1, groupe: 1 }, { unique: true });

export const Affectation: Model<IAffectation> =
  mongoose.models.Affectation || mongoose.model<IAffectation>('Affectation', AffectationSchema);
export default Affectation;
