'use client';

import { useState } from 'react';
import Image from 'next/image';
import { LogIn, Key, Mail, ShieldAlert } from 'lucide-react';
import { loginAction } from '@/app/(modules)/auth/actions';
import SubmitButton from '@/components/ui/SubmitButton';

export default function LoginPage() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClientAction = async (formData: FormData) => {
    setErrorMsg(null);
    const res = await loginAction(formData);
    if (res && !res.success) {
      setErrorMsg(res.error || 'Erreur lors de la connexion.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-cyan-50/30 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Brand card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl shadow-teal-500/5 text-center">
          <div className="flex justify-center mb-3">
            <div className="relative w-28 h-28 flex items-center justify-center p-2 rounded-2xl bg-teal-50/50">
              <Image
                src="/logo.png"
                alt="Logo UniConnect"
                width={120}
                height={120}
                className="object-contain"
                priority
              />
            </div>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-[#03c9d7]">UNICONNECT</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Plateforme Progressive de Gestion Universitaire
          </p>

          {errorMsg && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2 text-left">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form action={handleClientAction} className="mt-6 space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Adresse Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="nom@uniconnect.tn"
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Mot de passe
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7] transition-all"
                />
              </div>
            </div>

            <SubmitButton className="w-full py-3.5 font-bold text-sm tracking-wide">
              <LogIn className="w-4 h-4" />
              <span>Se Connecter</span>
            </SubmitButton>
          </form>

          {/* Static credentials table */}
        
        </div>

        {/* PWA highlight note */}
       
      </div>
    </div>
  );
}
