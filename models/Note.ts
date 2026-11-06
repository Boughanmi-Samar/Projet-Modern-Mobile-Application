import mongoose, { Schema, Document, Model } from 'mongoose';

export type TypeEvaluation = 'DS' | 'TP' | 'examen';

export interface INote extends Document {
  valeur: number;
  type: TypeEvaluation;
  date: Date;
  etudiant: mongoose.Types.ObjectId;
  matiere: mongoose.Types.ObjectId;
  commentaire?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    valeur: {
      type: Number,
      required: true,
      min: [0, 'La note minimale est 0'],
      max: [20, 'La note maximale est 20'],
    },
    type: {
      type: String,
      enum: ['DS', 'TP', 'examen'],
      required: true,
    },
    date: { type: Date, default: Date.now },
    etudiant: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    matiere: { type: Schema.Types.ObjectId, ref: 'Matiere', required: true },
    commentaire: { type: String, default: '' },
  },
  { timestamps: true }
);

// One note per student per subject per exam type
NoteSchema.index({ etudiant: 1, matiere: 1, type: 1 }, { unique: true });

export const Note: Model<INote> = mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema);
export default Note;
