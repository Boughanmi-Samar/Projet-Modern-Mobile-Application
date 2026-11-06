'use server';

import connectToDatabase from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { User } from '@/models/User';
import { Matiere } from '@/models/Matiere';
import { Seance } from '@/models/Seance';
import { Absence } from '@/models/Absence';
import { Note } from '@/models/Note';
import { Group } from '@/models/Group';
import {
  analyzeStudentRisk,
  answerAssistantQuery,
  generateGradeSummaryAI,
  generateAnnouncementDraftAI,
} from '@/lib/ai-service';

/**
 * 1. Détection IA des étudiants à risque (Enseignant / Admin)
 */
export async function detectAtRiskStudentsAction(matiereId?: string) {
  const session = await requireAuth(['teacher', 'admin']);
  await connectToDatabase();

  // Find relevant matieres
  let matiereFilter: any = {};
  if (matiereId) {
    matiereFilter = { _id: matiereId };
  }

  const matieres = await Matiere.find(matiereFilter);
  const results: any[] = [];

  for (const mat of matieres) {
    // Find all sessions for this subject
    const seances = await Seance.find({ matiere: mat._id });
    const seanceIds = seances.map((s) => s._id);

    if (seanceIds.length === 0) continue;

    // Find all students enrolled in these groups
    const groupIds = [...new Set(seances.map((s) => s.groupe.toString()))];
    const students = await User.find({ role: 'student', groupe: { $in: groupIds } });

    for (const st of students) {
      // Absences
      const totalAbsences = await Absence.countDocuments({
        etudiant: st._id,
        seance: { $in: seanceIds },
        statut: { $in: ['absent', 'retard'] },
      });

      const totalSeancesExpected = Math.max(seances.length * 4, 10); // Reference semester hours
      const tauxAbsence = Math.min((totalAbsences / totalSeancesExpected) * 100, 100);

      // Grades in this subject
      const notes = await Note.find({ etudiant: st._id, matiere: mat._id });
      let moyenne = 0;
      if (notes.length > 0) {
        // Weighted average: DS 30%, TP 20%, examen 50%
        let totalWeight = 0;
        let weightedSum = 0;
        for (const n of notes) {
          const w = n.type === 'examen' ? 0.5 : n.type === 'DS' ? 0.3 : 0.2;
          weightedSum += n.valeur * w;
          totalWeight += w;
        }
        moyenne = totalWeight > 0 ? weightedSum / totalWeight : 0;
      }

      // Analyze if at risk (high absence or low grades)
      if (tauxAbsence >= 15 || (notes.length > 0 && moyenne < 10)) {
        const analysis = await analyzeStudentRisk({
          nom: st.nom,
          moyenne,
          tauxAbsence,
          totalAbsences,
          matiereNom: mat.nom,
          notes: notes.map((n) => ({ type: n.type, valeur: n.valeur })),
        });

        results.push({
          etudiant: {
            id: st._id.toString(),
            nom: st.nom,
            email: st.email,
          },
          matiere: {
            id: mat._id.toString(),
            nom: mat.nom,
            code: mat.code,
          },
          moyenne: Number(moyenne.toFixed(2)),
          tauxAbsence: Number(tauxAbsence.toFixed(1)),
          totalAbsences,
          notesCount: notes.length,
          ...analysis,
        });
      }
    }
  }

  // Sort by risk priority: Critique first, then Modéré
  const priorityOrder: Record<string, number> = { Critique: 0, Modéré: 1, Faible: 2 };
  results.sort((a, b) => priorityOrder[a.niveauRisque] - priorityOrder[b.niveauRisque]);

  return { success: true, atRiskStudents: results };
}

/**
 * 2. Assistant Chatbot IA UniConnect
 */
