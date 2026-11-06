import mongoose, { Schema, Document, Model } from 'mongoose';

export type StatutPresence = 'absent' | 'retard' | 'present';

export interface IAbsence extends Document {
  date: Date;
  statut: StatutPresence;
  justifiee: boolean;
  etudiant: mongoose.Types.ObjectId;
  seance: mongoose.Types.ObjectId;
  remarque?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AbsenceSchema = new Schema<IAbsence>(
  {
    date: { type: Date, required: true },
    statut: {
      type: String,
      enum: ['absent', 'retard', 'present'],
      default: 'absent',
      required: true,
    },
    justifiee: { type: Boolean, default: false },
    etudiant: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    seance: { type: Schema.Types.ObjectId, ref: 'Seance', required: true },
    remarque: { type: String, default: '' },
  },
  { timestamps: true }
);

// Compound index to quickly find attendance for a session on a date
AbsenceSchema.index({ etudiant: 1, seance: 1, date: 1 }, { unique: true });

export const Absence: Model<IAbsence> =
  mongoose.models.Absence || mongoose.model<IAbsence>('Absence', AbsenceSchema);
export default Absence;
