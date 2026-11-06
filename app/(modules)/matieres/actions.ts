'use server';

import { revalidatePath } from 'next/cache';
import connectToDatabase from '@/lib/mongodb';
import { Matiere } from '@/models/Matiere';
import { Affectation } from '@/models/Affectation';
import { Seance } from '@/models/Seance';
import { requireAuth } from '@/lib/auth';

/* --- MATIÈRES --- */
export async function createMatiereAction(formData: FormData) {
  await requireAuth(['admin']);
  await connectToDatabase();

  const nom = (formData.get('nom') as string)?.trim();
  const code = (formData.get('code') as string)?.trim().toUpperCase();
  const coefficient = parseFloat(formData.get('coefficient') as string);
  const credits = parseInt(formData.get('credits') as string, 10);
  const semestre = (formData.get('semestre') as string)?.trim() || 'S1';
  const filiere = formData.get('filiere') as string;

  if (!nom || !code || isNaN(coefficient) || isNaN(credits) || !filiere) {
    return { success: false, error: 'Tous les champs obligatoires doivent être renseignés.' };
  }

  // RÈGLE MÉTIER: Coefficient strictement positif
  if (coefficient <= 0) {
    return { success: false, error: 'Règle de gestion : Le coefficient doit être strictement supérieur à 0.' };
  }

  if (credits < 1) {
    return { success: false, error: 'Les crédits ECTS doivent être supérieurs ou égaux à 1.' };
  }

  const existing = await Matiere.findOne({ code });
  if (existing) {
    return { success: false, error: 'Une matière avec ce code existe déjà.' };
  }

  await Matiere.create({ nom, code, coefficient, credits, semestre, filiere });
  revalidatePath('/admin/matieres');
  return { success: true, message: 'Matière créée avec succès.' };
}

export async function deleteMatiereAction(formData: FormData) {
  await requireAuth(['admin']);
  await connectToDatabase();

  const id = formData.get('id') as string;

  const seancesCount = await Seance.countDocuments({ matiere: id });
  if (seancesCount > 0) {
    return {
      success: false,
      error: 'Impossible de supprimer cette matière : elle est programmée dans l’emploi du temps.',
    };
  }

  await Affectation.deleteMany({ matiere: id });
  await Matiere.findByIdAndDelete(id);
  revalidatePath('/admin/matieres');
  return { success: true, message: 'Matière supprimée avec succès.' };
}

/* --- AFFECTATIONS (ENSEIGNANT <-> MATIÈRE <-> GROUPE) --- */
export async function createAffectationAction(formData: FormData) {
  await requireAuth(['admin']);
  await connectToDatabase();

  const matiere = formData.get('matiere') as string;
  const enseignant = formData.get('enseignant') as string;
  const groupe = formData.get('groupe') as string;
  const anneeUniversitaire = (formData.get('anneeUniversitaire') as string)?.trim() || '2025-2026';

  if (!matiere || !enseignant || !groupe) {
    return { success: false, error: 'Matière, enseignant et groupe sont requis.' };
  }

  const existing = await Affectation.findOne({ matiere, enseignant, groupe, anneeUniversitaire });
  if (existing) {
    return { success: false, error: 'Cette affectation existe déjà pour cette année universitaire.' };
  }

  await Affectation.create({ matiere, enseignant, groupe, anneeUniversitaire });
  revalidatePath('/admin/matieres');
  return { success: true, message: 'Affectation enregistrée avec succès.' };
}

export async function deleteAffectationAction(formData: FormData) {
  await requireAuth(['admin']);
  await connectToDatabase();

  const id = formData.get('id') as string;
  await Affectation.findByIdAndDelete(id);
  revalidatePath('/admin/matieres');
  return { success: true, message: 'Affectation supprimée avec succès.' };
}
