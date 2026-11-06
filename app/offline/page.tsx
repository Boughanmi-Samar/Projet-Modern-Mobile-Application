'use client';

import Link from 'next/link';
import Image from 'next/image';
import { WifiOff, RefreshCw, ArrowLeft, Clock, CheckCircle } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-teal-50 border border-teal-100 text-teal-600 rounded-2xl flex items-center justify-center">
          <WifiOff className="w-8 h-8 text-[#03c9d7]" />
        </div>

        <div className="flex justify-center mb-4">
          <Image src="/logo.png" alt="UniConnect" width={160} height={45} className="h-10 w-auto" />
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">Mode Hors Ligne</h1>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Vous êtes actuellement déconnecté d’Internet. L’application UniConnect reste partiellement utilisable grâce à
          sa technologie PWA.
        </p>

        <div className="bg-cyan-50/60 border border-cyan-100 rounded-xl p-4 text-left mb-6 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#03c9d7] flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" /> Fonctionnalités disponibles hors ligne :
          </h2>
          <ul className="text-xs text-slate-700 space-y-1.5 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-[#03c9d7] font-bold">•</span>
              <span><strong>Enseignants :</strong> Saisie des absences stockée dans IndexedDB et synchronisée au retour du réseau.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#03c9d7] font-bold">•</span>
              <span><strong>Consultation :</strong> Données déjà mises en mémoire cache (emploi du temps, relevé).</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#03c9d7] hover:bg-[#00b5b8] text-white font-medium text-sm transition-all shadow-md shadow-cyan-500/20 active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer la connexion
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
