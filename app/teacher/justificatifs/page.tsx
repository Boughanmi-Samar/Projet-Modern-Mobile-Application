import connectToDatabase from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { Justificatif } from '@/models/Justificatif';
import { Absence } from '@/models/Absence';
import { reviewJustificatifAction } from '@/app/(modules)/absences/actions';
import SubmitButton from '@/components/ui/SubmitButton';
import { FileCheck2, Check, X, Clock, AlertCircle, FileText } from 'lucide-react';



export default async function TeacherJustificatifsPage() {
  await requireAuth(['teacher', 'admin']);
  await connectToDatabase();

  // Use lean + manual population to avoid StrictPopulateError with deep nesting
  const justificatifsRaw = await Justificatif.find()
    .populate({
      path: 'absence',
      model: 'Absence',
      populate: [
        { path: 'etudiant', model: 'User' },
        {
          path: 'seance',
          model: 'Seance',
          populate: { path: 'matiere', model: 'Matiere' },
        },
      ],
    })
    .sort({ createdAt: -1 })
    .lean();

  // Cast to any[] so JSX destructuring is easy
  const justificatifs = justificatifsRaw as any[];

  async function handleReviewJustificatif(formData: FormData) {
    'use server';
    await reviewJustificatifAction(formData);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800">Traitement des Justificatifs</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Validation ou refus des justificatifs d’absence déposés par les étudiants.
        </p>
      </div>

      <div className="space-y-4">
        {justificatifs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400">
            Aucun justificatif d’absence n’a été soumis pour le moment.
          </div>
        ) : (
          justificatifs.map((j: any) => {
            const absence = j.absence;
            const etudiant = absence?.etudiant;
            const seance = absence?.seance;
            const matiere = seance?.matiere;

            const isPending = j.decision === 'en_attente';
            const isValidated = j.decision === 'valide';

            return (
              <div
                key={j._id.toString()}
                className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 transition-all ${
                  isPending
                    ? 'border-amber-200 ring-2 ring-amber-500/10'
                    : isValidated
                    ? 'border-emerald-200'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-slate-800">
                        {etudiant?.nom || 'Étudiant'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isPending
                            ? 'bg-amber-100 text-amber-800'
                            : isValidated
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {j.decision === 'en_attente'
                          ? 'En attente'
                          : j.decision === 'valide'
                          ? 'Validé'
                          : 'Refusé'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Matière : <strong>{matiere?.nom || 'Séance'}</strong> • Séance du{' '}
                      {absence?.date ? new Date(absence.date).toLocaleDateString('fr-FR') : '-'}
                    </p>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono self-start sm:self-auto">
                    Soumis le {new Date(j.dateSoumission).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5">
                    <span className="font-bold text-slate-700 block">Motif invoqué par l’étudiant :</span>
                    <p className="text-slate-600 leading-relaxed italic">« {j.motif} »</p>
                    {j.pieceJointe && (
                      <div className="pt-2 flex items-center gap-1.5 text-teal-700 font-mono text-[11px]">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Document : {j.pieceJointe}</span>
                      </div>
                    )}
                  </div>

                  {j.commentaireEnseignant && (
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                      <span className="font-bold text-slate-700 block">Avis de l’enseignant :</span>
                      <p className="text-slate-600">{j.commentaireEnseignant}</p>
                    </div>
                  )}
                </div>

                {/* Review Form (if pending or re-review) */}
                <div className="pt-2 border-t border-slate-100">
                  <form action={handleReviewJustificatif} className="flex flex-col sm:flex-row gap-2.5 sm:items-center">
                    <input type="hidden" name="justificatifId" value={j._id.toString()} />
                    <input
                      type="text"
                      name="commentaire"
                      placeholder="Commentaire pour l’étudiant (ex: Certificat conforme)..."
                      className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        name="decision"
                        value="valide"
                        className="min-h-[44px] px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 active:scale-95 flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Valider & Régulariser</span>
                      </button>

                      <button
                        type="submit"
                        name="decision"
                        value="refuse"
                        className="min-h-[44px] px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <X className="w-4 h-4" />
                        <span>Refuser</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
