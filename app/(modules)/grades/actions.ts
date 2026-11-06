'use server';

import { revalidatePath } from 'next/cache';
import connectToDatabase from '@/lib/mongodb';
import { Note, TypeEvaluation } from '@/models/Note';
import { Affectation } from '@/models/Affectation';
import { requireAuth } from '@/lib/auth';

export async function saveGradeAction(formData: FormData) {
  const session = await requireAuth(['teacher', 'admin']);
  await connectToDatabase();

  const etudiant = formData.get('etudiant') as string;
  const matiere = formData.get('matiere') as string;
  const type = formData.get('type') as TypeEvaluation;
  const valeurRaw = formData.get('valeur') as string;
  const commentaire = (formData.get('commentaire') as string)?.trim() || '';

  if (!etudiant || !matiere || !type || valeurRaw === undefined || valeurRaw === '') {
    return { success: false, error: 'Étudiant, matière, type d’évaluation et note sont obligatoires.' };
  }

  const valeur = parseFloat(valeurRaw);

  // RÈGLE MÉTIER: Note comprise entre 0 et 20
  if (isNaN(valeur) || valeur < 0 || valeur > 20) {
    return {
      success: false,
      error: 'Règle de gestion : La note doit être impérativement comprise entre 0 et 20.',
    };
  }

  // RÈGLE MÉTIER: un enseignant n'intervient que sur les matières qui lui sont affectées
  if (session.role === 'teacher') {
    const isAssigned = await Affectation.findOne({ enseignant: session.id, matiere });
    if (!isAssigned) {
      return {
        success: false,
        error: 'Règle de gestion : Vous n’êtes pas affecté à cette matière pour pouvoir en saisir les notes.',
      };
    }
  }

  // RÈGLE MÉTIER: une seule note par étudiant, matière et type d'évaluation (upsert ou modification)
  const existingNote = await Note.findOne({ etudiant, matiere, type });
  if (existingNote) {
    existingNote.valeur = valeur;
    existingNote.date = new Date();
    if (commentaire) existingNote.commentaire = commentaire;
    await existingNote.save();
  } else {
    await Note.create({
      etudiant,
      matiere,
      type,
      valeur,
      commentaire,
      date: new Date(),
    });
  }

  revalidatePath('/teacher/grades');
  revalidatePath('/student/grades');
  return { success: true, message: `Note de ${type} enregistrée avec succès (${valeur}/20).` };
}

export async function deleteGradeAction(formData: FormData) {
  const session = await requireAuth(['teacher', 'admin']);
  await connectToDatabase();

  const id = formData.get('id') as string;
  const note = await Note.findById(id);
  if (!note) {
    return { success: false, error: 'Note introuvable.' };
  }

  if (session.role === 'teacher') {
    const isAssigned = await Affectation.findOne({ enseignant: session.id, matiere: note.matiere });
    if (!isAssigned) {
      return { success: false, error: 'Vous n’êtes pas autorisé à supprimer cette note.' };
    }
  }

  await Note.findByIdAndDelete(id);
  revalidatePath('/teacher/grades');
  revalidatePath('/student/grades');
  return { success: true, message: 'Note supprimée.' };
}
