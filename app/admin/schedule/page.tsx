import connectToDatabase from '@/lib/mongodb';
import { Seance } from '@/models/Seance';
import { Salle } from '@/models/Salle';
import { Matiere } from '@/models/Matiere';
import { User } from '@/models/User';
import { Group } from '@/models/Group';
import {
  createSalleAction,
  deleteSalleAction,
  createSeanceAction,
  deleteSeanceAction,
} from '@/app/(modules)/schedule/actions';
import ScheduleWeeklyView, { SeanceViewItem } from '@/components/modules/ScheduleWeeklyView';
import SubmitButton from '@/components/ui/SubmitButton';
import { Calendar, Plus, Trash2, Building, AlertCircle } from 'lucide-react';



export default async function AdminSchedulePage() {
  await connectToDatabase();

  const [seancesRaw, salles, matieres, teachers, groups] = await Promise.all([
    Seance.find()
      .populate('matiere enseignant groupe salle')
      .sort({ jour: 1, heureDebut: 1 }),
    Salle.find().sort({ nom: 1 }),
    Matiere.find().sort({ nom: 1 }),
    User.find({ role: 'teacher' }).sort({ nom: 1 }),
    Group.find().sort({ nom: 1 }),
  ]);

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

  async function handleCreateSalle(formData: FormData) {
    'use server';
    await createSalleAction(formData);
  }

  async function handleDeleteSalle(formData: FormData) {
    'use server';
    await deleteSalleAction(formData);
  }

  async function handleCreateSeance(formData: FormData) {
    'use server';
    await createSeanceAction(formData);
  }

  async function handleDeleteSeance(formData: FormData) {
    'use server';
    await deleteSeanceAction(formData);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800">Emploi du Temps & Salles</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Planification hebdomadaire avec contrôle algorithmique strict des conflits (enseignant, salle, groupe).
        </p>
      </div>

      {/* 1. GESTION DES SALLES */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Building className="w-5 h-5 text-amber-500" />
          <h2 className="text-sm sm:text-base font-bold text-slate-800">1. Salles de Cours & Laboratoires ({salles.length})</h2>
        </div>

        <form action={handleCreateSalle} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nom / Numéro de salle *</label>
            <input
              type="text"
              name="nom"
              required
              placeholder="Ex : Labo Info 302"
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Capacité (places) *</label>
            <input
              type="number"
              name="capacite"
              required
              min="1"
              defaultValue="30"
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Type de salle</label>
            <select
              name="type"
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            >
              <option value="Salle de cours">Salle de cours / TD</option>
              <option value="Laboratoire Informatique">Laboratoire Informatique</option>
              <option value="Amphithéâtre">Amphithéâtre</option>
            </select>
          </div>

          <div className="flex items-end">
            <SubmitButton className="w-full">
              <Plus className="w-4 h-4" />
              <span>Ajouter Salle</span>
            </SubmitButton>
          </div>
        </form>

        <div className="flex flex-wrap gap-2 pt-2">
          {salles.map((s) => (
            <div
              key={s._id.toString()}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs flex items-center gap-3"
            >
              <div>
                <span className="font-bold text-slate-800">{s.nom}</span>
                <span className="text-[11px] text-slate-500 block">
                  {s.capacite} places • {s.type}
                </span>
              </div>
              <form action={handleDeleteSalle}>
                <input type="hidden" name="id" value={s._id.toString()} />
                <button
                  type="submit"
                  className="p-1 text-slate-400 hover:text-rose-600 rounded"
                  title="Supprimer la salle"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      {/* 2. PLANIFICATION D'UNE SÉANCE */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Calendar className="w-5 h-5 text-[#03c9d7]" />
          <h2 className="text-sm sm:text-base font-bold text-slate-800">
            2. Programmer une Séance (Vérification Anti-Conflit)
          </h2>
        </div>

        <form action={handleCreateSeance} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Jour de la semaine *</label>
            <select
              name="jour"
              required
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            >
              <option value="Lundi">Lundi</option>
              <option value="Mardi">Mardi</option>
              <option value="Mercredi">Mercredi</option>
              <option value="Jeudi">Jeudi</option>
              <option value="Vendredi">Vendredi</option>
              <option value="Samedi">Samedi</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Heure de début *</label>
            <input
              type="time"
              name="heureDebut"
              required
              defaultValue="08:30"
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Heure de fin *</label>
            <input
              type="time"
              name="heureFin"
              required
              defaultValue="11:45"
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Type de séance</label>
            <select
              name="typeSeance"
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            >
              <option value="Cours">Cours Intégré</option>
              <option value="TD">Travaux Dirigés (TD)</option>
              <option value="TP">Travaux Pratiques (TP)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Matière *</label>
            <select
              name="matiere"
              required
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            >
              {matieres.map((m) => (
                <option key={m._id.toString()} value={m._id.toString()}>
                  {m.nom} ({m.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Enseignant *</label>
            <select
              name="enseignant"
              required
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            >
              {teachers.map((t) => (
                <option key={t._id.toString()} value={t._id.toString()}>
                  {t.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Groupe d’étudiants *</label>
            <select
              name="groupe"
              required
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            >
              {groups.map((g) => (
                <option key={g._id.toString()} value={g._id.toString()}>
                  {g.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Salle *</label>
            <select
              name="salle"
              required
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            >
              {salles.map((s) => (
                <option key={s._id.toString()} value={s._id.toString()}>
                  {s.nom} ({s.capacite} places)
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-2">
            <SubmitButton className="w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              <span>Vérifier conflits & Enregistrer</span>
            </SubmitButton>
          </div>
        </form>
      </section>

      {/* 3. VUE DE L'EMPLOI DU TEMPS */}
      <section className="space-y-4">
        <ScheduleWeeklyView seances={seances} title="Emploi du Temps Général" userRole="admin" />

        {/* Delete séances quick table */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Gestion des Séances Enregistrées ({seances.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <th className="py-2 px-3">Créneau</th>
                  <th className="py-2 px-3">Matière</th>
                  <th className="py-2 px-3">Enseignant</th>
                  <th className="py-2 px-3">Groupe</th>
                  <th className="py-2 px-3">Salle</th>
                  <th className="py-2 px-3 text-right">Supprimer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {seances.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-mono font-bold text-[#03c9d7]">
                      {s.jour} {s.heureDebut}-{s.heureFin}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{s.matiere?.nom}</td>
                    <td className="py-2 px-3 text-slate-600">{s.enseignant?.nom}</td>
                    <td className="py-2 px-3 text-slate-600">{s.groupe?.nom}</td>
                    <td className="py-2 px-3 text-slate-600 font-semibold">{s.salle?.nom}</td>
                    <td className="py-2 px-3 text-right">
                      <form action={handleDeleteSeance} className="inline-block">
                        <input type="hidden" name="id" value={s._id} />
                        <button
                          type="submit"
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Supprimer cette séance"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
