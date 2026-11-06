'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { comparePassword, setSessionCookie, clearSessionCookie, requireAuth, hashPassword } from '@/lib/auth';
import { seedDatabase } from '@/lib/seed';

export async function loginAction(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Veuillez renseigner votre email et mot de passe.' };
  }

  await connectToDatabase();

  // If database is empty, seed it on first login attempt!
  const count = await User.countDocuments();
  if (count === 0) {
    await seedDatabase(true);
  }

  const user = await User.findOne({ email }).populate('groupe');
  if (!user) {
    return { success: false, error: 'Identifiants incorrects (email non trouvé).' };
  }

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    return { success: false, error: 'Mot de passe incorrect.' };
  }

  await setSessionCookie({
    id: user._id.toString(),
    email: user.email,
    nom: user.nom,
    role: user.role,
    groupeId: user.groupe?._id?.toString(),
  });

  // Redirect based on role
  let target = '/student';
  if (user.role === 'admin') target = '/admin';
  else if (user.role === 'teacher') target = '/teacher';

  redirect(target);
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect('/login');
}

export async function seedDatabaseAction(force: boolean = false) {
  const session = await requireAuth(['admin']);
  const result = await seedDatabase(force);
  revalidatePath('/admin');
  return result;
}

export async function updateProfileAction(formData: FormData) {
  const session = await requireAuth();
  await connectToDatabase();

  const nom = (formData.get('nom') as string)?.trim();
  const telephone = (formData.get('telephone') as string)?.trim();
  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;

  const user = await User.findById(session.id);
  if (!user) {
    return { success: false, error: 'Utilisateur introuvable.' };
  }

  if (nom) user.nom = nom;
  if (telephone !== undefined) user.telephone = telephone;

  if (newPassword) {
    if (!currentPassword) {
      return { success: false, error: 'Le mot de passe actuel est requis pour le modifier.' };
    }
    const isValid = await comparePassword(currentPassword, user.password);
    if (!isValid) {
      return { success: false, error: 'Le mot de passe actuel est incorrect.' };
    }
    user.password = await hashPassword(newPassword);
  }

  await user.save();
  revalidatePath('/');
  return { success: true, message: 'Profil mis à jour avec succès.' };
}
