import connectToDatabase from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { Absence } from '@/models/Absence';
import { Justificatif } from '@/models/Justificatif';
import { submitJustificatifAction } from '@/app/(modules)/absences/actions';
import SubmitButton from '@/components/ui/SubmitButton';
import {
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Upload,
  Send,
  Calendar,
} from 'lucide-react';



export default async function StudentAbsencesPage() {
  const session = await requireAuth(['student']);
  await connectToDatabase();

  const [absences, justificatifs] = await Promise.all([
    Absence.find({ etudiant: session.id })
      .populate({
        path: 'seance',
        populate: { path: 'matiere enseignant salle' },
      })
      .sort({ date: -1 }),
    Justificatif.find().populate('absence'),
  ]);

  const justifByAbsenceId: Record<string, any> = {};
  justificatifs.forEach((j) => {
    if (j.absence) {
      justifByAbsenceId[(j.absence as any)._id?.toString()] = j;
    }
  });

  const totalAbsences = absences.filter((a) => a.statut !== 'present').length;
  const justifieesCount = absences.filter((a) => a.justifiee).length;
  const estimatedHours = 32;
  const globalAttendanceRate = Math.min(Math.round((totalAbsences / estimatedHours) * 100), 100);
  const isThresholdExceeded = globalAttendanceRate >= 25;

  // Absences unjustified and actually absent (not 'present')
  const unjustifiedAbsences = absences.filter((a) => !a.justifiee && a.statut !== 'present');

  async function handleSubmitJustificatif(formData: FormData) {
    'use server';
    await submitJustificatifAction(formData);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800">Mes Absences &amp; Justificatifs</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Suivi des présences et soumission des certificats médicaux ou justificatifs de transport.
        </p>
      </div>

      {/* Threshold Alert if >= 25% */}
      {isThresholdExceeded && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 sm:p-5 flex items-start gap-3 shadow-xs animate-pulse">
          <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="font-bold text-sm sm:text-base text-rose-900">
              Alerte Règlementaire : Seuil des 25% Dépassé ({globalAttendanceRate}%)
            </h2>
            <p className="text-xs text-rose-800 leading-relaxed">
              Votre taux d&apos;absentéisme global a dépassé la limite autorisée par le règlement universitaire. Vous risquez
              l&apos;élimination aux examens terminaux. Régularisez votre situation en transmettant vos justificatifs ci-dessous.
            </p>
          </div>
        </div>
      )}

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
          <span className="text-[11px] font-medium text-slate-500 uppercase">Taux d&apos;absence</span>
          <p className={`text-2xl font-black mt-1 ${isThresholdExceeded ? 'text-rose-600' : 'text-[#03c9d7]'}`}>
            {globalAttendanceRate}%
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
          <span className="text-[11px] font-medium text-slate-500 uppercase">Total séances manquées</span>
          <p className="text-2xl font-black text-slate-800 mt-1">{totalAbsences}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
          <span className="text-[11px] font-medium text-slate-500 uppercase">Justifiées</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{justifieesCount}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
          <span className="text-[11px] font-medium text-slate-500 uppercase">Non justifiées</span>
          <p className="text-2xl font-black text-rose-600 mt-1">{totalAbsences - justifieesCount}</p>
        </div>
      </div>

      {/* Submit Justification Card */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Upload className="w-5 h-5 text-[#03c9d7]" />
          <h2 className="text-sm sm:text-base font-bold text-slate-800">Déposer un Justificatif d&apos;Absence</h2>
        </div>

        {unjustifiedAbsences.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            ✅ Aucune absence non justifiée — rien à régulariser pour le moment.
          </p>
        ) : (
          <form action={handleSubmitJustificatif} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Séance à justifier *</label>
              <select
                name="absenceId"
                required
                className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
              >
                {unjustifiedAbsences.map((a) => (
                  <option key={a._id.toString()} value={a._id.toString()}>
                    {new Date(a.date).toLocaleDateString('fr-FR')} :{' '}
                    {((a.seance as any)?.matiere as any)?.nom || 'Séance'} ({a.statut})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nom ou référence de la pièce jointe
              </label>
              <input
                type="text"
                name="pieceJointe"
                placeholder="Ex : certificat_medical_dr_karoui.pdf"
                className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Motif d&apos;absence détaillé *</label>
              <textarea
                name="motif"
                required
                rows={2}
                placeholder="Expliquez la raison médicale ou de force majeure..."
                className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end">
              <SubmitButton className="w-full sm:w-auto">
                <Send className="w-4 h-4" />
                <span>Transmettre à l&apos;enseignant</span>
              </SubmitButton>
            </div>
          </form>
        )}
      </section>

      {/* History of recorded absences */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-sm sm:text-base font-bold text-slate-800">
          Historique de vos Présences &amp; Émargements ({absences.length})
        </h2>

        {absences.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">Aucune absence enregistrée. Félicitations !</p>
        ) : (
          <div className="space-y-3">
            {absences.map((a) => {
              const justif = justifByAbsenceId[a._id.toString()];
              const seance = a.seance as any;
              const matiere = seance?.matiere;

              return (
                <div
                  key={a._id.toString()}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 font-bold">
                        {new Date(a.date).toLocaleDateString('fr-FR')}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          a.statut === 'present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : a.statut === 'absent'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {a.statut}
                      </span>
                    </div>

                    <p className="font-bold text-slate-800">{matiere?.nom || 'Séance de cours'}</p>
                    <p className="text-[11px] text-slate-500">
                      Enseignant : {seance?.enseignant?.nom} • Salle : {seance?.salle?.nom}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {a.justifiee ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Justifiée
                      </span>
                    ) : justif ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
                        <Clock className="w-3.5 h-3.5" /> Justificatif {justif.decision}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                        Non régularisée
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
