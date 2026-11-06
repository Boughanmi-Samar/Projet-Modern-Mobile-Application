import connectToDatabase from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { Seance } from '@/models/Seance';
import ScheduleWeeklyView, { SeanceViewItem } from '@/components/modules/ScheduleWeeklyView';



export default async function TeacherSchedulePage() {
  const session = await requireAuth(['teacher']);
  await connectToDatabase();

  const seancesRaw = await Seance.find({ enseignant: session.id })
    .populate('matiere enseignant groupe salle')
    .sort({ jour: 1, heureDebut: 1 });

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
          Vue hebdomadaire et journalière de vos créneaux d’enseignement.
        </p>
      </div>

      <ScheduleWeeklyView seances={seances} title="Planning Enseignant" userRole="teacher" />
    </div>
  );
}
