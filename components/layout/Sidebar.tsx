'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  ClipboardCheck,
  Award,
  FileCheck2,
  AlertTriangle,
  Megaphone,
  Bot,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  role: 'admin' | 'teacher' | 'student';
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const getLinks = () => {
    switch (role) {
      case 'admin':
        return [
          { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard },
          { href: '/admin/users', label: 'Utilisateurs', icon: Users },
          { href: '/admin/structure', label: 'Structure & Groupes', icon: Layers },
          { href: '/admin/matieres', label: 'Matières & Affectations', icon: BookOpen },
          { href: '/admin/schedule', label: 'Emploi du temps & Salles', icon: Calendar },
          { href: '/admin/annonces', label: 'Annonces Générales', icon: Megaphone },
        ];
      case 'teacher':
        return [
          { href: '/teacher', label: 'Tableau de bord', icon: LayoutDashboard },
          { href: '/teacher/absences', label: 'Feuille d’Appel & Offline', icon: ClipboardCheck },
          { href: '/teacher/grades', label: 'Saisie des Notes', icon: Award },
          { href: '/teacher/justificatifs', label: 'Justificatifs', icon: FileCheck2 },
          { href: '/teacher/schedule', label: 'Mon Emploi du temps', icon: Calendar },
          { href: '/teacher/at-risk', label: 'Étudiants à Risque (IA)', icon: AlertTriangle },
          { href: '/teacher/annonces', label: 'Mes Annonces', icon: Megaphone },
        ];
      case 'student':
        return [
          { href: '/student', label: 'Mon Espace', icon: LayoutDashboard },
          { href: '/student/schedule', label: 'Emploi du temps', icon: Calendar },
          { href: '/student/grades', label: 'Notes & Relevé', icon: Award },
          { href: '/student/absences', label: 'Absences & Justificatifs', icon: ClipboardCheck },
          { href: '/student/annonces', label: 'Annonces', icon: Megaphone },
          { href: '/student/assistant', label: 'Assistant IA UniConnect', icon: Bot },
        ];
    }
  };

  const links = getLinks();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-57px)] p-4 shrink-0">
      <div className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-teal-50 text-[#03c9d7] shadow-sm shadow-teal-500/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#03c9d7]' : 'text-slate-400'}`} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>


    </aside>
  );
}
