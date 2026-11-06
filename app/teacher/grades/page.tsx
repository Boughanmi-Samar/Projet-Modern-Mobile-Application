import connectToDatabase from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { Affectation } from '@/models/Affectation';
import { Matiere } from '@/models/Matiere';
import { User } from '@/models/User';
import { Note } from '@/models/Note';
import { saveGradeAction, deleteGradeAction } from '@/app/(modules)/grades/actions';
import SubmitButton from '@/components/ui/SubmitButton';
import { Award, Plus, Trash2, CheckCircle, Calculator } from 'lucide-react';



export default async function TeacherGradesPage() {
  const session = await requireAuth(['teacher']);
  await connectToDatabase();

  const affectations = await Affectation.find({ enseignant: session.id }).populate('matiere groupe');
  const matiereIds = [...new Set(affectations.map((a) => (a.matiere as any)?._id?.toString()).filter(Boolean))];
  const groupIds = [...new Set(affectations.map((a) => (a.groupe as any)?._id?.toString()).filter(Boolean))];

  const [students, notes] = await Promise.all([
    User.find({ role: 'student', groupe: { $in: groupIds } }).populate('groupe').sort({ nom: 1 }),
    Note.find({ matiere: { $in: matiereIds } }).populate('etudiant matiere').sort({ createdAt: -1 }),
  ]);

  async function handleSaveGrade(formData: FormData) {
    'use server';
    await saveGradeAction(formData);
  }

  async function handleDeleteGrade(formData: FormData) {
    'use server';
    await deleteGradeAction(formData);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800">Saisie des Notes & Évaluations</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Gestion des notes de DS (30%), TP (20%) et Examen (50%). Règle : note comprise entre 0 et 20.
        </p>
      </div>

      {/* Grade Entry Form */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Award className="w-5 h-5 text-[#03c9d7]" />
          <h2 className="text-sm sm:text-base font-bold text-slate-800">Saisir ou Modifier une Note</h2>
        </div>

        <form action={handleSaveGrade} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Matière *</label>
            <select
              name="matiere"
              required
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            >
              {affectations.map((a) => (
                <option key={a._id.toString()} value={(a.matiere as any)?._id?.toString()}>
                  {(a.matiere as any)?.nom} ({(a.groupe as any)?.nom})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Étudiant *</label>
            <select
              name="etudiant"
              required
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            >
              {students.map((st) => (
                <option key={st._id.toString()} value={st._id.toString()}>
                  {st.nom} ({(st.groupe as any)?.nom || 'Sans groupe'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Type d’évaluation *</label>
            <select
              name="type"
              required
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            >
              <option value="DS">Devoir Surveillé (DS - 30%)</option>
              <option value="TP">Travaux Pratiques (TP - 20%)</option>
              <option value="examen">Examen Terminal (50%)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Note (/20) * <span className="text-[10px] text-teal-600 font-normal">(0 à 20)</span>
            </label>
            <input
              type="number"
              name="valeur"
              step="0.25"
              min="0"
              max="20"
              required
              placeholder="Ex : 15.5"
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Commentaire pédagogique (optionnel)</label>
            <input
              type="text"
              name="commentaire"
              placeholder="Ex : Très bonne maîtrise des Server Actions Next.js"
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            />
          </div>

          <div className="flex items-end">
            <SubmitButton className="w-full">
              <Plus className="w-4 h-4" />
              <span>Enregistrer la note</span>
            </SubmitButton>
          </div>
        </form>
      </section>

      {/* Existing Grades Table */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm sm:text-base font-bold text-slate-800">
            Notes Récemment Enregistrées ({notes.length})
          </h2>
          <span className="text-xs text-slate-400">Pondération : DS 30%, TP 20%, Exam 50%</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                <th className="py-2.5 px-3">Étudiant</th>
                <th className="py-2.5 px-3">Matière</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Note</th>
                <th className="py-2.5 px-3">Commentaire</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {notes.map((n) => (
                <tr key={n._id.toString()} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{(n.etudiant as any)?.nom}</td>
                  <td className="py-2.5 px-3 text-slate-600">{(n.matiere as any)?.nom}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-700">
                      {n.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`font-black text-sm ${
                        n.valeur >= 10 ? 'text-[#03c9d7]' : 'text-rose-600'
                      }`}
                    >
                      {n.valeur}/20
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 italic max-w-xs truncate">
                    {n.commentaire || '-'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                    {new Date(n.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <form action={handleDeleteGrade} className="inline-block">
                      <input type="hidden" name="id" value={n._id.toString()} />
                      <button
                        type="submit"
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Supprimer la note"
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
