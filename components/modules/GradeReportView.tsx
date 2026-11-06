'use client';

import { useState } from 'react';
import { Award, Printer, Sparkles, CheckCircle2, AlertTriangle, FileText, ChevronRight } from 'lucide-react';
import { generateGradeSummaryAction } from '@/app/(modules)/ai/actions';

interface MatiereGradeSummary {
  _id: string;
  nom: string;
  code: string;
  coefficient: number;
  credits: number;
  notes: {
    type: 'DS' | 'TP' | 'examen';
    valeur: number;
    commentaire?: string;
  }[];
  moyenneMatiere: number;
  valide: boolean;
}

interface Props {
  studentName: string;
  studentEmail: string;
  groupName: string;
  matieres: MatiereGradeSummary[];
  moyenneGenerale: number;
  mention: string;
  totalCreditsAcquis: number;
  totalCreditsRequis: number;
}

export default function GradeReportView({
  studentName,
  studentEmail,
  groupName,
  matieres,
  moyenneGenerale,
  mention,
  totalCreditsAcquis,
  totalCreditsRequis,
}: Props) {
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState<boolean>(false);

  const handleFetchAISummary = async () => {
    setLoadingAI(true);
    try {
      const res = await generateGradeSummaryAction();
      if (res.success && res.summary) {
        setAiSummary(res.summary);
      }
    } catch (err: any) {
      console.warn('AI summary error:', err);
    } finally {
      setLoadingAI(false);
    }
  };

  const isSemesterValidated = moyenneGenerale >= 10;

  return (
    <div className="space-y-6">
      {/* Header card with Action Buttons */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-[#03c9d7] font-bold">
            Relevé Officiel Pédagogique
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">{studentName}</h2>
          <p className="text-xs text-slate-500">Groupe : {groupName} • {studentEmail}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFetchAISummary}
            disabled={loadingAI}
            className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-md shadow-cyan-500/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <Sparkles className={`w-4 h-4 ${loadingAI ? 'animate-spin' : ''}`} />
            <span>{loadingAI ? 'Analyse IA...' : 'Synthèse IA'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer</span>
          </button>
        </div>
      </div>

      {/* AI Summary Banner if generated */}
      {aiSummary && (
        <div className="bg-gradient-to-br from-teal-50/90 via-cyan-50/50 to-white border border-teal-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-[#03c9d7]">
              <Sparkles className="w-4 h-4" />
              <span>Analyse et Recommandations Pédagogiques (IA UniConnect)</span>
            </div>
            <button
              onClick={() => setAiSummary(null)}
              className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
            >
              Fermer
            </button>
          </div>
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line border-t border-teal-100/80 pt-3">
            {aiSummary}
          </div>
        </div>
      )}

      {/* Overview Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Moyenne Générale</span>
          <p className="text-2xl font-black text-[#03c9d7] mt-1">
            {moyenneGenerale.toFixed(2)}<span className="text-xs text-slate-400 font-normal">/20</span>
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Mention</span>
          <p className="text-base sm:text-lg font-bold text-slate-800 mt-1.5">{mention}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Crédits ECTS</span>
          <p className="text-base sm:text-lg font-bold text-slate-800 mt-1.5">
            {totalCreditsAcquis} / {totalCreditsRequis}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Statut Semestre</span>
          <div className="mt-1.5 flex items-center justify-center gap-1 font-bold text-xs sm:text-sm">
            {isSemesterValidated ? (
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" /> Validé
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-rose-600">
                <AlertTriangle className="w-4 h-4" /> Non Validé
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mobile View: Cards */}
      <div className="block md:hidden space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Détail par Matière ({matieres.length})
        </h3>
        {matieres.map((m) => (
          <div
            key={m._id}
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{m.code}</span>
                <h4 className="font-bold text-slate-800 text-sm leading-snug">{m.nom}</h4>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold shrink-0 ${
                  m.valide ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}
              >
                {m.moyenneMatiere.toFixed(2)}/20
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 block">DS (30%)</span>
                <span className="font-bold text-slate-700">
                  {m.notes.find((n) => n.type === 'DS')?.valeur !== undefined
                    ? `${m.notes.find((n) => n.type === 'DS')?.valeur}/20`
                    : '-'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">TP (20%)</span>
                <span className="font-bold text-slate-700">
                  {m.notes.find((n) => n.type === 'TP')?.valeur !== undefined
                    ? `${m.notes.find((n) => n.type === 'TP')?.valeur}/20`
                    : '-'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Examen (50%)</span>
                <span className="font-bold text-slate-700">
                  {m.notes.find((n) => n.type === 'examen')?.valeur !== undefined
                    ? `${m.notes.find((n) => n.type === 'examen')?.valeur}/20`
                    : '-'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Coeff: {m.coefficient} • {m.credits} ECTS</span>
              <span className={m.valide ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                {m.valide ? 'Validée' : 'Non Validée'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Matière</th>
              <th className="py-3 px-3 text-center">Coeff</th>
              <th className="py-3 px-3 text-center">Crédits</th>
              <th className="py-3 px-3 text-center">DS (30%)</th>
              <th className="py-3 px-3 text-center">TP (20%)</th>
              <th className="py-3 px-3 text-center">Examen (50%)</th>
              <th className="py-3 px-4 text-center">Moyenne</th>
              <th className="py-3 px-4 text-center">Validation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {matieres.map((m) => {
              const ds = m.notes.find((n) => n.type === 'DS');
              const tp = m.notes.find((n) => n.type === 'TP');
              const exam = m.notes.find((n) => n.type === 'examen');

              return (
                <tr key={m._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-500">{m.code}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{m.nom}</td>
                  <td className="py-3.5 px-3 text-center font-bold text-slate-700">{m.coefficient}</td>
                  <td className="py-3.5 px-3 text-center text-slate-600">{m.credits} ECTS</td>
                  <td className="py-3.5 px-3 text-center text-slate-700">
                    {ds ? `${ds.valeur}/20` : '-'}
                  </td>
                  <td className="py-3.5 px-3 text-center text-slate-700">
                    {tp ? `${tp.valeur}/20` : '-'}
                  </td>
                  <td className="py-3.5 px-3 text-center text-slate-700">
                    {exam ? `${exam.valeur}/20` : '-'}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-sm text-[#03c9d7]">
                    {m.moyenneMatiere.toFixed(2)}/20
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full font-semibold text-[11px] ${
                        m.valide ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {m.valide ? 'Validée (≥10)' : 'Non validée'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
