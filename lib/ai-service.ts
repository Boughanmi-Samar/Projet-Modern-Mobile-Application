/**
 * Service d'Intelligence Artificielle UniConnect
 * Prend en charge l'API Gemini avec fallback algorithmique et heuristique de haut niveau.
 */

async function callGemini(prompt: string, systemInstruction?: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith('gen-lang-client')) {
    // If key is a placeholder or not standard Gemini API key format (AIzaSy...), use local pedagogical AI engine
    return null;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          ...(systemInstruction
            ? [{ role: 'user', parts: [{ text: systemInstruction }] }, { role: 'model', parts: [{ text: 'Compris. Je suis prêt.' }] }]
            : []),
          { role: 'user', parts: [{ text: prompt }] },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    });

    if (!res.ok) {
      console.warn('[AI] Gemini HTTP error:', res.status, res.statusText);
      return null;
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (err: any) {
    console.warn('[AI] Gemini fetch error:', err.message);
    return null;
  }
}

/**
 * 1. Détection des étudiants à risque (absences en hausse + notes en baisse)
 */
export async function analyzeStudentRisk(studentData: {
  nom: string;
  moyenne: number;
  tauxAbsence: number;
  totalAbsences: number;
  matiereNom: string;
  notes: { type: string; valeur: number }[];
}): Promise<{
  niveauRisque: 'Faible' | 'Modéré' | 'Critique';
  diagnostic: string;
  recommandations: string[];
}> {
  const isHighAbsence = studentData.tauxAbsence >= 25;
  const isLowGrade = studentData.moyenne < 10;

  let niveauRisque: 'Faible' | 'Modéré' | 'Critique' = 'Faible';
  if (isHighAbsence && isLowGrade) {
    niveauRisque = 'Critique';
  } else if (isHighAbsence || isLowGrade) {
    niveauRisque = 'Modéré';
  }

  // AI Prompt for contextual pedagogical analysis
  const prompt = `En tant que conseiller pédagogique universitaire IA, analyse la situation suivante de l'étudiant ${studentData.nom} dans la matière ${studentData.matiereNom} :
- Moyenne actuelle: ${studentData.moyenne.toFixed(2)}/20
- Notes: ${studentData.notes.map((n) => `${n.type}: ${n.valeur}/20`).join(', ')}
- Taux d'absence: ${studentData.tauxAbsence.toFixed(1)}% (${studentData.totalAbsences} séance(s) manquée(s))
- Risque calculé: ${niveauRisque}

Rédige un diagnostic synthétique (2-3 phrases) et donne 3 recommandations concrètes pour l'enseignant.`;

  const aiText = await callGemini(prompt, 'Tu es un tuteur et conseiller pédagogique bienveillant et exigeant.');

  if (aiText) {
    return {
      niveauRisque,
      diagnostic: aiText,
      recommandations: [
        'Organiser un entretien pédagogique individuel avec l’étudiant.',
        'Mettre en place un plan de rattrapage des séances manquées.',
        'Proposer des exercices d’auto-évaluation ciblés.',
      ],
    };
  }

  // Fallback engine
  let diagnostic = '';
  const recommandations: string[] = [];

  if (niveauRisque === 'Critique') {
    diagnostic = `Situation alarmante pour ${studentData.nom} : cumul d'un absentéisme important (${studentData.tauxAbsence.toFixed(1)}%, seuil critique de 25% dépassé) et de notes insuffisantes (${studentData.moyenne.toFixed(2)}/20). Risque élevé d'échec ou d'exclusion de l'examen.`;
    recommandations.push('Convocation urgente pour entretien de cadrage pédagogique.');
    recommandations.push('Vérifier si un justificatif médical ou personnel n’a pas été transmis.');
    recommandations.push('Proposer un tutorat par les pairs ou des séances de remédiation en TD/TP.');
  } else if (niveauRisque === 'Modéré') {
    if (isHighAbsence) {
      diagnostic = `${studentData.nom} présente un taux d'absence élevé (${studentData.tauxAbsence.toFixed(1)}%), bien que ses résultats (${studentData.moyenne.toFixed(2)}/20) restent corrects pour le moment. Vigilance requise.`;
      recommandations.push('Rappeler le règlement pédagogique sur le seuil des 25% d’absences.');
      recommandations.push('Encourager l’étudiant à soumettre les justificatifs des séances manquées.');
    } else {
      diagnostic = `L'assiduité est satisfaisante mais les résultats de ${studentData.nom} (${studentData.moyenne.toFixed(2)}/20) sont en-deçà des attendus pour valider l'UE.`;
      recommandations.push('Analyser les lacunes spécifiques sur les évaluations types (DS/TP).');
      recommandations.push('Fournir des annales corrigées et des fiches méthodologiques.');
    }
  } else {
    diagnostic = `Progression régulière et satisfaisante pour ${studentData.nom} (${studentData.moyenne.toFixed(2)}/20, taux d'absence maîtrisé à ${studentData.tauxAbsence.toFixed(1)}%). Aucun signe de décrochage.`;
    recommandations.push('Maintenir la dynamique de travail actuelle.');
    recommandations.push('Encourager l’approfondissement sur des projets ou challenges bonus.');
  }

  return { niveauRisque, diagnostic, recommandations };
}

