import connectToDatabase from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { User } from '@/models/User';
import { Note } from '@/models/Note';
import { Matiere } from '@/models/Matiere';
import GradeReportView from '@/components/modules/GradeReportView';



export default async function StudentGradesPage() {
  const session = await requireAuth(['student']);
  await connectToDatabase();

  const user = await User.findById(session.id).populate('groupe');
  const userGroup = user?.groupe as any;

  // Find all subjects for this student's filiere/group
  const notes = await Note.find({ etudiant: session.id }).populate('matiere');
  const allMatieres = await Matiere.find().sort({ code: 1 });

  // Map notes to each matiere
  const matieresSummaries = allMatieres.map((m) => {
    const subjectNotes = notes.filter((n) => (n.matiere as any)?._id?.toString() === m._id.toString());

    // Weighted average: DS 30%, TP 20%, Exam 50%
    let totalWeight = 0;
    let weightedSum = 0;

    subjectNotes.forEach((n) => {
      const w = n.type === 'examen' ? 0.5 : n.type === 'DS' ? 0.3 : 0.2;
      weightedSum += n.valeur * w;
      totalWeight += w;
    });

    const moyenneMatiere = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const isValide = moyenneMatiere >= 10;

    return {
      _id: m._id.toString(),
      nom: m.nom,
      code: m.code,
      coefficient: m.coefficient,
      credits: m.credits,
      notes: subjectNotes.map((n) => ({
        type: n.type,
        valeur: n.valeur,
        commentaire: n.commentaire,
      })),
      moyenneMatiere: Number(moyenneMatiere.toFixed(2)),
      valide: isValide,
    };
  });

  // Calculate general weighted average
  let totalWeightedGeneral = 0;
  let totalCoefficientsGeneral = 0;
  let totalCreditsAcquis = 0;
  let totalCreditsRequis = 0;

  matieresSummaries.forEach((m) => {
    totalCreditsRequis += m.credits;
    if (m.valide) {
      totalCreditsAcquis += m.credits;
    }
    totalWeightedGeneral += m.moyenneMatiere * m.coefficient;
    totalCoefficientsGeneral += m.coefficient;
  });

  const moyenneGenerale =
    totalCoefficientsGeneral > 0 ? totalWeightedGeneral / totalCoefficientsGeneral : 0;

  let mention = 'Ajourné';
  if (moyenneGenerale >= 16) mention = 'Très Bien';
  else if (moyenneGenerale >= 14) mention = 'Bien';
  else if (moyenneGenerale >= 12) mention = 'Assez Bien';
  else if (moyenneGenerale >= 10) mention = 'Passable';

  return (
    <div className="space-y-6">
      <GradeReportView
        studentName={user?.nom || session.nom}
        studentEmail={user?.email || session.email}
        groupName={userGroup ? userGroup.nom : 'GL-4A'}
        matieres={matieresSummaries}
        moyenneGenerale={Number(moyenneGenerale.toFixed(2))}
        mention={mention}
        totalCreditsAcquis={totalCreditsAcquis}
        totalCreditsRequis={totalCreditsRequis}
      />
    </div>
  );
}
