import connectToDatabase from '@/lib/mongodb';
import { Matiere } from '@/models/Matiere';
import { Filiere } from '@/models/Filiere';
import { User } from '@/models/User';
import { Group } from '@/models/Group';
import { Affectation } from '@/models/Affectation';
import {
  createMatiereAction,
  deleteMatiereAction,
  createAffectationAction,
  deleteAffectationAction,
} from '@/app/(modules)/matieres/actions';
import SubmitButton from '@/components/ui/SubmitButton';
import { BookOpen, UserCheck, Plus, Trash2, Award, Clock } from 'lucide-react';



export default async function AdminMatieresPage() {
  await connectToDatabase();

  const [matieres, filieres, teachers, groups, affectations] = await Promise.all([
    Matiere.find().populate('filiere').sort({ nom: 1 }),
    Filiere.find().sort({ nom: 1 }),
    User.find({ role: 'teacher' }).sort({ nom: 1 }),
    Group.find().sort({ nom: 1 }),
    Affectation.find().populate('matiere enseignant groupe').sort({ anneeUniversitaire: -1 }),
  ]);

  async function handleCreateMatiere(formData: FormData) {
    'use server';
    await createMatiereAction(formData);
  }

  async function handleDeleteMatiere(formData: FormData) {
    'use server';
    await deleteMatiereAction(formData);
  }

  async function handleCreateAffectation(formData: FormData) {
    'use server';
    await createAffectationAction(formData);
  }

  async function handleDeleteAffectation(formData: FormData) {
    'use server';
    await deleteAffectationAction(formData);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800">Matières & Affectations</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Configuration des Unités d’Enseignement (UE), coefficients, crédits et affectations des enseignants.
        </p>
      </div>

      {/* 1. CRÉATION MATIÈRE */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <BookOpen className="w-5 h-5 text-[#03c9d7]" />
          <h2 className="text-sm sm:text-base font-bold text-slate-800">1. Créer une Matière (UE)</h2>
        </div>

        <form action={handleCreateMatiere} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Intitulé de la matière *</label>
            <input
              type="text"
              name="nom"
              required
              placeholder="Ex : Développement Web Avancé"
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Code unique (UE) *</label>
            <input
              type="text"
              name="code"
              required
              placeholder="Ex : GL-401"
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Coefficient * <span className="text-[10px] text-teal-600 font-normal">(&gt; 0 obligatoire)</span>
            </label>
            <input
              type="number"
              name="coefficient"
              step="0.5"
              min="0.1"
              required
              defaultValue="3"
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Crédits ECTS *</label>
            <input
              type="number"
              name="credits"
              min="1"
              required
              defaultValue="5"
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Semestre</label>
            <select
              name="semestre"
              defaultValue="S1"
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            >
              <option value="S1">Semestre 1 (S1)</option>
              <option value="S2">Semestre 2 (S2)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Filière associée *</label>
            <select
              name="filiere"
              required
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            >
              {filieres.map((f) => (
                <option key={f._id.toString()} value={f._id.toString()}>
                  {f.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
            <SubmitButton className="w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              <span>Créer la matière</span>
            </SubmitButton>
          </div>
        </form>

        {/* Matieres list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {matieres.map((m) => (
            <div
              key={m._id.toString()}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between"
            >
              <div>
                <span className="text-[10px] font-mono font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                  {m.code}
                </span>
                <p className="font-bold text-xs sm:text-sm text-slate-800 mt-1">{m.nom}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Coeff : <strong>{m.coefficient}</strong> • Crédits : <strong>{m.credits} ECTS</strong> • {m.semestre}
                </p>
              </div>

              <form action={handleDeleteMatiere}>
                <input type="hidden" name="id" value={m._id.toString()} />
                <button
                  type="submit"
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      {/* 2. AFFECTATIONS ENSEIGNANT <-> MATIÈRE <-> GROUPE */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <UserCheck className="w-5 h-5 text-indigo-600" />
          <h2 className="text-sm sm:text-base font-bold text-slate-800">
            2. Affectations (Enseignant ↔ Matière ↔ Groupe)
          </h2>
        </div>

        <form action={handleCreateAffectation} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Matière *</label>
            <select
              name="matiere"
              required
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
            >
              {matieres.map((m) => (
                <option key={m._id.toString()} value={m._id.toString()}>
                  {m.nom} ({m.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Enseignant responsable *</label>
            <select
              name="enseignant"
              required
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
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
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
            >
              {groups.map((g) => (
                <option key={g._id.toString()} value={g._id.toString()}>
                  {g.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Année Universitaire</label>
            <input
              type="text"
              name="anneeUniversitaire"
              defaultValue="2025-2026"
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
            <SubmitButton className="w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              <span>Valider l’affectation</span>
            </SubmitButton>
          </div>
        </form>

        {/* Affectations table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                <th className="py-2.5 px-3">Matière</th>
                <th className="py-2.5 px-3">Enseignant</th>
                <th className="py-2.5 px-3">Groupe</th>
                <th className="py-2.5 px-3">Année</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {affectations.map((aff) => (
                <tr key={aff._id.toString()} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    {(aff.matiere as any)?.nom} ({(aff.matiere as any)?.code})
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 font-medium">{(aff.enseignant as any)?.nom}</td>
                  <td className="py-2.5 px-3 text-slate-600">{(aff.groupe as any)?.nom}</td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono">{aff.anneeUniversitaire}</td>
                  <td className="py-2.5 px-3 text-right">
                    <form action={handleDeleteAffectation} className="inline-block">
                      <input type="hidden" name="id" value={aff._id.toString()} />
                      <button
                        type="submit"
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Supprimer"
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
      </section>
    </div>
  );
}
