import connectToDatabase from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { detectAtRiskStudentsAction } from '@/app/(modules)/ai/actions';
import RiskAnalysisCard from '@/components/modules/RiskAnalysisCard';
import { Sparkles, AlertTriangle, ShieldCheck, Info } from 'lucide-react';



export default async function TeacherAtRiskPage() {
  await requireAuth(['teacher', 'admin']);
  await connectToDatabase();

  const res = await detectAtRiskStudentsAction();
  const students = res.atRiskStudents || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-800">
              Détection des Étudiants à Risque (IA)
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-[#03c9d7] border border-teal-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> IA Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Analyse automatisée combinant la trajectoire des notes et le taux d’absentéisme (alerte seuil &gt; 25%).
          </p>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-cyan-50/70 border border-cyan-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-cyan-950">
        <Info className="w-5 h-5 text-[#03c9d7] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Critères d’alerte de l’algorithme pédagogique :</p>
          <p className="text-cyan-900 leading-relaxed">
            Un étudiant est classé <strong>Critique</strong> si son taux d’absence dépasse 25% tout en ayant une moyenne
            inférieure à 10/20. Les étudiants avec un taux d’absence en hausse reçoivent une alerte préventive et
            l’enseignant se voit proposer 3 leviers d’action individualisés.
          </p>
        </div>
      </div>

      <RiskAnalysisCard students={students} />
    </div>
  );
}
