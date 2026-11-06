import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMatiere extends Document {
  nom: string;
  code: string;
  coefficient: number;
  credits: number;
  semestre: string;
  filiere: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MatiereSchema = new Schema<IMatiere>(
  {
    nom: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    coefficient: {
      type: Number,
      required: true,
      min: [0.1, 'Le coefficient doit être strictement positif'],
    },
    credits: { type: Number, required: true, min: 1 },
    semestre: { type: String, required: true, default: 'S1' },
    filiere: { type: Schema.Types.ObjectId, ref: 'Filiere', required: true },
  },
  { timestamps: true }
);

export const Matiere: Model<IMatiere> =
  mongoose.models.Matiere || mongoose.model<IMatiere>('Matiere', MatiereSchema);
export default Matiere;
