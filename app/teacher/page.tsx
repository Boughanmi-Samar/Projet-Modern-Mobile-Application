import connectToDatabase from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { Affectation } from '@/models/Affectation';
import { Seance } from '@/models/Seance';
import { Justificatif } from '@/models/Justificatif';
import { Absence } from '@/models/Absence';
import { detectAtRiskStudentsAction } from '@/app/(modules)/ai/actions';
import Link from 'next/link';
import {
  ClipboardCheck,
  Award,
  Calendar,
  AlertTriangle,
  FileCheck2,
  Megaphone,
  ArrowRight,
  Sparkles,
} from 'lucide-react';



export default async function TeacherDashboard() {
  const session = await requireAuth(['teacher']);
  await connectToDatabase();

  const [affectations, seances, pendingJustifs, riskResult] = await Promise.all([
    Affectation.find({ enseignant: session.id }).populate('matiere groupe'),
    Seance.find({ enseignant: session.id }).populate('matiere groupe salle').sort({ jour: 1, heureDebut: 1 }),
    Justificatif.find({ decision: 'en_attente' }).populate({
      path: 'absence',
      populate: { path: 'etudiant seance' },
    }),
    detectAtRiskStudentsAction(),
  ]);

  const atRiskCount = riskResult.atRiskStudents?.length || 0;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-cyan-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#03c9d7] font-bold">
            Espace Enseignant • Année 2025/2026
          </span>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight">
            Bienvenue, {session.nom}
          </h1>
          <p className="text-xs sm:text-sm text-teal-100 leading-relaxed">
            Consultez votre emploi du temps, faites l’appel en salle même sans connexion Internet, saisissez les notes
            et surveillez les alertes de décrochage scolaire.
          </p>

          <div className="pt-3 flex flex-wrap gap-2.5">
            <Link
              href="/teacher/absences"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#03c9d7] hover:bg-[#00b5b8] text-white shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Faire l’Appel (Hors Ligne / En Ligne)</span>
            </Link>

            <Link
              href="/teacher/grades"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
            >
              <Award className="w-4 h-4" />
              <span>Saisir les Notes</span>
            </Link>
          </div>
        </div>
      </div>

      {/* AI Alert Banner if any at-risk students */}
      {atRiskCount > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-rose-900 flex items-center gap-1.5">
                Alerte Décrochage IA : {atRiskCount} étudiant(s) à risque détecté(s)
              </h3>
              <p className="text-[11px] text-rose-700">
                Absences &gt; 25% ou moyennes insuffisantes sur vos matières. Diagnostic et actions recommandées
                disponibles.
              </p>
            </div>
          </div>

          <Link
            href="/teacher/at-risk"
            className="self-end sm:self-center px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors shrink-0 flex items-center gap-1.5 shadow-sm shadow-rose-600/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Voir le diagnostic IA</span>
          </Link>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link
          href="/teacher/schedule"
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-[#03c9d7] hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#03c9d7] flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#03c9d7] transition-colors" />
          </div>
          <p className="text-2xl font-black text-slate-800">{seances.length}</p>
          <span className="text-xs text-slate-500 font-medium">Séances hebdomadaires</span>
        </Link>

        <Link
          href="/teacher/absences"
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-[#03c9d7] hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#03c9d7] transition-colors" />
          </div>
          <p className="text-2xl font-black text-slate-800">{affectations.length}</p>
          <span className="text-xs text-slate-500 font-medium">Groupes & Matières affectées</span>
        </Link>

        <Link
          href="/teacher/justificatifs"
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-[#03c9d7] hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#03c9d7] transition-colors" />
          </div>
          <p className="text-2xl font-black text-slate-800">{pendingJustifs.length}</p>
          <span className="text-xs text-slate-500 font-medium">Justificatifs en attente</span>
        </Link>

        <Link
          href="/teacher/at-risk"
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-[#03c9d7] hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#03c9d7] transition-colors" />
          </div>
          <p className="text-2xl font-black text-slate-800">{atRiskCount}</p>
          <span className="text-xs text-slate-500 font-medium">Étudiants à risque IA</span>
        </Link>
      </div>

      {/* Two columns: Affectations and Upcoming Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Affectations list */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm sm:text-base text-slate-800">Matières Affectées (2025-2026)</h3>
            <span className="text-xs text-slate-400">{affectations.length} matières</span>
          </div>

          <div className="space-y-2">
            {affectations.map((aff) => (
              <div
                key={aff._id.toString()}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800">{(aff.matiere as any)?.nom}</span>
                  <span className="text-[11px] text-slate-500 block">
                    Groupe : {(aff.groupe as any)?.nom} • Coeff {(aff.matiere as any)?.coefficient} ({(aff.matiere as any)?.credits} ECTS)
                  </span>
                </div>
                <Link
                  href="/teacher/grades"
                  className="px-2.5 py-1 rounded-lg bg-teal-50 text-[#03c9d7] hover:bg-teal-100 font-bold transition-colors"
                >
                  Notes →
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule preview */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm sm:text-base text-slate-800">Mes Séances Hebdomadaires</h3>
            <Link href="/teacher/schedule" className="text-xs text-[#03c9d7] font-semibold hover:underline">
              Voir tout →
            </Link>
          </div>

          <div className="space-y-2">
            {seances.slice(0, 4).map((s) => (
              <div
                key={s._id.toString()}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono text-[#03c9d7] font-bold block">
                    {s.jour} • {s.heureDebut}-{s.heureFin}
                  </span>
                  <p className="font-bold text-slate-800">{(s.matiere as any)?.nom}</p>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700 block">{(s.salle as any)?.nom}</span>
                  <span>{(s.groupe as any)?.nom}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
