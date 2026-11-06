import connectToDatabase from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { Seance } from '@/models/Seance';
import { User } from '@/models/User';
import AttendanceOfflineSheet from '@/components/modules/AttendanceOfflineSheet';
import { Wifi, WifiOff, HardDrive, Sparkles } from 'lucide-react';



export default async function TeacherAbsencesPage() {
  const session = await requireAuth(['teacher']);
  await connectToDatabase();

  const seancesRaw = await Seance.find({ enseignant: session.id })
    .populate('matiere groupe salle')
    .sort({ jour: 1, heureDebut: 1 });

  const groupIds = [...new Set(seancesRaw.map((s) => (s.groupe as any)?._id?.toString()).filter(Boolean))];

  const students = await User.find({ role: 'student', groupe: { $in: groupIds } }).sort({ nom: 1 });

  const studentsByGroup: Record<string, { _id: string; nom: string; email: string }[]> = {};
  for (const st of students) {
    const gid = st.groupe?.toString();
    if (!gid) continue;
    if (!studentsByGroup[gid]) studentsByGroup[gid] = [];
    studentsByGroup[gid].push({
      _id: st._id.toString(),
      nom: st.nom,
      email: st.email,
    });
  }

  const seances = seancesRaw.map((s) => ({
    _id: s._id.toString(),
    jour: s.jour,
    heureDebut: s.heureDebut,
    heureFin: s.heureFin,
    matiere: {
      _id: (s.matiere as any)?._id?.toString() || '',
      nom: (s.matiere as any)?.nom || '',
      code: (s.matiere as any)?.code || '',
    },
    groupe: {
      _id: (s.groupe as any)?._id?.toString() || '',
      nom: (s.groupe as any)?.nom || '',
    },
    salle: {
      nom: (s.salle as any)?.nom || '',
    },
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800">
            Saisie des Absences & Mode Hors Ligne
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Émargez vos séances. En cas de perte de réseau en classe, vos saisies sont stockées dans IndexedDB et
            synchronisées automatiquement.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#03c9d7] self-start sm:self-auto">
          <HardDrive className="w-4 h-4" />
          <span>IndexedDB Actif</span>
        </div>
      </div>

      <AttendanceOfflineSheet seances={seances} studentsByGroup={studentsByGroup} />
    </div>
  );
}
