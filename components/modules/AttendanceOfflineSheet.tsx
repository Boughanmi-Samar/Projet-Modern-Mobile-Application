'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, CheckCircle2, AlertCircle, Clock, Save, RefreshCw } from 'lucide-react';
import { saveAttendanceSheetAction } from '@/app/(modules)/absences/actions';
import { saveOfflineAttendance, getPendingAttendances } from '@/lib/offline-db';
import SubmitButton from '@/components/ui/SubmitButton';

interface StudentItem {
  _id: string;
  nom: string;
  email: string;
}

interface SeanceItem {
  _id: string;
  jour: string;
  heureDebut: string;
  heureFin: string;
  matiere: { _id: string; nom: string; code: string };
  groupe: { _id: string; nom: string };
  salle: { nom: string };
}

interface Props {
  seances: SeanceItem[];
  studentsByGroup: Record<string, StudentItem[]>;
}

export default function AttendanceOfflineSheet({ seances, studentsByGroup }: Props) {
  const [selectedSeanceId, setSelectedSeanceId] = useState<string>(seances[0]?._id || '');
  const [dateStr, setDateStr] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<Record<string, 'present' | 'absent' | 'retard'>>({});
  const [simulatedOffline, setSimulatedOffline] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const currentSeance = seances.find((s) => s._id === selectedSeanceId);
  const currentGroupId = currentSeance?.groupe?._id;
  const currentStudents = currentGroupId ? studentsByGroup[currentGroupId] || [] : [];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const on = () => setIsOnline(true);
      const off = () => setIsOnline(false);
      window.addEventListener('online', on);
      window.addEventListener('offline', off);
      return () => {
        window.removeEventListener('online', on);
        window.removeEventListener('offline', off);
      };
    }
  }, []);

  // Initialize records to 'present' by default
  useEffect(() => {
    if (currentStudents.length > 0) {
      const init: Record<string, 'present' | 'absent' | 'retard'> = {};
      currentStudents.forEach((st) => {
        init[st._id] = 'present';
      });
      setRecords(init);
    }
  }, [selectedSeanceId]);

  const setStudentStatus = (studentId: string, status: 'present' | 'absent' | 'retard') => {
    setRecords((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = async () => {
    if (!currentSeance) return;
    setIsSubmitting(true);
    setStatusMessage(null);

    const recordArray = Object.entries(records).map(([etudiantId, statut]) => ({
      etudiantId,
      statut,
      justifiee: false,
    }));

    const effectivelyOffline = !isOnline || simulatedOffline;

    try {
      if (effectivelyOffline) {
        // Sauvegarde dans IndexedDB (Mode Hors Ligne)
        await saveOfflineAttendance({
          seanceId: currentSeance._id,
          date: dateStr,
          records: recordArray,
        });

        setStatusMessage({
          type: 'warning',
          text: '💾 Émargement enregistré HORS LIGNE dans IndexedDB ! Il sera synchronisé automatiquement dès le rétablissement de la connexion.',
        });
      } else {
        // Sauvegarde directe via Server Action
        const res = await saveAttendanceSheetAction({
          seanceId: currentSeance._id,
          dateStr,
          records: recordArray,
        });

        if (res.success) {
          setStatusMessage({
            type: 'success',
            text: `✅ ${res.message}`,
          });
        } else {
          setStatusMessage({
            type: 'error',
            text: res.error || 'Erreur lors de l’enregistrement.',
          });
        }
      }
    } catch (err: any) {
      // Si une erreur réseau se produit lors de l'appel serveur, fallback automatique IndexedDB !
      try {
        await saveOfflineAttendance({
          seanceId: currentSeance._id,
          date: dateStr,
          records: recordArray,
        });
        setStatusMessage({
          type: 'warning',
          text: 'Réseau indisponible. Émargement sécurisé localement dans IndexedDB.',
        });
      } catch {
        setStatusMessage({
          type: 'error',
          text: `Erreur: ${err.message}`,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (seances.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500">
        Aucune séance programmée pour vos matières.
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800">Feuille d’Émargement</h2>
          <p className="text-xs text-slate-500">Saisie en direct ou hors ligne avec synchronisation IndexedDB</p>
        </div>

        {/* Forced offline simulator toggle */}
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <label htmlFor="sim-toggle" className="text-xs font-medium text-slate-700 cursor-pointer flex items-center gap-1.5">
            {simulatedOffline || !isOnline ? (
              <WifiOff className="w-4 h-4 text-amber-500" />
            ) : (
              <Wifi className="w-4 h-4 text-emerald-500" />
            )}
            <span>Tester mode Hors Ligne</span>
          </label>
          <input
            id="sim-toggle"
            type="checkbox"
            checked={simulatedOffline}
            onChange={(e) => setSimulatedOffline(e.target.checked)}
            className="h-4 w-4 rounded text-[#03c9d7] focus:ring-[#03c9d7] cursor-pointer"
          />
        </div>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Séance & Cours</label>
          <select
            value={selectedSeanceId}
            onChange={(e) => setSelectedSeanceId(e.target.value)}
            className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
          >
            {seances.map((s) => (
              <option key={s._id} value={s._id}>
                {s.jour} {s.heureDebut}-{s.heureFin} : {s.matiere?.nom} ({s.groupe?.nom} - {s.salle?.nom})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Date de la séance</label>
          <input
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
          />
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2.5 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : statusMessage.type === 'warning'
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />}
          {statusMessage.type === 'warning' && <WifiOff className="w-5 h-5 shrink-0 text-amber-600" />}
          {statusMessage.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Student attendance list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Étudiants inscrits ({currentStudents.length})
          </span>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Présent
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Retard
            </span>
          </div>
        </div>

        {currentStudents.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">Aucun étudiant dans ce groupe.</p>
        ) : (
          <div className="space-y-2">
            {currentStudents.map((st) => {
              const currentStatus = records[st._id] || 'present';

              return (
                <div
                  key={st._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition-all gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                      {st.nom.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{st.nom}</p>
                      <p className="text-[11px] text-slate-500">{st.email}</p>
                    </div>
                  </div>

                  {/* Status buttons with >= 44px touch target */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => setStudentStatus(st._id, 'present')}
                      className={`min-h-[44px] min-w-[70px] px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        currentStatus === 'present'
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 ring-2 ring-emerald-600/20'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Présent
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentStatus(st._id, 'absent')}
                      className={`min-h-[44px] min-w-[70px] px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        currentStatus === 'absent'
                          ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30 ring-2 ring-rose-600/20'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Absent
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentStatus(st._id, 'retard')}
                      className={`min-h-[44px] min-w-[70px] px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        currentStatus === 'retard'
                          ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30 ring-2 ring-amber-600/20'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Retard
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          Mode actuel :{' '}
          <strong className={simulatedOffline || !isOnline ? 'text-amber-600' : 'text-emerald-600'}>
            {simulatedOffline || !isOnline ? 'Hors Ligne (IndexedDB)' : 'En Ligne (Synchronisé)'}
          </strong>
        </div>

        <button
          type="button"
          disabled={isSubmitting || currentStudents.length === 0}
          onClick={handleSaveAttendance}
          className="min-h-[44px] px-6 py-2.5 rounded-xl font-bold text-sm bg-[#03c9d7] hover:bg-[#00b5b8] text-white shadow-md shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Enregistrer l’appel</span>
        </button>
      </div>
    </div>
  );
}