/**
 * 2. Assistant UniConnect (Chatbot étudiant / enseignant)
 */
export async function answerAssistantQuery(
  question: string,
  context: {
    userName: string;
    role: string;
    groupeNom?: string;
    prochaineSeance?: any;
    absencesStats?: any;
    moyenneGenerale?: number;
    notes?: any[];
  }
): Promise<string> {
  const prompt = `Contexte utilisateur UniConnect:
- Utilisateur: ${context.userName} (Rôle: ${context.role})
- Groupe: ${context.groupeNom || 'Non spécifié'}
- Prochaine séance: ${
    context.prochaineSeance
      ? `${context.prochaineSeance.matiere} (${context.prochaineSeance.jour} ${context.prochaineSeance.heureDebut}-${context.prochaineSeance.heureFin} en ${context.prochaineSeance.salle})`
      : 'Aucune séance planifiée'
  }
- Absences: ${JSON.stringify(context.absencesStats || {})}
- Moyenne générale: ${context.moyenneGenerale ? `${context.moyenneGenerale.toFixed(2)}/20` : 'En attente de notes'}
- Notes récentes: ${
    context.notes?.map((n) => `${n.matiere}: ${n.valeur}/20 (${n.type})`).join(', ') || 'Aucune note'
  }

Question de l'utilisateur: "${question}"

Réponds précisément, poliment et en français en exploitant les données ci-dessus. Sois concis et direct.`;

  const aiText = await callGemini(
    prompt,
    'Tu es l’Assistant virtuel UniConnect, l’IA officielle de gestion universitaire. Réponds toujours en français de manière claire et bienveillante.'
  );

  if (aiText) return aiText;

  // Fallback intelligent basé sur mots-clés
  const q = question.toLowerCase();

  if (q.includes('prochaine') || q.includes('séance') || q.includes('cours') || q.includes('quand') || q.includes('emploi du temps')) {
    if (context.prochaineSeance) {
      return `Votre prochaine séance est le cours de **${context.prochaineSeance.matiere}**, prévu ce **${context.prochaineSeance.jour}** de **${context.prochaineSeance.heureDebut} à ${context.prochaineSeance.heureFin}** en **${context.prochaineSeance.salle}** avec ${context.prochaineSeance.enseignant || 'votre enseignant'}.`;
    }
    return `Vous n’avez pas d’autre séance programmée pour aujourd’hui ou demain selon votre emploi du temps actuel.`;
  }

  if (q.includes('absence') || q.includes('absent') || q.includes('retard')) {
    if (context.absencesStats) {
      const { total, justifiees, nonJustifiees, tauxGlobal } = context.absencesStats;
      let msg = `Vous comptabilisez actuellement **${total} absence(s)** (${justifiees} justifiée(s), ${nonJustifiees} non justifiée(s)). Votre taux d'absence moyen est de **${tauxGlobal || 0}%**.`;
      if (Number(tauxGlobal) >= 25) {
        msg += ` ⚠️ Attention : votre taux d'absence dépasse le seuil réglementaire de 25%. Pensez à déposer un justificatif d'urgence dans l'onglet Absences.`;
      }
      return msg;
    }
    return `Vous n’avez aucune absence enregistrée pour le moment. Félicitations pour votre assiduité !`;
  }

  if (q.includes('note') || q.includes('moyenne') || q.includes('résultat') || q.includes('relevé')) {
    if (context.moyenneGenerale !== undefined) {
      return `Votre moyenne générale actuelle est de **${context.moyenneGenerale.toFixed(2)}/20**. Vous pouvez consulter le détail complet matière par matière et télécharger votre relevé officiel dans la rubrique « Notes ».`;
    }
    return `Vos notes sont en cours de traitement par vos enseignants. Rendez-vous dans la section « Notes » pour voir les dernières publications.`;
  }

  if (q.includes('justificatif') || q.includes('malade') || q.includes('certificat')) {
    return `Pour déposer un justificatif d’absence : rendez-vous dans le menu **Absences**, repérez la séance concernée et cliquez sur **« Justifier »**. Vous pourrez renseigner votre motif et joindre votre certificat. Votre enseignant traitera ensuite votre demande.`;
  }

  return `Bonjour ${context.userName} ! Je suis l'Assistant IA UniConnect. Je peux vous renseigner sur votre prochaine séance, votre moyenne, vos absences par matière ou la procédure de justification. Que souhaitez-vous savoir ?`;
}

