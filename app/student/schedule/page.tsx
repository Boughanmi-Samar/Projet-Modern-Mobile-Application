import connectToDatabase from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { User } from '@/models/User';
import { Seance } from '@/models/Seance';
import ScheduleWeeklyView, { SeanceViewItem } from '@/components/modules/ScheduleWeeklyView';



export default async function StudentSchedulePage() {
  const session = await requireAuth(['student']);
  await connectToDatabase();

  const user = await User.findById(session.id).populate('groupe');
  const userGroup = user?.groupe as any;

  const seancesRaw = userGroup
    ? await Seance.find({ groupe: userGroup._id })
        .populate('matiere enseignant groupe salle')
        .sort({ jour: 1, heureDebut: 1 })
    : [];

  const seances: SeanceViewItem[] = seancesRaw.map((s) => ({
    _id: s._id.toString(),
    jour: s.jour,
    heureDebut: s.heureDebut,
    heureFin: s.heureFin,
    typeSeance: s.typeSeance,
    matiere: {
      _id: (s.matiere as any)?._id?.toString() || '',
      nom: (s.matiere as any)?.nom || 'Matière',
      code: (s.matiere as any)?.code || '',
      coefficient: (s.matiere as any)?.coefficient,
    },
    enseignant: {
      _id: (s.enseignant as any)?._id?.toString() || '',
      nom: (s.enseignant as any)?.nom || 'Enseignant',
    },
    groupe: {
      _id: (s.groupe as any)?._id?.toString() || '',
      nom: (s.groupe as any)?.nom || 'Groupe',
    },
    salle: {
      _id: (s.salle as any)?._id?.toString() || '',
      nom: (s.salle as any)?.nom || 'Salle',
      type: (s.salle as any)?.type,
    },
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800">Mon Emploi du Temps</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Planning de cours hebdomadaire • Groupe {userGroup ? userGroup.nom : 'Non affecté'}
        </p>
      </div>

      <ScheduleWeeklyView seances={seances} title={`Emploi du temps (${userGroup?.nom || 'Étudiant'})`} userRole="student" />
    </div>
  );
}
