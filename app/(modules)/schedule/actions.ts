'use server';

import { revalidatePath } from 'next/cache';
import connectToDatabase from '@/lib/mongodb';
import { Seance, JourSemaine } from '@/models/Seance';
import { Salle } from '@/models/Salle';
import { User } from '@/models/User';
import { Group } from '@/models/Group';
import { Matiere } from '@/models/Matiere';
import { requireAuth } from '@/lib/auth';

/* --- SALLES --- */
export async function createSalleAction(formData: FormData) {
  await requireAuth(['admin']);
  await connectToDatabase();

  const nom = (formData.get('nom') as string)?.trim();
  const capacite = parseInt(formData.get('capacite') as string, 10);
  const type = (formData.get('type') as string)?.trim() || 'Salle de cours';

  if (!nom || isNaN(capacite) || capacite <= 0) {
    return { success: false, error: 'Nom et capacité valide (> 0) sont obligatoires.' };
  }

  const existing = await Salle.findOne({ nom });
  if (existing) {
    return { success: false, error: 'Une salle avec ce nom existe déjà.' };
  }

  await Salle.create({ nom, capacite, type });
  revalidatePath('/admin/schedule');
  return { success: true, message: 'Salle ajoutée avec succès.' };
}

export async function deleteSalleAction(formData: FormData) {
  await requireAuth(['admin']);
  await connectToDatabase();

  const id = formData.get('id') as string;
  const inUse = await Seance.countDocuments({ salle: id });
  if (inUse > 0) {
    return { success: false, error: 'Impossible de supprimer cette salle : des séances y sont planifiées.' };
  }

  await Salle.findByIdAndDelete(id);
  revalidatePath('/admin/schedule');
  return { success: true, message: 'Salle supprimée avec succès.' };
}

/* --- SÉANCES (AVEC DÉTECTION STRICTE DES CONFLITS) --- */
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export async function createSeanceAction(formData: FormData) {
  await requireAuth(['admin']);
  await connectToDatabase();

  const jour = formData.get('jour') as JourSemaine;
  const heureDebut = (formData.get('heureDebut') as string)?.trim();
  const heureFin = (formData.get('heureFin') as string)?.trim();
  const matiere = formData.get('matiere') as string;
  const enseignant = formData.get('enseignant') as string;
  const groupe = formData.get('groupe') as string;
  const salle = formData.get('salle') as string;
  const typeSeance = (formData.get('typeSeance') as string) || 'Cours';

  if (!jour || !heureDebut || !heureFin || !matiere || !enseignant || !groupe || !salle) {
    return { success: false, error: 'Tous les champs de la séance sont requis.' };
  }

  const debutMin = timeToMinutes(heureDebut);
  const finMin = timeToMinutes(heureFin);

  // RÈGLE MÉTIER: Heure de fin postérieure à l'heure de début
  if (finMin <= debutMin) {
    return {
      success: false,
      error: "Règle de gestion : L'heure de fin doit être strictement postérieure à l'heure de début.",
    };
  }

  // RÈGLE MÉTIER: Détection des conflits sur le même jour et chevauchement horaire
  // Deux créneaux se chevauchent si : (debutA < finB) ET (finA > debutB)
  const existingSeances = await Seance.find({ jour }).populate('salle enseignant groupe matiere');

  for (const s of existingSeances) {
    const sDebut = timeToMinutes(s.heureDebut);
    const sFin = timeToMinutes(s.heureFin);

    const hasTimeOverlap = debutMin < sFin && finMin > sDebut;

    if (hasTimeOverlap) {
      // 1. Conflit de salle
      if (s.salle._id.toString() === salle) {
        return {
          success: false,
          error: `Conflit détecté : La salle "${(s.salle as any).nom}" est déjà occupée de ${s.heureDebut} à ${s.heureFin} le ${jour} par la matière ${(s.matiere as any)?.nom || ''}.`,
        };
      }

      // 2. Conflit d'enseignant
      if (s.enseignant._id.toString() === enseignant) {
        return {
          success: false,
          error: `Conflit détecté : L'enseignant ${(s.enseignant as any).nom} a déjà cours de ${s.heureDebut} à ${s.heureFin} le ${jour} avec le groupe ${(s.groupe as any)?.nom || ''}.`,
        };
      }

      // 3. Conflit de groupe
      if (s.groupe._id.toString() === groupe) {
        return {
          success: false,
          error: `Conflit détecté : Le groupe ${(s.groupe as any).nom} a déjà une séance de ${s.heureDebut} à ${s.heureFin} le ${jour} (${(s.matiere as any)?.nom || ''}).`,
        };
      }
    }
  }

  await Seance.create({
    jour,
    heureDebut,
    heureFin,
    matiere,
    enseignant,
    groupe,
    salle,
    typeSeance: (typeSeance as any) || 'Cours',
  });

  revalidatePath('/admin/schedule');
  revalidatePath('/teacher/schedule');
  revalidatePath('/student/schedule');
  return { success: true, message: 'Séance planifiée avec succès sans aucun conflit.' };
}

export async function deleteSeanceAction(formData: FormData) {
  await requireAuth(['admin']);
  await connectToDatabase();

  const id = formData.get('id') as string;
  await Seance.findByIdAndDelete(id);

  revalidatePath('/admin/schedule');
  revalidatePath('/teacher/schedule');
  revalidatePath('/student/schedule');
  return { success: true, message: 'Séance supprimée de l’emploi du temps.' };
}
