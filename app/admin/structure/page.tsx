import connectToDatabase from '@/lib/mongodb';
import { Department } from '@/models/Department';
import { Filiere } from '@/models/Filiere';
import { Group } from '@/models/Group';
import { User } from '@/models/User';
import {
  createDepartmentAction,
  deleteDepartmentAction,
  createFiliereAction,
  deleteFiliereAction,
  createGroupAction,
  deleteGroupAction,
} from '@/app/(modules)/structure/actions';
import SubmitButton from '@/components/ui/SubmitButton';
import { Layers, Plus, Trash2, Building2, GraduationCap, Users } from 'lucide-react';



export default async function AdminStructurePage() {
  await connectToDatabase();

  const [departments, filieres, groups] = await Promise.all([
    Department.find().sort({ nom: 1 }),
    Filiere.find().populate('departement').sort({ nom: 1 }),
    Group.find().populate('filiere').sort({ nom: 1 }),
  ]);

  // Compute student count per group
  const groupStudentCounts: Record<string, number> = {};
  for (const g of groups) {
    groupStudentCounts[g._id.toString()] = await User.countDocuments({ groupe: g._id });
  }

  async function handleCreateDepartment(formData: FormData) {
    'use server';
    await createDepartmentAction(formData);
  }

  async function handleDeleteDepartment(formData: FormData) {
    'use server';
    await deleteDepartmentAction(formData);
  }

  async function handleCreateFiliere(formData: FormData) {
    'use server';
    await createFiliereAction(formData);
  }

  async function handleDeleteFiliere(formData: FormData) {
    'use server';
    await deleteFiliereAction(formData);
  }

  async function handleCreateGroup(formData: FormData) {
    'use server';
    await createGroupAction(formData);
  }

  async function handleDeleteGroup(formData: FormData) {
    'use server';
    await deleteGroupAction(formData);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800">Structure Académique</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Gestion des Départements, Filières de formation et Groupes d’étudiants.
        </p>
      </div>

      {/* 1. DÉPARTEMENTS */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Building2 className="w-5 h-5 text-[#03c9d7]" />
          <h2 className="text-sm sm:text-base font-bold text-slate-800">1. Départements ({departments.length})</h2>
        </div>

        {/* Add Department Form */}
        <form action={handleCreateDepartment} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nom du département *</label>
            <input
              type="text"
              name="nom"
              required
              placeholder="Ex : Informatique"
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Code unique *</label>
            <input
              type="text"
              name="code"
              required
              placeholder="Ex : INFO"
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            />
          </div>

          <div className="flex items-end">
            <SubmitButton className="w-full">
              <Plus className="w-4 h-4" />
              <span>Ajouter Département</span>
            </SubmitButton>
          </div>
        </form>

        {/* Departments List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {departments.map((d) => (
            <div
              key={d._id.toString()}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-mono font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                  {d.code}
                </span>
                <p className="font-bold text-xs sm:text-sm text-slate-800 mt-1">{d.nom}</p>
              </div>

              <form action={handleDeleteDepartment}>
                <input type="hidden" name="id" value={d._id.toString()} />
                <button
                  type="submit"
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      {/* 2. FILIÈRES */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <GraduationCap className="w-5 h-5 text-indigo-500" />
          <h2 className="text-sm sm:text-base font-bold text-slate-800">2. Filières de Formation ({filieres.length})</h2>
        </div>

        {/* Add Filiere Form */}
        <form action={handleCreateFiliere} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nom de la filière *</label>
            <input
              type="text"
              name="nom"
              required
              placeholder="Ex : Génie Logiciel"
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Niveau / Cycle *</label>
            <input
              type="text"
              name="niveau"
              required
              placeholder="Ex : Cycle Ingénieur 4ème Année"
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Département de rattachement *</label>
            <select
              name="departement"
              required
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            >
              {departments.map((d) => (
                <option key={d._id.toString()} value={d._id.toString()}>
                  {d.nom} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3 flex justify-end">
            <SubmitButton className="w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              <span>Créer la filière</span>
            </SubmitButton>
          </div>
        </form>

        {/* Filieres List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {filieres.map((f) => (
            <div
              key={f._id.toString()}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
            >
              <div>
                <p className="font-bold text-xs sm:text-sm text-slate-800">{f.nom}</p>
                <span className="text-[11px] text-slate-500 font-medium">
                  {f.niveau} • Dép. {(f.departement as any)?.code || '-'}
                </span>
              </div>

              <form action={handleDeleteFiliere}>
                <input type="hidden" name="id" value={f._id.toString()} />
                <button
                  type="submit"
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      {/* 3. GROUPES D'ÉTUDIANTS */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Users className="w-5 h-5 text-emerald-600" />
          <h2 className="text-sm sm:text-base font-bold text-slate-800">3. Groupes d’Étudiants ({groups.length})</h2>
        </div>

        {/* Add Group Form */}
        <form action={handleCreateGroup} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nom du groupe *</label>
            <input
              type="text"
              name="nom"
              required
              placeholder="Ex : 4ALINFO-GL1"
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Effectif prévu</label>
            <input
              type="number"
              name="effectif"
              min="1"
              defaultValue="30"
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Filière associée *</label>
            <select
              name="filiere"
              required
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
            >
              {filieres.map((f) => (
                <option key={f._id.toString()} value={f._id.toString()}>
                  {f.nom} ({f.niveau})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3 flex justify-end">
            <SubmitButton className="w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              <span>Créer le groupe</span>
            </SubmitButton>
          </div>
        </form>

        {/* Groups List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {groups.map((g) => {
            const count = groupStudentCounts[g._id.toString()] || 0;

            return (
              <div
                key={g._id.toString()}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-xs sm:text-sm text-slate-800">{g.nom}</p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Filière : {(g.filiere as any)?.nom || '-'}
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    {count} étudiant(s) inscrit(s)
                  </span>
                </div>

                <form action={handleDeleteGroup}>
                  <input type="hidden" name="id" value={g._id.toString()} />
                  <button
                    type="submit"
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                    title={count > 0 ? "Suppression refusée si des étudiants sont inscrits" : "Supprimer"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
