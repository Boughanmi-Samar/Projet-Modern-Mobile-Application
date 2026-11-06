import connectToDatabase from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { Annonce } from '@/models/Annonce';
import { Affectation } from '@/models/Affectation';
import { deleteAnnonceAction } from '@/app/(modules)/absences/actions';
import AnnouncementForm from '@/components/modules/AnnouncementForm';
import { Megaphone, Trash2, Calendar } from 'lucide-react';



export default async function TeacherAnnoncesPage() {
  const session = await requireAuth(['teacher']);
  await connectToDatabase();

  const affectations = await Affectation.find({ enseignant: session.id }).populate('groupe');
  const groupMap = new Map();
  affectations.forEach((a) => {
    const g = a.groupe as any;
    if (g && !groupMap.has(g._id.toString())) {
      groupMap.set(g._id.toString(), { _id: g._id.toString(), nom: g.nom });
    }
  });
  const groups = Array.from(groupMap.values());

  const annonces = await Annonce.find({ auteur: session.id }).populate('groupe').sort({ date: -1 });

  async function handleDeleteAnnonce(formData: FormData) {
    'use server';
    await deleteAnnonceAction(formData);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800">Mes Annonces Pédagogiques</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Communiquez avec vos étudiants de TD/TP avec le soutien de la génération de texte IA.
        </p>
      </div>

      <AnnouncementForm role="teacher" groups={groups} />

      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
          Historique de vos Publications ({annonces.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {annonces.map((a) => (
            <div
              key={a._id.toString()}
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      a.priorite === 'urgente'
                        ? 'bg-rose-100 text-rose-800'
                        : a.priorite === 'importante'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {a.priorite}
                  </span>

                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(a.date).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                <h3 className="font-bold text-sm sm:text-base text-slate-800">{a.titre}</h3>
                <p className="text-xs text-slate-600 mt-2 whitespace-pre-line leading-relaxed">{a.contenu}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Groupe ciblé : <strong>{(a.groupe as any)?.nom || 'Tous mes groupes'}</strong>
                </span>

                <form action={handleDeleteAnnonce}>
                  <input type="hidden" name="id" value={a._id.toString()} />
                  <button
                    type="submit"
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
