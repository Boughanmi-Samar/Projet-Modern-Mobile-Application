import connectToDatabase from '@/lib/mongodb';
import { User, UserRole } from '@/models/User';
import { Group } from '@/models/Group';
import { createUserAction, deleteUserAction } from '@/app/(modules)/users/actions';
import SubmitButton from '@/components/ui/SubmitButton';
import Link from 'next/link';
import { Users, UserPlus, Trash2, Mail, Shield, Layers } from 'lucide-react';



export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  await connectToDatabase();

  const { role } = await searchParams;
  const validRoles = ['admin', 'teacher', 'student'];
  const roleFilter: Record<string, any> = role && validRoles.includes(role) ? { role } : {};

  const [allUsers, filteredUsers, groups] = await Promise.all([
    User.find({}).sort({ createdAt: -1 }) as any,            // for counts
    User.find(roleFilter).populate('groupe').sort({ createdAt: -1 }) as any, // displayed
    Group.find().sort({ nom: 1 }),
  ]);

  const counts = {
    all: (allUsers as any[]).length,
    admin: (allUsers as any[]).filter((u: any) => u.role === 'admin').length,
    teacher: (allUsers as any[]).filter((u: any) => u.role === 'teacher').length,
    student: (allUsers as any[]).filter((u: any) => u.role === 'student').length,
  };

  const users: any[] = filteredUsers;

  async function handleCreateUser(formData: FormData) {
    'use server';
    await createUserAction(formData);
  }

  async function handleDeleteUser(formData: FormData) {
    'use server';
    await deleteUserAction(formData);
  }

  const tabClass = (active: boolean) =>
    `px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
      active
        ? 'bg-[#03c9d7] text-white border-[#03c9d7] shadow-sm'
        : 'bg-white text-slate-600 border-slate-200 hover:border-[#03c9d7] hover:text-[#03c9d7]'
    }`;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800">Gestion des Utilisateurs</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Création de comptes, attribution des rôles et affectation des étudiants aux groupes.
          </p>
        </div>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/users" className={tabClass(!role || !validRoles.includes(role))}>
          Tous ({counts.all})
        </Link>
        <Link href="/admin/users?role=admin" className={tabClass(role === 'admin')}>
           Admins ({counts.admin})
        </Link>
        <Link href="/admin/users?role=teacher" className={tabClass(role === 'teacher')}>
           Enseignants ({counts.teacher})
        </Link>
        <Link href="/admin/users?role=student" className={tabClass(role === 'student')}>
          Étudiants ({counts.student})
        </Link>
      </div>

      {/* Creation Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <UserPlus className="w-5 h-5 text-[#03c9d7]" />
          <h2 className="text-sm sm:text-base font-bold text-slate-800">Ajouter un Utilisateur</h2>
        </div>

        <form action={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nom complet *</label>
            <input
              type="text"
              name="nom"
              required
              placeholder="Ex : Sarah Bouazizi"
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email universitaire *</label>
            <input
              type="email"
              name="email"
              required
              placeholder="sarah@uniconnect.tn"
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mot de passe temporaire *</label>
            <input
              type="password"
              name="password"
              required
              placeholder="Minimum 6 caractères"
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Rôle *</label>
            <select
              name="role"
              required
              defaultValue="student"
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            >
              <option value="student">Étudiant</option>
              <option value="teacher">Enseignant</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Groupe (si étudiant)</label>
            <select
              name="groupe"
              defaultValue=""
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            >
              <option value="">-- Aucun groupe --</option>
              {groups.map((g) => (
                <option key={g._id.toString()} value={g._id.toString()}>
                  {g.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone</label>
            <input
              type="text"
              name="telephone"
              placeholder="+216 55 123 456"
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3 flex justify-end pt-2">
            <SubmitButton className="w-full sm:w-auto">
              <UserPlus className="w-4 h-4" />
              <span>Créer l’utilisateur</span>
            </SubmitButton>
          </div>
        </form>
      </div>

      {/* Users List */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
          {role === 'admin'
            ? `Administrateurs (${users.length})`
            : role === 'teacher'
            ? `Enseignants (${users.length})`
            : role === 'student'
            ? `Étudiants (${users.length})`
            : `Comptes Enregistrés (${users.length})`}
        </h2>

        {/* Mobile View: Cards */}
        <div className="block md:hidden space-y-2.5">
          {users.map((u) => {
            const roleBadge =
              u.role === 'admin'
                ? 'bg-purple-100 text-purple-800'
                : u.role === 'teacher'
                ? 'bg-cyan-100 text-cyan-800'
                : 'bg-emerald-100 text-emerald-800';

            return (
              <div key={u._id.toString()} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800">{u.nom}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${roleBadge}`}>
                    {u.role}
                  </span>
                </div>
                <div className="text-xs text-slate-500 space-y-0.5">
                  <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {u.email}</p>
                  {u.groupe && (
                    <p className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-indigo-400" /> {(u.groupe as any).nom}</p>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <form action={handleDeleteUser}>
                    <input type="hidden" name="id" value={u._id.toString()} />
                    <button
                      type="submit"
                      className="min-h-[44px] px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1.5 font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Supprimer</span>
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Utilisateur</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Rôle</th>
                <th className="py-3 px-4">Groupe</th>
                <th className="py-3 px-4">Téléphone</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u._id.toString()} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-800">{u.nom}</td>
                  <td className="py-3 px-4 text-slate-600">{u.email}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : u.role === 'teacher'
                          ? 'bg-cyan-100 text-cyan-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {u.groupe ? (u.groupe as any).nom : '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{u.telephone || '-'}</td>
                  <td className="py-3 px-4 text-right">
                    <form action={handleDeleteUser} className="inline-block">
                      <input type="hidden" name="id" value={u._id.toString()} />
                      <button
                        type="submit"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