/**
 * 3. Résumé du relevé de notes en langage naturel
 */
export async function generateGradeSummaryAI(data: {
  nom: string;
  moyenneGenerale: number;
  mention: string;
  valide: boolean;
  totalCredits: number;
  matieres: { nom: string; code: string; moyenne: number; valide: boolean; credits: number }[];
}): Promise<string> {
  const prompt = `Génère une synthèse pédagogique officielle et personnalisée pour l'étudiant(e) ${data.nom} :
- Moyenne générale : ${data.moyenneGenerale.toFixed(2)}/20
- Mention : ${data.mention}
- Statut semestre : ${data.valide ? 'Validé' : 'Non validé / Ajourné'}
- Total crédits acquis : ${data.totalCredits} ECTS
- Matières et moyennes : ${data.matieres.map((m) => `${m.nom} (${m.moyenne.toFixed(2)}/20 - ${m.valide ? 'Validée' : 'Non validée'})`).join('; ')}

Structure ta réponse avec :
1. Un bilan global et félicitations ou mise en garde
2. Points forts (matières les mieux réussies)
3. Matières à consolider
4. Deux conseils méthodologiques pour le semestre suivant.`;

  const aiText = await callGemini(
    prompt,
    'Tu es le président du jury pédagogique universitaire. Adopte un ton constructif, motivant et rigoureux.'
  );

  if (aiText) return aiText;

  // Fallback synthétiseur
  const pointsForts = data.matieres.filter((m) => m.moyenne >= 14).map((m) => `${m.nom} (${m.moyenne.toFixed(2)}/20)`);
  const matieresFaibles = data.matieres.filter((m) => m.moyenne < 10).map((m) => `${m.nom} (${m.moyenne.toFixed(2)}/20)`);

  let resume = `### Bilan Pédagogique - ${data.nom}\n\n`;
  if (data.valide) {
    resume += `🎓 **Semestre Validé** avec une moyenne générale de **${data.moyenneGenerale.toFixed(2)}/20** (${data.mention}). Félicitations pour ce travail sérieux !\n\n`;
  } else {
    resume += `⚠️ **Semestre Non Validé** avec une moyenne générale de **${data.moyenneGenerale.toFixed(2)}/20**. Un rattrapage sera nécessaire pour valider les UE défaillantes.\n\n`;
  }

  if (pointsForts.length > 0) {
    resume += `**Points forts :** Excellente maîtrise démontrée dans ${pointsForts.join(', ')}.\n\n`;
  }

  if (matieresFaibles.length > 0) {
    resume += `**Axe d'effort prioritaire :** Des difficultés sont identifiées dans ${matieresFaibles.join(', ')}. Une révision approfondie des concepts clés est vivement recommandée.\n\n`;
  } else {
    resume += `**Homogénéité :** Toutes les matières de l'unité d'enseignement ont été validées avec succès.\n\n`;
  }

  resume += `**Conseils de progression :**\n- Consolider le travail en groupe et les projets pratiques.\n- Anticiper les révisions des examens terminaux dès la mi-semestre.`;

  return resume;
}

/**
 * 4. Aide à la rédaction / reformulation d'annonces
 */
export async function generateAnnouncementDraftAI(params: {
  sujet: string;
  destinataires: string;
  ton?: 'professionnel' | 'urgent' | 'encourageant';
}): Promise<{ titre: string; contenu: string }> {
  const prompt = `Rédige une annonce universitaire officielle pour un enseignant ou administrateur.
Sujet: "${params.sujet}"
Destinataires: "${params.destinataires}"
Ton souhaité: "${params.ton || 'professionnel'}"

Renvoie exactement un JSON avec deux champs:
{
  "titre": "Titre percutant et clair",
  "contenu": "Corps du message structuré, poli, avec date, salle ou consignes si mentionnées."
}`;

  const aiText = await callGemini(prompt);
  if (aiText) {
    try {
      const cleanJson = aiText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed.titre && parsed.contenu) return parsed;
    } catch {
      // ignore JSON parse error
    }
  }

  // Fallback
  return {
    titre: `[Information Pédagogique] ${params.sujet.slice(0, 50)}`,
    contenu: `Chers étudiants de ${params.destinataires},\n\nNous vous informons de la mise à jour suivante concernant : ${params.sujet}.\n\nMerci de prendre vos dispositions en conséquence et de consulter régulièrement votre emploi du temps sur UniConnect.\n\nCordialement,\nLa Direction des Études`,
  };
}
