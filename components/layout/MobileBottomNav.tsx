'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Layers,
  Calendar,
  ClipboardCheck,
  Award,
  Bot,
  Megaphone,
} from 'lucide-react';

interface MobileBottomNavProps {
  role: 'admin' | 'teacher' | 'student';
}

export default function MobileBottomNav({ role }: MobileBottomNavProps) {
  const pathname = usePathname();

  const getLinks = () => {
    switch (role) {
      case 'admin':
        return [
          { href: '/admin', label: 'Accueil', icon: LayoutDashboard },
          { href: '/admin/users', label: 'Comptes', icon: Users },
          { href: '/admin/structure', label: 'Structure', icon: Layers },
          { href: '/admin/schedule', label: 'Planning', icon: Calendar },
          { href: '/admin/annonces', label: 'Annonces', icon: Megaphone },
        ];
      case 'teacher':
        return [
          { href: '/teacher', label: 'Accueil', icon: LayoutDashboard },
          { href: '/teacher/absences', label: 'Appel', icon: ClipboardCheck },
          { href: '/teacher/grades', label: 'Notes', icon: Award },
          { href: '/teacher/schedule', label: 'Planning', icon: Calendar },
          { href: '/teacher/at-risk', label: 'IA Risque', icon: Bot },
        ];
      case 'student':
        return [
          { href: '/student', label: 'Accueil', icon: LayoutDashboard },
          { href: '/student/schedule', label: 'Planning', icon: Calendar },
          { href: '/student/grades', label: 'Notes', icon: Award },
          { href: '/student/absences', label: 'Absences', icon: ClipboardCheck },
          { href: '/student/assistant', label: 'IA Chat', icon: Bot },
        ];
    }
  };

  const links = getLinks();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 safe-area-bottom">
      <div className="flex items-center justify-around">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`min-h-[48px] min-w-[48px] flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                isActive
                  ? 'text-[#03c9d7] font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-lg transition-transform ${isActive ? 'bg-teal-50 scale-110' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
