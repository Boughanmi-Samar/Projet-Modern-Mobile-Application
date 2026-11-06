import mongoose, { Schema, Document, Model } from 'mongoose';

export type DecisionJustificatif = 'en_attente' | 'valide' | 'refuse';

export interface IJustificatif extends Document {
  motif: string;
  pieceJointe?: string; // Text description or uploaded reference / file name
  decision: DecisionJustificatif;
  absence: mongoose.Types.ObjectId;
  dateSoumission: Date;
  dateDecision?: Date;
  commentaireEnseignant?: string;
  createdAt: Date;
  updatedAt: Date;
}

const JustificatifSchema = new Schema<IJustificatif>(
  {
    motif: { type: String, required: true, trim: true },
    pieceJointe: { type: String, default: '' },
    decision: {
      type: String,
      enum: ['en_attente', 'valide', 'refuse'],
      default: 'en_attente',
      required: true,
    },
    absence: { type: Schema.Types.ObjectId, ref: 'Absence', required: true, unique: true },
    dateSoumission: { type: Date, default: Date.now },
    dateDecision: { type: Date },
    commentaireEnseignant: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Justificatif: Model<IJustificatif> =
  mongoose.models.Justificatif || mongoose.model<IJustificatif>('Justificatif', JustificatifSchema);
export default Justificatif;
