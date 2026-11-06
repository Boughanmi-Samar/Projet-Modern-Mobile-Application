import mongoose, { Schema, Document, Model } from 'mongoose';

export type JourSemaine = 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi';

export interface ISeance extends Document {
  jour: JourSemaine;
  heureDebut: string; // Format "HH:mm" e.g. "08:30"
  heureFin: string;   // Format "HH:mm" e.g. "10:30"
  matiere: mongoose.Types.ObjectId;
  enseignant: mongoose.Types.ObjectId;
  groupe: mongoose.Types.ObjectId;
  salle: mongoose.Types.ObjectId;
  typeSeance?: 'Cours' | 'TD' | 'TP';
  createdAt: Date;
  updatedAt: Date;
}

const SeanceSchema = new Schema<ISeance>(
  {
    jour: {
      type: String,
      enum: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
      required: true,
    },
    heureDebut: { type: String, required: true },
    heureFin: { type: String, required: true },
    matiere: { type: Schema.Types.ObjectId, ref: 'Matiere', required: true },
    enseignant: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    groupe: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    salle: { type: Schema.Types.ObjectId, ref: 'Salle', required: true },
    typeSeance: { type: String, enum: ['Cours', 'TD', 'TP'], default: 'Cours' },
  },
  { timestamps: true }
);

export const Seance: Model<ISeance> =
  mongoose.models.Seance || mongoose.model<ISeance>('Seance', SeanceSchema);
export default Seance;
