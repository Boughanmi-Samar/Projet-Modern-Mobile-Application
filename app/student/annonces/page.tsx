import connectToDatabase from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { User } from '@/models/User';
import { Annonce } from '@/models/Annonce';
import { Megaphone, Calendar, User as UserIcon } from 'lucide-react';



export default async function StudentAnnoncesPage() {
  const session = await requireAuth(['student']);
  await connectToDatabase();

  const user = await User.findById(session.id);
  const annonces = await Annonce.find({
    $or: [{ portee: 'generale' }, { portee: 'groupe', groupe: user?.groupe }],
  })
    .populate('auteur groupe')
    .sort({ date: -1 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800">Annonces Pédagogiques</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Communications officielles de l’administration et de vos enseignants.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {annonces.map((a) => (
          <div
            key={a._id.toString()}
            className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    a.priorite === 'urgente'
                      ? 'bg-rose-100 text-rose-800'
                      : a.priorite === 'importante'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {a.priorite}
                </span>

                <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(a.date).toLocaleDateString('fr-FR')}
                </span>
              </div>

              <h3 className="font-bold text-sm sm:text-base text-slate-800 leading-snug">{a.titre}</h3>
              <p className="text-xs text-slate-600 mt-2 whitespace-pre-line leading-relaxed">{a.contenu}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-teal-600" /> {(a.auteur as any)?.nom || 'Administration'}
              </span>
              <span className="font-medium text-teal-700">
                {a.portee === 'generale' ? 'Tous les étudiants' : (a.groupe as any)?.nom}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
