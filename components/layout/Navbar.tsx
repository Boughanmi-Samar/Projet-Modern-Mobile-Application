'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LogOut, User, Wifi, WifiOff, Bell } from 'lucide-react';
import { logoutAction } from '@/app/(modules)/auth/actions';

interface NavbarProps {
  user: {
    id: string;
    nom: string;
    email: string;
    role: string;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const [isOnline, setIsOnline] = useState<boolean>(true);

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

  const roleLabel =
    user.role === 'admin'
      ? 'Administrateur'
      : user.role === 'teacher'
      ? 'Enseignant'
      : 'Étudiant';

  const roleColor =
    user.role === 'admin'
      ? 'bg-purple-50 text-purple-700 border-purple-200'
      : user.role === 'teacher'
      ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <Link href={`/${user.role}`} className="flex items-center gap-2 group">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Logo UniConnect"
                width={36}
                height={36}
                className="object-contain transition-transform group-hover:scale-105"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-[#03c9d7] leading-none">
                UNICONNECT
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                Portail Universitaire
              </span>
            </div>
          </Link>
        </div>

        {/* Right: Network status + User + Logout */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Online/Offline Status Pill */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
            }`}
          >
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline">En ligne</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span>Hors ligne</span>
              </>
            )}
          </div>

          {/* User Role Badge */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-800 leading-tight">{user.nom}</span>
              <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded-full border self-end ${roleColor}`}>
                {roleLabel}
              </span>
            </div>

            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold">
              {user.nom.charAt(0)}
            </div>
          </div>

          {/* Logout Action */}
          <form action={logoutAction}>
            <button
              type="submit"
              title="Se déconnecter"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
