import connectToDatabase from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { User } from '@/models/User';
import { Seance } from '@/models/Seance';
import { Note } from '@/models/Note';
import { Absence } from '@/models/Absence';
import { Annonce } from '@/models/Annonce';
import Link from 'next/link';
import {
  Calendar,
  Award,
  ClipboardCheck,
  Megaphone,
  Bot,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';



export default async function StudentDashboard() {
  const session = await requireAuth(['student']);
  await connectToDatabase();

  const user = await User.findById(session.id).populate('groupe');
  const userGroup = user?.groupe as any;

  // 1. Next session
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const currentDay = days[new Date().getDay()];

  const seances = userGroup
    ? await Seance.find({ groupe: userGroup._id })
        .populate('matiere enseignant salle')
        .sort({ jour: 1, heureDebut: 1 })
    : [];

  const nextSeance = seances.find((s) => s.jour === currentDay) || seances[0];

  // 2. Grades & General Average calculation
  const notes = await Note.find({ etudiant: session.id }).populate('matiere');
  let moyenneGenerale = 0;
  if (notes.length > 0) {
    let totalWeighted = 0;
    let totalCoeff = 0;
    notes.forEach((n) => {
      const coeff = (n.matiere as any)?.coefficient || 1;
      totalWeighted += n.valeur * coeff;
      totalCoeff += coeff;
    });
    moyenneGenerale = totalCoeff > 0 ? totalWeighted / totalCoeff : 0;
  }

  // 3. Absences & 25% threshold check
  const absences = await Absence.find({ etudiant: session.id }).populate({
    path: 'seance',
    populate: { path: 'matiere' },
  });

  const totalAbsences = absences.filter((a) => a.statut !== 'present').length;
  const justifiees = absences.filter((a) => a.justifiee).length;
  const nonJustifiees = totalAbsences - justifiees;
  const estimatedTotalHours = 32;
  const globalAttendanceRate = Math.min(Math.round((totalAbsences / estimatedTotalHours) * 100), 100);
  const isHighAbsence = globalAttendanceRate >= 25;

  // 4. Latest announcements
  const annonces = await Annonce.find({
    $or: [{ portee: 'generale' }, { portee: 'groupe', groupe: userGroup?._id }],
  })
    .sort({ date: -1 })
    .limit(3);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-cyan-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#03c9d7] font-bold">
            Espace Étudiant • {userGroup ? userGroup.nom : 'Université'}
          </span>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight">
            Bonjour, {session.nom}
          </h1>
          <p className="text-xs sm:text-sm text-teal-100 leading-relaxed">
            Retrouvez votre emploi du temps en temps réel, consultez votre relevé de notes avec synthèse IA et suivez
            vos absences.
          </p>

          <div className="pt-3 flex flex-wrap gap-2.5">
            <Link
              href="/student/schedule"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#03c9d7] hover:bg-[#00b5b8] text-white shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>Mon Emploi du Temps</span>
            </Link>

            <Link
              href="/student/assistant"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
            >
              <Bot className="w-4 h-4 text-[#03c9d7]" />
              <span>Assistant IA</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Threshold Alert if > 25% absences */}
      {isHighAbsence && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-rose-900">
                Alerte Règlement Pédagogique : Taux d’absence critique ({globalAttendanceRate}%)
              </h3>
              <p className="text-[11px] text-rose-700">
                Vous avez dépassé le seuil autorisé de 25% d’absences. Veuillez soumettre immédiatement vos
                justificatifs sous peine de non-validation de l’unité d’enseignement.
              </p>
            </div>
          </div>

          <Link
            href="/student/absences"
            className="self-end sm:self-center px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors shrink-0"
          >
            Déposer un justificatif →
          </Link>
        </div>
      )}

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link
          href="/student/grades"
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-[#03c9d7] hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#03c9d7] flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#03c9d7] transition-colors" />
          </div>
          <p className="text-2xl font-black text-slate-800">
            {moyenneGenerale > 0 ? `${moyenneGenerale.toFixed(2)}/20` : 'En attente'}
          </p>
          <span className="text-xs text-slate-500 font-medium">Moyenne générale actuelle</span>
        </Link>

        <Link
          href="/student/absences"
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-[#03c9d7] hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isHighAbsence ? 'bg-rose-50 text-rose-600' : 'bg-cyan-50 text-[#03c9d7]'
            }`}>
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#03c9d7] transition-colors" />
          </div>
          <p className="text-2xl font-black text-slate-800">{globalAttendanceRate}%</p>
          <span className="text-xs text-slate-500 font-medium">
            {totalAbsences} absence(s) • {justifiees} justifiée(s)
          </span>
        </Link>

        <Link
          href="/student/schedule"
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-[#03c9d7] hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#03c9d7] transition-colors" />
          </div>
          <p className="text-2xl font-black text-slate-800">{seances.length}</p>
          <span className="text-xs text-slate-500 font-medium">Séances au programme</span>
        </Link>

        <Link
          href="/student/assistant"
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-[#03c9d7] hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#03c9d7] flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-base sm:text-lg font-bold text-slate-800">Assistant IA</p>
          <span className="text-xs text-slate-500 font-medium">Chatbot 24/7 disponible</span>
        </Link>
      </div>

      {/* Two columns: Next session + Latest Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Next Session Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm sm:text-base text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#03c9d7]" />
              Prochaine Séance de Cours
            </h3>
            <Link href="/student/schedule" className="text-xs text-[#03c9d7] font-semibold hover:underline">
              Planning complet →
            </Link>
          </div>

          {nextSeance ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#03c9d7] bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-100">
                  {nextSeance.jour} • {nextSeance.heureDebut} à {nextSeance.heureFin}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  {nextSeance.typeSeance || 'Cours'}
                </span>
              </div>
              <h4 className="font-bold text-slate-800 text-sm sm:text-base">
                {(nextSeance.matiere as any)?.nom}
              </h4>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>👤 {(nextSeance.enseignant as any)?.nom}</span>
                <span className="font-semibold text-teal-800">📍 {(nextSeance.salle as any)?.nom}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">Aucune séance planifiée.</p>
          )}
        </div>

        {/* Announcements Preview */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm sm:text-base text-slate-800 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-indigo-500" />
              Annonces Récentes
            </h3>
            <Link href="/student/annonces" className="text-xs text-[#03c9d7] font-semibold hover:underline">
              Toutes les annonces →
            </Link>
          </div>

          <div className="space-y-2">
            {annonces.map((a) => (
              <div
                key={a._id.toString()}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{a.titre}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(a.date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <p className="text-slate-600 line-clamp-2">{a.contenu}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
