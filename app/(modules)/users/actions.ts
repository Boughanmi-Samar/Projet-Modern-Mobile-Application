'use server';

import { revalidatePath } from 'next/cache';
import connectToDatabase from '@/lib/mongodb';
import { User, UserRole } from '@/models/User';
import { requireAuth, hashPassword } from '@/lib/auth';

export async function createUserAction(formData: FormData) {
  await requireAuth(['admin']);
  await connectToDatabase();

  const nom = (formData.get('nom') as string)?.trim();
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  const role = formData.get('role') as UserRole;
  const groupeId = formData.get('groupe') as string;
  const telephone = (formData.get('telephone') as string)?.trim();

  if (!nom || !email || !password || !role) {
    return { success: false, error: 'Tous les champs obligatoires doivent être renseignés.' };
  }

  // Check email uniqueness
  const existing = await User.findOne({ email });
  if (existing) {
    return { success: false, error: 'Cet email est déjà utilisé par un autre compte.' };
  }

  const hashedPassword = await hashPassword(password);

  await User.create({
    nom,
    email,
    password: hashedPassword,
    role,
    groupe: role === 'student' && groupeId ? (groupeId as any) : undefined,
    telephone: telephone || '',
  });

  revalidatePath('/admin/users');
  return { success: true, message: 'Utilisateur créé avec succès.' };
}

export async function updateUserAction(formData: FormData) {
  await requireAuth(['admin']);
  await connectToDatabase();

  const id = formData.get('id') as string;
  const nom = (formData.get('nom') as string)?.trim();
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const role = formData.get('role') as UserRole;
  const groupeId = formData.get('groupe') as string;
  const telephone = (formData.get('telephone') as string)?.trim();
  const password = formData.get('password') as string;

  if (!id || !nom || !email || !role) {
    return { success: false, error: 'Champs obligatoires manquants.' };
  }

  const user = await User.findById(id);
  if (!user) {
    return { success: false, error: 'Utilisateur introuvable.' };
  }

  // Check unique email if changed
  if (email !== user.email) {
    const existing = await User.findOne({ email });
    if (existing) {
      return { success: false, error: 'Cet email est déjà utilisé.' };
    }
    user.email = email;
  }

  user.nom = nom;
  user.role = role;
  user.groupe = role === 'student' && groupeId ? (groupeId as any) : null;
  user.telephone = telephone || '';

  if (password && password.trim().length > 0) {
    user.password = await hashPassword(password.trim());
  }

  await user.save();
  revalidatePath('/admin/users');
  return { success: true, message: 'Utilisateur mis à jour avec succès.' };
}

export async function deleteUserAction(formData: FormData) {
  const session = await requireAuth(['admin']);
  await connectToDatabase();

  const id = formData.get('id') as string;
  if (!id) return { success: false, error: 'Identifiant manquant.' };

  if (session.id === id) {
    return { success: false, error: 'Vous ne pouvez pas supprimer votre propre compte administrateur.' };
  }

  await User.findByIdAndDelete(id);
  revalidatePath('/admin/users');
  return { success: true, message: 'Utilisateur supprimé avec succès.' };
}
