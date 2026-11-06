'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, User as UserIcon, BookOpen, Layers } from 'lucide-react';

export interface SeanceViewItem {
  _id: string;
  jour: string;
  heureDebut: string;
  heureFin: string;
  typeSeance?: string;
  matiere: { _id: string; nom: string; code: string; coefficient?: number };
  enseignant: { _id: string; nom: string };
  groupe: { _id: string; nom: string };
  salle: { _id: string; nom: string; type?: string };
}

interface Props {
  seances: SeanceViewItem[];
  title?: string;
  userRole?: 'admin' | 'teacher' | 'student';
}

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function ScheduleWeeklyView({ seances, title = 'Emploi du temps', userRole }: Props) {
  const [selectedJour, setSelectedJour] = useState<string>('Lundi');
  const [filterGroup, setFilterGroup] = useState<string>('all');

  // Extract distinct groups for filtering
  const groups = Array.from(new Set(seances.map((s) => s.groupe?.nom).filter(Boolean)));

  const filteredSeances = seances.filter((s) => {
    if (filterGroup !== 'all' && s.groupe?.nom !== filterGroup) return false;
    return true;
  });

  const seancesByDay: Record<string, SeanceViewItem[]> = {};
  JOURS.forEach((j) => {
    seancesByDay[j] = filteredSeances
      .filter((s) => s.jour === j)
      .sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
  });

  return (
    <div className="space-y-4">
      {/* Filters & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-[#03c9d7]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">{title}</h2>
            <p className="text-xs text-slate-500">Vue hebdomadaire et journalière optimisée mobile</p>
          </div>
        </div>

        {groups.length > 1 && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">Filtrer par groupe :</label>
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-medium text-slate-700"
            >
              <option value="all">Tous les groupes</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Mobile Day Selector (Horizontal pills) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {JOURS.map((j) => {
          const count = seancesByDay[j]?.length || 0;
          const isSelected = selectedJour === j;

          return (
            <button
              key={j}
              type="button"
              onClick={() => setSelectedJour(j)}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#03c9d7] text-white shadow-md shadow-cyan-500/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{j}</span>
              {count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day View (Cards on Mobile) */}
      <div className="block lg:hidden space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Séances du {selectedJour} ({seancesByDay[selectedJour]?.length || 0})
        </h3>

        {(!seancesByDay[selectedJour] || seancesByDay[selectedJour].length === 0) ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-sm">
            Aucun cours planifié pour le {selectedJour}.
          </div>
        ) : (
          seancesByDay[selectedJour].map((s) => (
            <div
              key={s._id}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-[#03c9d7]/50 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-[#03c9d7] font-mono text-xs font-bold border border-teal-100">
                  <Clock className="w-3.5 h-3.5" />
                  {s.heureDebut} - {s.heureFin}
                </span>

                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  {s.typeSeance || 'Cours'}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-sm sm:text-base leading-snug">
                  {s.matiere?.nom}
                </h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{s.matiere?.code}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 truncate">
                  <UserIcon className="w-3.5 h-3.5 text-[#03c9d7] shrink-0" />
                  <span className="truncate">{s.enseignant?.nom}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate font-semibold">{s.salle?.nom}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate col-span-2">
                  <Layers className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="font-medium text-slate-700">Groupe : {s.groupe?.nom}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Weekly Grid (>= 1024px) */}
      <div className="hidden lg:grid grid-cols-5 gap-3">
        {JOURS.slice(0, 5).map((j) => (
          <div key={j} className="bg-slate-50/70 border border-slate-200 rounded-2xl p-3 flex flex-col min-h-[480px]">
            <div className="text-center font-bold text-sm text-slate-700 border-b border-slate-200 pb-2 mb-3">
              {j}
            </div>

            <div className="space-y-2.5 flex-1">
              {(!seancesByDay[j] || seancesByDay[j].length === 0) ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                  Aucun cours
                </div>
              ) : (
                seancesByDay[j].map((s) => (
                  <div
                    key={s._id}
                    className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs hover:shadow-md hover:border-[#03c9d7] transition-all text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#03c9d7] font-bold">
                      <span>{s.heureDebut}-{s.heureFin}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{s.typeSeance}</span>
                    </div>

                    <p className="font-bold text-slate-800 line-clamp-2 leading-tight">
                      {s.matiere?.nom}
                    </p>

                    <div className="text-[11px] text-slate-600 space-y-0.5 pt-1 border-t border-slate-100">
                      <p className="truncate">👤 {s.enseignant?.nom}</p>
                      <p className="truncate font-semibold text-teal-800">📍 {s.salle?.nom}</p>
                      <p className="truncate text-slate-500">👥 {s.groupe?.nom}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
