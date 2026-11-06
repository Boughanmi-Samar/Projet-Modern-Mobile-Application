'use client';

import { useState } from 'react';
import { Sparkles, Send, Loader2, Megaphone } from 'lucide-react';
import { createAnnonceAction } from '@/app/(modules)/absences/actions';
import { generateAnnouncementDraftAction } from '@/app/(modules)/ai/actions';
import SubmitButton from '@/components/ui/SubmitButton';

interface Props {
  role: 'admin' | 'teacher';
  groups: { _id: string; nom: string }[];
}

export default function AnnouncementForm({ role, groups }: Props) {
  const [titre, setTitre] = useState<string>('');
  const [contenu, setContenu] = useState<string>('');
  const [portee, setPortee] = useState<'generale' | 'groupe'>(role === 'admin' ? 'generale' : 'groupe');
  const [groupe, setGroupe] = useState<string>(groups[0]?._id || '');
  const [priorite, setPriorite] = useState<string>('normale');
  const [aiTopic, setAiTopic] = useState<string>('');
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleGenerateAI = async () => {
    if (!aiTopic.trim()) return;
    setIsGeneratingAI(true);
    try {
      const targetLabel =
        portee === 'generale' ? 'Tous les étudiants' : groups.find((g) => g._id === groupe)?.nom || 'Mon groupe';

      const res = await generateAnnouncementDraftAction({
        sujet: aiTopic,
        destinataires: targetLabel,
      });

      if (res.success && res.draft) {
        setTitre(res.draft.titre);
        setContenu(res.draft.contenu);
      }
    } catch {
      // ignore
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    setFeedbackMsg(null);
    const res = await createAnnonceAction(formData);
    if (res.success) {
      setFeedbackMsg({ type: 'success', text: res.message || 'Annonce publiée.' });
      setTitre('');
      setContenu('');
      setAiTopic('');
    } else {
      setFeedbackMsg({ type: 'error', text: res.error || 'Erreur lors de la publication.' });
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
        <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center">
          <Megaphone className="w-5 h-5 text-[#03c9d7]" />
        </div>
        <div>
          <h3 className="font-bold text-sm sm:text-base text-slate-800">Publier une Nouvelle Annonce</h3>
          <p className="text-xs text-slate-500">Diffusez une communication officielle avec l’aide de l’IA</p>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3 rounded-xl text-xs sm:text-sm font-semibold ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedbackMsg.text}
        </div>
      )}

      {/* AI Assistance Assistant Bar */}
      <div className="bg-gradient-to-br from-teal-50/60 to-cyan-50/40 border border-teal-200 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#03c9d7]">
          <Sparkles className="w-4 h-4" />
          <span>Aide à la Rédaction IA UniConnect</span>
        </div>
        <p className="text-[11px] text-slate-600">
          Indiquez le sujet de votre annonce (ex: <em>« Report du TP de web à mardi 14h en labo 301 »</em>) pour générer
          automatiquement le texte complet.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            placeholder="Ex : Date limite pour le jalon du projet..."
            className="flex-1 text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
          />
          <button
            type="button"
            onClick={handleGenerateAI}
            disabled={!aiTopic.trim() || isGeneratingAI}
            className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#03c9d7] hover:bg-[#00b5b8] text-white shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGeneratingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Générer le texte</span>
          </button>
        </div>
      </div>

      {/* Standard Form */}
      <form action={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {role === 'admin' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Portée de l’annonce</label>
              <select
                name="portee"
                value={portee}
                onChange={(e) => setPortee(e.target.value as any)}
                className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
              >
                <option value="generale">Générale (Tous les utilisateurs)</option>
                <option value="groupe">Ciblée (Groupe spécifique)</option>
              </select>
            </div>
          )}

          {(portee === 'groupe' || role === 'teacher') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Groupe destinataire</label>
              <select
                name="groupe"
                value={groupe}
                onChange={(e) => setGroupe(e.target.value)}
                className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
              >
                {groups.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.nom}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Priorité</label>
            <select
              name="priorite"
              value={priorite}
              onChange={(e) => setPriorite(e.target.value)}
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
            >
              <option value="normale">Normale</option>
              <option value="importante">Importante</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Titre de l’annonce</label>
          <input
            type="text"
            name="titre"
            required
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            placeholder="Titre clair et concis"
            className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Contenu</label>
          <textarea
            name="contenu"
            required
            rows={4}
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            placeholder="Détail de l’annonce pédagogique..."
            className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#03c9d7]"
          />
        </div>

        <div className="flex justify-end pt-2">
          <SubmitButton className="w-full sm:w-auto">
            <Send className="w-4 h-4" />
            <span>Publier l’annonce</span>
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