export async function chatWithAssistantAction(userMessage: string) {
  const session = await requireAuth();
  await connectToDatabase();

  const user = await User.findById(session.id).populate('groupe');
  if (!user) {
    return { success: false, error: 'Utilisateur introuvable.' };
  }

  // Context gathering
  let prochaineSeance: any = null;
  let absencesStats: any = null;
  let moyenneGenerale = 0;
  let notesList: any[] = [];

  if (session.role === 'student' && user.groupe) {
    // Upcoming session
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const currentDay = days[new Date().getDay()];

    const seances = await Seance.find({ groupe: user.groupe._id })
      .populate('matiere enseignant salle')
      .sort({ heureDebut: 1 });

    // Look for next session today or tomorrow
    const todaySeance = seances.find((s) => s.jour === currentDay);
    const chosenSeance = todaySeance || seances[0];

    if (chosenSeance) {
      prochaineSeance = {
        jour: chosenSeance.jour,
        heureDebut: chosenSeance.heureDebut,
        heureFin: chosenSeance.heureFin,
        matiere: (chosenSeance.matiere as any)?.nom || 'Cours',
        enseignant: (chosenSeance.enseignant as any)?.nom,
        salle: (chosenSeance.salle as any)?.nom,
      };
    }

    // Absences
    const absences = await Absence.find({ etudiant: user._id });
    const justifiees = absences.filter((a) => a.justifiee).length;
    const nonJustifiees = absences.filter((a) => !a.justifiee && a.statut !== 'present').length;
    const total = absences.filter((a) => a.statut !== 'present').length;
    const estimatedTotalSessions = 30;
    const tauxGlobal = ((total / estimatedTotalSessions) * 100).toFixed(1);

    absencesStats = {
      total,
      justifiees,
      nonJustifiees,
      tauxGlobal,
    };

    // Notes
    const notes = await Note.find({ etudiant: user._id }).populate('matiere');
    notesList = notes.map((n) => ({
      valeur: n.valeur,
      type: n.type,
      matiere: (n.matiere as any)?.nom || '',
      coefficient: (n.matiere as any)?.coefficient || 1,
    }));

    if (notesList.length > 0) {
      const sum = notesList.reduce((acc, curr) => acc + curr.valeur * curr.coefficient, 0);
      const totalCoeff = notesList.reduce((acc, curr) => acc + curr.coefficient, 0);
      moyenneGenerale = totalCoeff > 0 ? sum / totalCoeff : 0;
    }
  }

  const reply = await answerAssistantQuery(userMessage, {
    userName: user.nom,
    role: user.role,
    groupeNom: (user.groupe as any)?.nom,
    prochaineSeance,
    absencesStats,
    moyenneGenerale: moyenneGenerale || undefined,
    notes: notesList,
  });

  return { success: true, reply };
}

/**
 * 3. Résumé du relevé de notes en langage naturel
 */
export async function generateGradeSummaryAction(studentId?: string) {
  const session = await requireAuth();
  await connectToDatabase();

  const targetId = session.role === 'student' ? session.id : studentId || session.id;
  const user = await User.findById(targetId);
  if (!user) return { success: false, error: 'Étudiant introuvable.' };

  const notes = await Note.find({ etudiant: targetId }).populate('matiere');
  if (notes.length === 0) {
    return {
      success: true,
      summary: 'Aucune note n’a encore été enregistrée pour ce semestre. Le relevé sera commenté dès la saisie des premières évaluations.',
    };
  }

  // Group by matiere
  const matieresMap: Record<string, { nom: string; code: string; coeff: number; credits: number; notes: any[] }> = {};
  for (const n of notes) {
    const mat = n.matiere as any;
    if (!mat) continue;
    const id = mat._id.toString();
    if (!matieresMap[id]) {
      matieresMap[id] = {
        nom: mat.nom,
        code: mat.code,
        coeff: mat.coefficient,
        credits: mat.credits,
        notes: [],
      };
    }
    matieresMap[id].notes.push(n);
  }

  let totalWeighted = 0;
  let totalCoeff = 0;
  let totalCreditsAcquis = 0;
  const matieresStats: any[] = [];

  for (const mat of Object.values(matieresMap)) {
    // Subject average
    const avg = mat.notes.reduce((acc, curr) => acc + curr.valeur, 0) / mat.notes.length;
    const isValide = avg >= 10;
    if (isValide) totalCreditsAcquis += mat.credits;

    totalWeighted += avg * mat.coeff;
    totalCoeff += mat.coeff;

    matieresStats.push({
      nom: mat.nom,
      code: mat.code,
      moyenne: avg,
      valide: isValide,
      credits: mat.credits,
    });
  }

  const moyenneGenerale = totalCoeff > 0 ? totalWeighted / totalCoeff : 0;
  let mention = 'Ajourné';
  if (moyenneGenerale >= 16) mention = 'Très Bien';
  else if (moyenneGenerale >= 14) mention = 'Bien';
  else if (moyenneGenerale >= 12) mention = 'Assez Bien';
  else if (moyenneGenerale >= 10) mention = 'Passable';

  const summary = await generateGradeSummaryAI({
    nom: user.nom,
    moyenneGenerale,
    mention,
    valide: moyenneGenerale >= 10,
    totalCredits: totalCreditsAcquis,
    matieres: matieresStats,
  });

  return { success: true, summary, moyenneGenerale, mention, totalCreditsAcquis };
}

/**
 * 4. Aide IA à la rédaction d'annonces
 */
export async function generateAnnouncementDraftAction(params: {
  sujet: string;
  destinataires: string;
  ton?: 'professionnel' | 'urgent' | 'encourageant';
}) {
  await requireAuth(['admin', 'teacher']);
  const draft = await generateAnnouncementDraftAI(params);
  return { success: true, draft };
}
