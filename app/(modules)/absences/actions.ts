'use server';

import { revalidatePath } from 'next/cache';
import connectToDatabase from '@/lib/mongodb';
import { Absence, StatutPresence } from '@/models/Absence';
import { Justificatif } from '@/models/Justificatif';
import { Annonce, PorteeAnnonce } from '@/models/Annonce';
import { Seance } from '@/models/Seance';
import { requireAuth } from '@/lib/auth';

/**
 * Enregistrement de l'appel pour une séance
 */
export async function saveAttendanceSheetAction(payload: {
  seanceId: string;
  dateStr: string;
  records: {
    etudiantId: string;
    statut: StatutPresence;
    justifiee?: boolean;
    remarque?: string;
  }[];
}) {
  const session = await requireAuth(['teacher', 'admin']);
  await connectToDatabase();

  const { seanceId, dateStr, records } = payload;
  const attendanceDate = new Date(dateStr);

  const seance = await Seance.findById(seanceId);
  if (!seance) {
    return { success: false, error: 'Séance introuvable.' };
  }

  // RÈGLE MÉTIER: Seul l'enseignant de la séance ou l'admin peut marquer les absences
  if (session.role === 'teacher' && seance.enseignant.toString() !== session.id) {
    return { success: false, error: 'Vous ne pouvez faire l’appel que pour vos propres cours.' };
  }

  // Enregistrer ou mettre à jour chaque présence
  for (const record of records) {
    // Check if record already exists for this student on this session and date
    const startOfDay = new Date(attendanceDate.getFullYear(), attendanceDate.getMonth(), attendanceDate.getDate());
    const endOfDay = new Date(attendanceDate.getFullYear(), attendanceDate.getMonth(), attendanceDate.getDate(), 23, 59, 59);

    const existing = await Absence.findOne({
      etudiant: record.etudiantId,
      seance: seanceId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existing) {
      existing.statut = record.statut;
      if (record.justifiee !== undefined) existing.justifiee = record.justifiee;
      if (record.remarque !== undefined) existing.remarque = record.remarque;
      await existing.save();
    } else {
      await Absence.create({
        etudiant: record.etudiantId,
        seance: seanceId,
        date: attendanceDate,
        statut: record.statut,
        justifiee: record.justifiee || false,
        remarque: record.remarque || '',
      });
    }
  }

  revalidatePath('/teacher/absences');
  revalidatePath('/student/absences');
  return { success: true, count: records.length, message: "Feuille d'émargement enregistrée avec succès !" };
}

/**
 * Synchronisation automatique de la file d'attente hors ligne (IndexedDB)
 */
export async function syncOfflineAbsencesAction(batches: {
  id?: number;
  seanceId: string;
  date: string;
  records: {
    etudiantId: string;
    statut: StatutPresence;
    justifiee?: boolean;
    remarque?: string;
  }[];
  timestamp: number;
}[]) {
  const session = await requireAuth(['teacher', 'admin']);
  await connectToDatabase();

  let syncedCount = 0;
  const processedBatchIds: number[] = [];

  for (const batch of batches) {
    const res = await saveAttendanceSheetAction({
      seanceId: batch.seanceId,
      dateStr: batch.date,
      records: batch.records,
    });

    if (res.success) {
      syncedCount += batch.records.length;
      if (batch.id !== undefined) {
        processedBatchIds.push(batch.id);
      }
    }
  }

  revalidatePath('/teacher/absences');
  revalidatePath('/student/absences');
  return {
    success: true,
    processedBatchIds,
    message: `${syncedCount} émargement(s) synchronisé(s) depuis la file hors ligne avec succès.`,
  };
}

/**
 * Soumission de justificatif d'absence par l'étudiant
 */
export async function submitJustificatifAction(formData: FormData) {
  const session = await requireAuth(['student']);
  await connectToDatabase();

  const absenceId = formData.get('absenceId') as string;
  const motif = (formData.get('motif') as string)?.trim();
  const pieceJointe = (formData.get('pieceJointe') as string)?.trim() || 'justificatif_attestation.pdf';

  if (!absenceId || !motif) {
    return { success: false, error: 'Le motif d’absence est requis.' };
  }

  const absence = await Absence.findById(absenceId);
  if (!absence || absence.etudiant.toString() !== session.id) {
    return { success: false, error: 'Absence non trouvée ou non autorisée.' };
  }

  const existingJustif = await Justificatif.findOne({ absence: absenceId });
  if (existingJustif) {
    existingJustif.motif = motif;
    existingJustif.pieceJointe = pieceJointe;
    existingJustif.decision = 'en_attente';
    existingJustif.dateSoumission = new Date();
    await existingJustif.save();
  } else {
    await Justificatif.create({
      absence: absenceId,
      motif,
      pieceJointe,
      decision: 'en_attente',
      dateSoumission: new Date(),
    });
  }

  revalidatePath('/student/absences');
  revalidatePath('/teacher/justificatifs');
  return { success: true, message: 'Votre justificatif a été soumis avec succès et est en attente de validation.' };
}

/**
 * Traitement (validation / refus) du justificatif par l'enseignant
 */
export async function reviewJustificatifAction(formData: FormData) {
  await requireAuth(['teacher', 'admin']);
  await connectToDatabase();

  const justificatifId = formData.get('justificatifId') as string;
  const decision = formData.get('decision') as 'valide' | 'refuse';
  const commentaireEnseignant = (formData.get('commentaire') as string)?.trim() || '';

  if (!justificatifId || !decision) {
    return { success: false, error: 'Décision manquante.' };
  }

  const justif = await Justificatif.findById(justificatifId).populate('absence');
  if (!justif) {
    return { success: false, error: 'Justificatif introuvable.' };
  }

  justif.decision = decision;
  justif.dateDecision = new Date();
  justif.commentaireEnseignant = commentaireEnseignant;
  await justif.save();

  // If approved, mark the absence as justifiee = true!
  if (justif.absence) {
    const absence = await Absence.findById(justif.absence._id);
    if (absence) {
      absence.justifiee = decision === 'valide';
      await absence.save();
    }
  }

  revalidatePath('/teacher/justificatifs');
  revalidatePath('/student/absences');
  return {
    success: true,
    message: decision === 'valide' ? 'Justificatif validé et absence régularisée.' : 'Justificatif refusé.',
  };
}

/**
 * Publication d'une annonce
 */
export async function createAnnonceAction(formData: FormData) {
  const session = await requireAuth(['admin', 'teacher']);
  await connectToDatabase();

  const titre = (formData.get('titre') as string)?.trim();
  const contenu = (formData.get('contenu') as string)?.trim();
  const portee = (formData.get('portee') as PorteeAnnonce) || 'generale';
  const groupe = formData.get('groupe') as string;
  const priorite = (formData.get('priorite') as string) || 'normale';

  if (!titre || !contenu) {
    return { success: false, error: 'Le titre et le contenu sont obligatoires.' };
  }

  // Teacher can only publish for a specific group
  if (session.role === 'teacher' && portee === 'generale') {
    return { success: false, error: 'Les enseignants peuvent publier des annonces ciblées pour leurs groupes.' };
  }

  await Annonce.create({
    titre,
    contenu,
    portee: session.role === 'admin' ? portee : 'groupe',
    auteur: session.id,
    groupe: groupe ? (groupe as any) : undefined,
    priorite: (priorite as any) || 'normale',
    date: new Date(),
  });

  revalidatePath('/admin/annonces');
  revalidatePath('/teacher/annonces');
  revalidatePath('/student/annonces');
  return { success: true, message: 'Annonce publiée avec succès !' };
}

export async function deleteAnnonceAction(formData: FormData) {
  const session = await requireAuth(['admin', 'teacher']);
  await connectToDatabase();

  const id = formData.get('id') as string;
  const annonce = await Annonce.findById(id);
  if (!annonce) return { success: false, error: 'Annonce non trouvée.' };

  if (session.role === 'teacher' && annonce.auteur.toString() !== session.id) {
    return { success: false, error: 'Vous ne pouvez supprimer que vos propres annonces.' };
  }

  await Annonce.findByIdAndDelete(id);
  revalidatePath('/admin/annonces');
  revalidatePath('/teacher/annonces');
  revalidatePath('/student/annonces');
  return { success: true, message: 'Annonce supprimée.' };
}
