/**
 * Script de seed autonome pour MongoDB local
 * Usage: node scripts/seed-local.mjs
 *
 * Se connecte à mongodb://127.0.0.1:27017/uniconnectdb et insère toutes les données de démonstration.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uniconnectdb';

// ─── Schemas ───────────────────────────────────────────────────────────────

const UserSchema = new mongoose.Schema({
  nom: String,
  email: { type: String, unique: true },
  motDePasse: String,
  role: { type: String, enum: ['admin', 'teacher', 'student'] },
  groupe: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  telephone: String,
  actif: { type: Boolean, default: true },
}, { timestamps: true });

const DepartmentSchema = new mongoose.Schema({ nom: String, code: String, description: String }, { timestamps: true });
const FiliereSchema = new mongoose.Schema({ nom: String, niveau: String, departement: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' } }, { timestamps: true });
const GroupSchema = new mongoose.Schema({ nom: String, filiere: { type: mongoose.Schema.Types.ObjectId, ref: 'Filiere' }, annee: Number, capacite: Number }, { timestamps: true });
const MatiereSchema = new mongoose.Schema({ nom: String, code: String, coefficientCC: Number, coefficientExam: Number, volumeHoraire: Number, filiere: { type: mongoose.Schema.Types.ObjectId, ref: 'Filiere' } }, { timestamps: true });
const AffectationSchema = new mongoose.Schema({ enseignant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, matiere: { type: mongoose.Schema.Types.ObjectId, ref: 'Matiere' }, groupe: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' }, anneeUniversitaire: String }, { timestamps: true });
const SalleSchema = new mongoose.Schema({ nom: String, capacite: Number, type: String }, { timestamps: true });
const SeanceSchema = new mongoose.Schema({ matiere: { type: mongoose.Schema.Types.ObjectId, ref: 'Matiere' }, enseignant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, groupe: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' }, salle: { type: mongoose.Schema.Types.ObjectId, ref: 'Salle' }, jourSemaine: Number, heureDebut: String, heureFin: String, type: String, couleur: String }, { timestamps: true });
const NoteSchema = new mongoose.Schema({ etudiant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, matiere: { type: mongoose.Schema.Types.ObjectId, ref: 'Matiere' }, enseignant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, noteCC: Number, noteExam: Number, noteFinal: Number, appreciation: String, semestre: String }, { timestamps: true });
const AbsenceSchema = new mongoose.Schema({ etudiant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, seance: { type: mongoose.Schema.Types.ObjectId, ref: 'Seance' }, date: Date, statut: { type: String, enum: ['present', 'absent', 'retard'] }, justifiee: { type: Boolean, default: false }, remarque: String }, { timestamps: true });
const JustificatifSchema = new mongoose.Schema({ absence: { type: mongoose.Schema.Types.ObjectId, ref: 'Absence' }, motif: String, pieceJointe: String, decision: { type: String, enum: ['en_attente', 'valide', 'refuse'], default: 'en_attente' }, commentaireEnseignant: String, dateSoumission: { type: Date, default: Date.now } }, { timestamps: true });
const AnnonceSchema = new mongoose.Schema({ titre: String, contenu: String, auteur: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, portee: String, groupe: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' }, matiere: { type: mongoose.Schema.Types.ObjectId, ref: 'Matiere' }, priorite: String }, { timestamps: true });

// ─── Models ────────────────────────────────────────────────────────────────

const User = mongoose.model('User', UserSchema);
const Department = mongoose.model('Department', DepartmentSchema);
const Filiere = mongoose.model('Filiere', FiliereSchema);
const Group = mongoose.model('Group', GroupSchema);
const Matiere = mongoose.model('Matiere', MatiereSchema);
const Affectation = mongoose.model('Affectation', AffectationSchema);
const Salle = mongoose.model('Salle', SalleSchema);
const Seance = mongoose.model('Seance', SeanceSchema);
const Note = mongoose.model('Note', NoteSchema);
const Absence = mongoose.model('Absence', AbsenceSchema);
const Justificatif = mongoose.model('Justificatif', JustificatifSchema);
const Annonce = mongoose.model('Annonce', AnnonceSchema);

// ─── Seed ──────────────────────────────────────────────────────────────────

async function hashPwd(plain) {
  return bcrypt.hash(plain, 12);
}

async function seed() {
  console.log(`\n🌱  Connexion à ${MONGO_URI} ...\n`);
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  console.log('✅  Connecté à MongoDB.\n');

  // Vider les collections
  await Promise.all([
    User.deleteMany({}), Department.deleteMany({}), Filiere.deleteMany({}),
    Group.deleteMany({}), Matiere.deleteMany({}), Affectation.deleteMany({}),
    Salle.deleteMany({}), Seance.deleteMany({}), Note.deleteMany({}),
    Absence.deleteMany({}), Justificatif.deleteMany({}), Annonce.deleteMany({}),
  ]);
  console.log('🗑️   Collections vidées.\n');

  // 1. Départements
  const depInfo = await Department.create({ nom: 'Informatique et Technologies Numériques', code: 'INFO', description: 'Génie logiciel et IA' });
  const depGE   = await Department.create({ nom: 'Génie Électrique et Systèmes Électroniques', code: 'GE', description: 'Télécom, IoT, embarqué' });
  console.log('✅  Départements créés.');

  // 2. Filières
  const filiereGL  = await Filiere.create({ nom: 'Génie Logiciel et Systèmes d\'Information', niveau: 'Cycle Ingénieur 4ème Année', departement: depInfo._id });
  const filiereIA  = await Filiere.create({ nom: 'Intelligence Artificielle et Data Science', niveau: 'Cycle Ingénieur 4ème Année', departement: depInfo._id });
  const filiereGE  = await Filiere.create({ nom: 'Génie Électronique et Systèmes Embarqués', niveau: 'Cycle Ingénieur 4ème Année', departement: depGE._id });
  console.log('✅  Filières créées.');

  // 3. Groupes
  const groupeGL1 = await Group.create({ nom: 'GL-4-A', filiere: filiereGL._id, annee: 4, capacite: 30 });
  const groupeGL2 = await Group.create({ nom: 'GL-4-B', filiere: filiereGL._id, annee: 4, capacite: 30 });
  const groupeIA1 = await Group.create({ nom: 'IA-4-A', filiere: filiereIA._id, annee: 4, capacite: 25 });
  const groupeGE1 = await Group.create({ nom: 'GE-4-A', filiere: filiereGE._id, annee: 4, capacite: 28 });
  console.log('✅  Groupes créés.');

  // 4. Utilisateurs
  const [pwAdmin, pwProf, pwEtu] = await Promise.all([hashPwd('admin123'), hashPwd('prof123'), hashPwd('etudiant123')]);

  const admin = await User.create({ nom: 'Administrateur UniConnect', email: 'admin@uniconnect.tn', motDePasse: pwAdmin, role: 'admin' });
  const prof1  = await User.create({ nom: 'Prof. Jean Dupont', email: 'prof.dupont@uniconnect.tn', motDePasse: pwProf, role: 'teacher', telephone: '+216 71 234 567' });
  const prof2  = await User.create({ nom: 'Prof. Sami Benali', email: 'prof.benali@uniconnect.tn', motDePasse: pwProf, role: 'teacher', telephone: '+216 71 345 678' });
  const etu1   = await User.create({ nom: 'Ali Ben Salah', email: 'etudiant.ali@uniconnect.tn', motDePasse: pwEtu, role: 'student', groupe: groupeGL1._id });
  const etu2   = await User.create({ nom: 'Sarah Trabelsi', email: 'etudiant.sarah@uniconnect.tn', motDePasse: pwEtu, role: 'student', groupe: groupeGL1._id });
  const etu3   = await User.create({ nom: 'Youssef Maaroufi', email: 'etudiant.youssef@uniconnect.tn', motDePasse: pwEtu, role: 'student', groupe: groupeGL1._id });
  const etu4   = await User.create({ nom: 'Nour Khelifi', email: 'etudiant.nour@uniconnect.tn', motDePasse: pwEtu, role: 'student', groupe: groupeGL2._id });
  console.log('✅  Utilisateurs créés.');

  // 5. Matières
  const matDev   = await Matiere.create({ nom: 'Développement Web Avancé', code: 'DWA-401', coefficientCC: 0.4, coefficientExam: 0.6, volumeHoraire: 42, filiere: filiereGL._id });
  const matMobile = await Matiere.create({ nom: 'Développement Mobile', code: 'DM-402', coefficientCC: 0.4, coefficientExam: 0.6, volumeHoraire: 42, filiere: filiereGL._id });
  const matIA    = await Matiere.create({ nom: 'Intelligence Artificielle', code: 'IA-403', coefficientCC: 0.3, coefficientExam: 0.7, volumeHoraire: 56, filiere: filiereGL._id });
  const matSec   = await Matiere.create({ nom: 'Sécurité Informatique', code: 'SEC-404', coefficientCC: 0.4, coefficientExam: 0.6, volumeHoraire: 42, filiere: filiereGL._id });
  const matCloud = await Matiere.create({ nom: 'Cloud Computing & DevOps', code: 'CLD-405', coefficientCC: 0.5, coefficientExam: 0.5, volumeHoraire: 56, filiere: filiereGL._id });
  console.log('✅  Matières créées.');

  // 6. Affectations
  await Affectation.create({ enseignant: prof1._id, matiere: matDev._id, groupe: groupeGL1._id, anneeUniversitaire: '2025-2026' });
  await Affectation.create({ enseignant: prof1._id, matiere: matMobile._id, groupe: groupeGL1._id, anneeUniversitaire: '2025-2026' });
  await Affectation.create({ enseignant: prof2._id, matiere: matIA._id, groupe: groupeGL1._id, anneeUniversitaire: '2025-2026' });
  await Affectation.create({ enseignant: prof2._id, matiere: matSec._id, groupe: groupeGL1._id, anneeUniversitaire: '2025-2026' });
  await Affectation.create({ enseignant: prof1._id, matiere: matCloud._id, groupe: groupeGL2._id, anneeUniversitaire: '2025-2026' });
  console.log('✅  Affectations créées.');

  // 7. Salles
  const salleA1 = await Salle.create({ nom: 'Amphi A', capacite: 120, type: 'amphitheatre' });
  const salleB2 = await Salle.create({ nom: 'Salle B-204', capacite: 35, type: 'td' });
  const salleC3 = await Salle.create({ nom: 'Labo Info 3', capacite: 30, type: 'tp' });
  const salleD4 = await Salle.create({ nom: 'Salle D-101', capacite: 40, type: 'cours' });
  console.log('✅  Salles créées.');

  // 8. Séances (emploi du temps)
  const seance1 = await Seance.create({ matiere: matDev._id, enseignant: prof1._id, groupe: groupeGL1._id, salle: salleD4._id, jourSemaine: 1, heureDebut: '08:00', heureFin: '10:00', type: 'cours', couleur: '#03c9d7' });
  const seance2 = await Seance.create({ matiere: matMobile._id, enseignant: prof1._id, groupe: groupeGL1._id, salle: salleC3._id, jourSemaine: 1, heureDebut: '10:30', heureFin: '12:30', type: 'tp', couleur: '#06b6d4' });
  const seance3 = await Seance.create({ matiere: matIA._id, enseignant: prof2._id, groupe: groupeGL1._id, salle: salleA1._id, jourSemaine: 2, heureDebut: '08:00', heureFin: '10:00', type: 'cours', couleur: '#8b5cf6' });
  const seance4 = await Seance.create({ matiere: matSec._id, enseignant: prof2._id, groupe: groupeGL1._id, salle: salleB2._id, jourSemaine: 3, heureDebut: '14:00', heureFin: '16:00', type: 'td', couleur: '#f59e0b' });
  const seance5 = await Seance.create({ matiere: matCloud._id, enseignant: prof1._id, groupe: groupeGL2._id, salle: salleC3._id, jourSemaine: 4, heureDebut: '10:00', heureFin: '12:00', type: 'tp', couleur: '#10b981' });
  console.log('✅  Séances créées.');

  // 9. Notes
  const noteData = [
    { etudiant: etu1._id, matiere: matDev._id, enseignant: prof1._id, noteCC: 15.5, noteExam: 14, semestre: 'S7' },
    { etudiant: etu1._id, matiere: matMobile._id, enseignant: prof1._id, noteCC: 16, noteExam: 15.5, semestre: 'S7' },
    { etudiant: etu1._id, matiere: matIA._id, enseignant: prof2._id, noteCC: 13, noteExam: 12.5, semestre: 'S7' },
    { etudiant: etu2._id, matiere: matDev._id, enseignant: prof1._id, noteCC: 18, noteExam: 17, semestre: 'S7' },
    { etudiant: etu2._id, matiere: matMobile._id, enseignant: prof1._id, noteCC: 17, noteExam: 16, semestre: 'S7' },
    { etudiant: etu3._id, matiere: matDev._id, enseignant: prof1._id, noteCC: 10, noteExam: 9.5, semestre: 'S7' },
    { etudiant: etu3._id, matiere: matIA._id, enseignant: prof2._id, noteCC: 8, noteExam: 7, semestre: 'S7' },
    { etudiant: etu4._id, matiere: matCloud._id, enseignant: prof1._id, noteCC: 14, noteExam: 13, semestre: 'S7' },
  ];
  for (const nd of noteData) {
    const noteFinal = nd.noteCC * (nd.matiere === matIA._id ? 0.3 : 0.4) + nd.noteExam * (nd.matiere === matIA._id ? 0.7 : 0.6);
    await Note.create({ ...nd, noteFinal: Math.round(noteFinal * 100) / 100, appreciation: noteFinal >= 16 ? 'Très Bien' : noteFinal >= 14 ? 'Bien' : noteFinal >= 12 ? 'Assez Bien' : noteFinal >= 10 ? 'Passable' : 'Insuffisant' });
  }
  console.log('✅  Notes créées.');

  // 10. Absences
  const today = new Date();
  const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return d; };

  // Ali - quelques absences
  const absAli1 = await Absence.create({ etudiant: etu1._id, seance: seance1._id, date: daysAgo(14), statut: 'absent', justifiee: false });
  const absAli2 = await Absence.create({ etudiant: etu1._id, seance: seance3._id, date: daysAgo(7), statut: 'retard', justifiee: false });
  await Absence.create({ etudiant: etu1._id, seance: seance2._id, date: daysAgo(3), statut: 'present' });

  // Youssef - beaucoup d'absences (risque)
  const absYou1 = await Absence.create({ etudiant: etu3._id, seance: seance1._id, date: daysAgo(21), statut: 'absent', justifiee: false });
  const absYou2 = await Absence.create({ etudiant: etu3._id, seance: seance2._id, date: daysAgo(14), statut: 'absent', justifiee: true });
  const absYou3 = await Absence.create({ etudiant: etu3._id, seance: seance3._id, date: daysAgo(7), statut: 'absent', justifiee: false });
  const absYou4 = await Absence.create({ etudiant: etu3._id, seance: seance4._id, date: daysAgo(3), statut: 'absent', justifiee: false });
  const absYou5 = await Absence.create({ etudiant: etu3._id, seance: seance1._id, date: daysAgo(28), statut: 'retard', justifiee: false });

  // Sarah - présente
  await Absence.create({ etudiant: etu2._id, seance: seance1._id, date: daysAgo(7), statut: 'present' });
  await Absence.create({ etudiant: etu2._id, seance: seance2._id, date: daysAgo(3), statut: 'present' });
  console.log('✅  Absences créées.');

  // 11. Justificatifs
  await Justificatif.create({ absence: absAli1._id, motif: 'Consultation médicale urgente — certificat du Dr. Karoui joint', pieceJointe: 'certificat_medical_ali.pdf', decision: 'en_attente', dateSoumission: daysAgo(12) });
  await Justificatif.create({ absence: absYou1._id, motif: 'Problème de transport — grève des bus régionaux', pieceJointe: 'attestation_greve.pdf', decision: 'valide', commentaireEnseignant: 'Justificatif conforme, absence régularisée.', dateSoumission: daysAgo(19) });
  await Justificatif.create({ absence: absYou3._id, motif: 'Fièvre — 39°C — repos médical prescrit', pieceJointe: 'ordonnance_youssef.pdf', decision: 'en_attente', dateSoumission: daysAgo(5) });
  console.log('✅  Justificatifs créés.');

  // 12. Annonces
  await Annonce.create({ titre: 'Rappel : Dépôt des rapports de PFE', contenu: 'Les étudiants en 4ème année sont priés de déposer leur rapport de PFE avant le 15 décembre 2025. Tout retard entraînera une pénalité de note.', auteur: admin._id, portee: 'global', priorite: 'haute' });
  await Annonce.create({ titre: 'Examen de Développement Web — Planning', contenu: 'L\'examen de DWA-401 aura lieu le Lundi 20 Janvier 2026 de 08h00 à 11h00 en Amphi A. Documents non autorisés.', auteur: prof1._id, portee: 'groupe', groupe: groupeGL1._id, matiere: matDev._id, priorite: 'haute' });
  await Annonce.create({ titre: 'TP Annulé — Labo Info 3 (vendredi)', contenu: 'Le TP de Développement Mobile du vendredi est annulé suite à une panne du réseau informatique. Un rattrapage sera planifié.', auteur: prof1._id, portee: 'groupe', groupe: groupeGL1._id, matiere: matMobile._id, priorite: 'normale' });
  await Annonce.create({ titre: 'Bienvenue sur UniConnect PWA', contenu: 'La plateforme UniConnect est désormais opérationnelle. Vous pouvez consulter votre emploi du temps, vos notes et soumettre des justificatifs d\'absence directement depuis votre téléphone.', auteur: admin._id, portee: 'global', priorite: 'normale' });
  console.log('✅  Annonces créées.');

  console.log('\n🎉  Seed terminé avec succès !\n');
  console.log('  Comptes créés :');
  console.log('  ┌─────────────┬─────────────────────────────────────┬────────────┐');
  console.log('  │ Rôle        │ Email                               │ MDP        │');
  console.log('  ├─────────────┼─────────────────────────────────────┼────────────┤');
  console.log('  │ Admin       │ admin@uniconnect.tn                 │ admin123   │');
  console.log('  │ Enseignant  │ prof.dupont@uniconnect.tn           │ prof123    │');
  console.log('  │ Enseignant  │ prof.benali@uniconnect.tn           │ prof123    │');
  console.log('  │ Étudiant    │ etudiant.ali@uniconnect.tn          │ etudiant123│');
  console.log('  │ Étudiant    │ etudiant.sarah@uniconnect.tn        │ etudiant123│');
  console.log('  │ Étud risque │ etudiant.youssef@uniconnect.tn      │ etudiant123│');
  console.log('  │ Étudiant    │ etudiant.nour@uniconnect.tn         │ etudiant123│');
  console.log('  └─────────────┴─────────────────────────────────────┴────────────┘\n');

  await mongoose.disconnect();
  console.log('🔌  Déconnecté de MongoDB.');
}

seed().catch((err) => {
  console.error('\n❌  Erreur durant le seed :', err.message);
  process.exit(1);
});
