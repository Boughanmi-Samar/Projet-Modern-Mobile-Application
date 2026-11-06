'use client';

import { AlertTriangle, TrendingDown, Clock, ShieldAlert, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface StudentRiskItem {
  etudiant: { id: string; nom: string; email: string };
  matiere: { id: string; nom: string; code: string };
  moyenne: number;
  tauxAbsence: number;
  totalAbsences: number;
  niveauRisque: 'Critique' | 'Modéré' | 'Faible';
  diagnostic: string;
  recommandations: string[];
}

interface Props {
  students: StudentRiskItem[];
}

export default function RiskAnalysisCard({ students }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(students[0]?.etudiant.id || null);

  if (students.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center text-emerald-800">
        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
        <h3 className="font-bold text-sm sm:text-base">Aucun étudiant à risque détecté</h3>
        <p className="text-xs text-emerald-700 mt-1">
          Tous les étudiants affichent une assiduité conforme et des résultats satisfaisants dans vos matières.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {students.map((item) => {
        const isCritical = item.niveauRisque === 'Critique';
        const isModerate = item.niveauRisque === 'Modéré';
        const isExpanded = expandedId === item.etudiant.id;

        return (
          <div
            key={item.etudiant.id}
            className={`border rounded-2xl overflow-hidden transition-all bg-white shadow-xs ${
              isCritical
                ? 'border-rose-200 hover:border-rose-300'
                : 'border-amber-200 hover:border-amber-300'
            }`}
          >
            {/* Header row */}
            <div
              onClick={() => setExpandedId(isExpanded ? null : item.etudiant.id)}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/60 transition-colors gap-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isCritical ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                  }`}
                >
                  <ShieldAlert className="w-5 h-5" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-800">{item.etudiant.nom}</h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isCritical ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Risque {item.niveauRisque}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {item.matiere.nom} ({item.matiere.code})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-3 text-xs">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">Absences</span>
                    <span className={`font-bold ${item.tauxAbsence >= 25 ? 'text-rose-600 font-black' : 'text-slate-700'}`}>
                      {item.tauxAbsence}% ({item.totalAbsences} abs.)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">Moyenne</span>
                    <span className={`font-bold ${item.moyenne < 10 ? 'text-rose-600' : 'text-slate-700'}`}>
                      {item.moyenne}/20
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Développer"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400"
                >
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Mobile quick metrics */}
            <div className="sm:hidden px-4 pb-3 flex items-center justify-between text-xs border-b border-slate-100">
              <span className="text-slate-600">
                Taux d’absence :{' '}
                <strong className={item.tauxAbsence >= 25 ? 'text-rose-600' : 'text-slate-700'}>
                  {item.tauxAbsence}%
                </strong>
              </span>
              <span className="text-slate-600">
                Moyenne :{' '}
                <strong className={item.moyenne < 10 ? 'text-rose-600' : 'text-slate-700'}>
                  {item.moyenne}/20
                </strong>
              </span>
            </div>

            {/* Expanded details */}
            {isExpanded && (
              <div className="p-4 bg-slate-50/70 border-t border-slate-100 space-y-3 text-xs">
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Diagnostic IA :</span>
                  <p className="text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                    {item.diagnostic}
                  </p>
                </div>

                <div>
                  <span className="font-bold text-slate-700 block mb-1.5">Recommandations Pédagogiques :</span>
                  <ul className="space-y-1.5">
                    {item.recommandations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[#03c9d7] font-bold">✓</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
