import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { Department } from '@/models/Department';
import { Filiere } from '@/models/Filiere';
import { Group } from '@/models/Group';
import { Matiere } from '@/models/Matiere';
import { Seance } from '@/models/Seance';
import { Annonce } from '@/models/Annonce';
import Link from 'next/link';
import {
  Users,
  Layers,
  BookOpen,
  Calendar,
  Megaphone,
  ArrowRight,
  Database,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { seedDatabaseAction } from '@/app/(modules)/auth/actions';
import SubmitButton from '@/components/ui/SubmitButton';



export default async function AdminDashboard() {
  await connectToDatabase();

  const [
    totalStudents,
    totalTeachers,
    totalDepartments,
    totalFilieres,
    totalGroups,
    totalMatieres,
    totalSeances,
    recentAnnonces,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'teacher' }),
    Department.countDocuments(),
    Filiere.countDocuments(),
    Group.countDocuments(),
    Matiere.countDocuments(),
    Seance.countDocuments(),
    Annonce.find().sort({ date: -1 }).limit(3).populate('auteur'),
  ]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#03c9d7] font-bold">
            Espace Administration Centrale
          </span>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight">
            Pilotage Universitaire UniConnect
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Supervisez les départements, les filières, l’affectation des enseignants et la planification des séances
            sans aucun conflit.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            {/* Database re-seed button */}
            <form action={async () => {
              'use server';
              await seedDatabaseAction(true);
            }}>
              <SubmitButton variant="secondary" className="text-xs py-2 h-auto bg-white/10 hover:bg-white/20 text-white border border-white/20">
                <Database className="w-3.5 h-3.5 text-[#03c9d7]" />
                <span>Réinitialiser les données de démo</span>
              </SubmitButton>
            </form>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link
          href="/admin/users"
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-[#03c9d7] hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#03c9d7] transition-colors" />
          </div>
          <p className="text-2xl font-black text-slate-800">{totalStudents + totalTeachers}</p>
          <span className="text-xs text-slate-500 font-medium">
            {totalStudents} étudiants • {totalTeachers} enseignants
          </span>
        </Link>

        <Link
          href="/admin/structure"
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-[#03c9d7] hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-[#03c9d7] flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#03c9d7] transition-colors" />
          </div>
          <p className="text-2xl font-black text-slate-800">{totalGroups}</p>
          <span className="text-xs text-slate-500 font-medium">
            {totalDepartments} départements • {totalFilieres} filières
          </span>
        </Link>

        <Link
          href="/admin/matieres"
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-[#03c9d7] hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#03c9d7] transition-colors" />
          </div>
          <p className="text-2xl font-black text-slate-800">{totalMatieres}</p>
          <span className="text-xs text-slate-500 font-medium">Unités d’enseignement (UE)</span>
        </Link>

        <Link
          href="/admin/schedule"
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-[#03c9d7] hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#03c9d7] transition-colors" />
          </div>
          <p className="text-2xl font-black text-slate-800">{totalSeances}</p>
          <span className="text-xs text-slate-500 font-medium">Séances hebdomadaires</span>
        </Link>
      </div>

      {/* Modules shortcuts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Structure & Groupes */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-[#03c9d7]" />
              <h3 className="font-bold text-sm sm:text-base text-slate-800">Structure Académique</h3>
            </div>
            <Link href="/admin/structure" className="text-xs text-[#03c9d7] font-semibold hover:underline">
              Gérer →
            </Link>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Consultez les départements, les filières et associez les étudiants à leurs groupes de TD/TP avec vérification
            de non-suppression si des inscrits existent.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link
              href="/admin/structure"
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
            >
              + Nouveau Département
            </Link>
            <Link
              href="/admin/structure"
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
            >
              + Nouveau Groupe
            </Link>
          </div>
        </div>

        {/* Emploi du temps & Conflits */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-sm sm:text-base text-slate-800">Planning & Anti-Conflits</h3>
            </div>
            <Link href="/admin/schedule" className="text-xs text-[#03c9d7] font-semibold hover:underline">
              Planifier →
            </Link>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Vérification algorithmique stricte lors de chaque planification : rejet immédiat en cas de chevauchement de
            salle, de professeur ou de groupe d’étudiants.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link
              href="/admin/schedule"
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
            >
              + Ajouter une Séance
            </Link>
            <Link
              href="/admin/schedule"
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
            >
              + Ajouter une Salle
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Announcements */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <Megaphone className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm sm:text-base text-slate-800">Dernières Annonces Diffusées</h3>
          </div>
          <Link href="/admin/annonces" className="text-xs text-[#03c9d7] font-semibold hover:underline">
            Toutes les annonces →
          </Link>
        </div>

        <div className="space-y-2.5">
          {recentAnnonces.map((ann) => (
            <div key={ann._id.toString()} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div className="flex items-center justify-between font-semibold text-slate-800 mb-1">
                <span className="font-bold">{ann.titre}</span>
                <span className="text-[10px] text-slate-400">
                  {new Date(ann.date).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <p className="text-slate-600 line-clamp-2">{ann.contenu}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
