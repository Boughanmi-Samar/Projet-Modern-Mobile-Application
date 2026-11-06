import ChatbotWidget from '@/components/modules/ChatbotWidget';
import { Bot, Sparkles, MessageSquare } from 'lucide-react';



export default function StudentAssistantPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-black text-slate-800">Assistant IA UniConnect</h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-[#03c9d7] border border-teal-200 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> En ligne
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500">
          Votre tuteur virtuel intelligent : posez des questions en langage naturel sur vos cours, vos notes et vos
          absences.
        </p>
      </div>

      <ChatbotWidget />
    </div>
  );
}
