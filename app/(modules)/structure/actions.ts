'use server';

import { revalidatePath } from 'next/cache';
import connectToDatabase from '@/lib/mongodb';
import { Department } from '@/models/Department';
import { Filiere } from '@/models/Filiere';
import { Group } from '@/models/Group';
import { User } from '@/models/User';
import { requireAuth } from '@/lib/auth';

/* --- DÉPARTEMENTS --- */
export async function createDepartmentAction(formData: FormData) {
  await requireAuth(['admin']);
  await connectToDatabase();

  const nom = (formData.get('nom') as string)?.trim();
  const code = (formData.get('code') as string)?.trim().toUpperCase();
  const description = (formData.get('description') as string)?.trim();

  if (!nom || !code) {
    return { success: false, error: 'Nom et code du département sont obligatoires.' };
  }

  const existing = await Department.findOne({ code });
  if (existing) {
    return { success: false, error: 'Un département avec ce code existe déjà.' };
  }

  await Department.create({ nom, code, description: description || '' });
  revalidatePath('/admin/structure');
  return { success: true, message: 'Département créé avec succès.' };
}

export async function deleteDepartmentAction(formData: FormData) {
  await requireAuth(['admin']);
  await connectToDatabase();

  const id = formData.get('id') as string;
  const filieres = await Filiere.find({ departement: id });
  if (filieres.length > 0) {
    return { success: false, error: 'Impossible de supprimer : ce département contient des filières rattachées.' };
  }

  await Department.findByIdAndDelete(id);
  revalidatePath('/admin/structure');
  return { success: true, message: 'Département supprimé avec succès.' };
}

/* --- FILIÈRES --- */
export async function createFiliereAction(formData: FormData) {
  await requireAuth(['admin']);
  await connectToDatabase();

  const nom = (formData.get('nom') as string)?.trim();
  const niveau = (formData.get('niveau') as string)?.trim();
  const departement = formData.get('departement') as string;

  if (!nom || !niveau || !departement) {
    return { success: false, error: 'Tous les champs sont requis pour créer une filière.' };
  }

  await Filiere.create({ nom, niveau, departement });
  revalidatePath('/admin/structure');
  return { success: true, message: 'Filière créée avec succès.' };
}

export async function deleteFiliereAction(formData: FormData) {
  await requireAuth(['admin']);
  await connectToDatabase();

  const id = formData.get('id') as string;
  const groups = await Group.find({ filiere: id });
  if (groups.length > 0) {
    return { success: false, error: 'Impossible de supprimer : cette filière contient des groupes rattachés.' };
  }

  await Filiere.findByIdAndDelete(id);
  revalidatePath('/admin/structure');
  return { success: true, message: 'Filière supprimée avec succès.' };
}

/* --- GROUPES --- */
export async function createGroupAction(formData: FormData) {
  await requireAuth(['admin']);
  await connectToDatabase();

  const nom = (formData.get('nom') as string)?.trim();
  const effectif = parseInt(formData.get('effectif') as string, 10) || 0;
  const filiere = formData.get('filiere') as string;

  if (!nom || !filiere) {
    return { success: false, error: 'Le nom et la filière du groupe sont requis.' };
  }

  await Group.create({ nom, effectif, filiere });
  revalidatePath('/admin/structure');
  return { success: true, message: 'Groupe créé avec succès.' };
}

export async function deleteGroupAction(formData: FormData) {
  await requireAuth(['admin']);
  await connectToDatabase();

  const id = formData.get('id') as string;

  // RÈGLE MÉTIER: suppression refusée si le groupe contient des étudiants
  const studentsCount = await User.countDocuments({ groupe: id });
  if (studentsCount > 0) {
    return {
      success: false,
      error: `Suppression refusée : ce groupe contient actuellement ${studentsCount} étudiant(s) inscrit(s). Réaffectez-les d'abord.`,
    };
  }

  await Group.findByIdAndDelete(id);
  revalidatePath('/admin/structure');
  return { success: true, message: 'Groupe supprimé avec succès.' };
}
