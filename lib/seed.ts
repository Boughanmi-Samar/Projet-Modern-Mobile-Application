import connectToDatabase from './mongodb';
import { User } from '@/models/User';
import { Department } from '@/models/Department';
import { Filiere } from '@/models/Filiere';
import { Group } from '@/models/Group';
import { Matiere } from '@/models/Matiere';
import { Affectation } from '@/models/Affectation';
import { Salle } from '@/models/Salle';
import { Seance } from '@/models/Seance';
import { Note } from '@/models/Note';
import { Absence } from '@/models/Absence';
import { Justificatif } from '@/models/Justificatif';
import { Annonce } from '@/models/Annonce';
import { hashPassword } from './auth';

export async function seedDatabase(force: boolean = false) {
  await connectToDatabase();

  const userCount = await User.countDocuments();
  if (userCount > 0 && !force) {
    return { success: true, message: 'La base de données contient déjà des données.' };
  }

  // Clear existing collections if forcing
  if (force) {
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Filiere.deleteMany({}),
      Group.deleteMany({}),
      Matiere.deleteMany({}),
      Affectation.deleteMany({}),
      Salle.deleteMany({}),
      Seance.deleteMany({}),
      Note.deleteMany({}),
      Absence.deleteMany({}),
      Justificatif.deleteMany({}),
      Annonce.deleteMany({}),
    ]);
  }

  // 1. Départements
  const depInfo = await Department.create({
    nom: 'Informatique et Technologies Numériques',
    code: 'INFO',
    description: 'Département des sciences informatiques, génie logiciel et intelligence artificielle',
  });

  const depGE = await Department.create({
    nom: 'Génie Électrique et Systèmes Électroniques',
    code: 'GE',
    description: 'Département de télécommunications, IoT et systèmes embarqués',
  });

  // 2. Filières
  const filiereGL = await Filiere.create({
    nom: 'Génie Logiciel et Systèmes d’Information',
    niveau: 'Cycle Ingénieur 4ème Année',
    departement: depInfo._id,
  });

  const filiereSE = await Filiere.create({
    nom: 'Systèmes Embarqués et Objets Connectés',
    niveau: 'Cycle Ingénieur 4ème Année',
    departement: depGE._id,
  });

  // 3. Groupes
  const groupGL1 = await Group.create({
    nom: '4ALINFO-GL1',
    effectif: 28,
    filiere: filiereGL._id,
  });

  const groupGL2 = await Group.create({
    nom: '4ALINFO-GL2',
    effectif: 25,
    filiere: filiereGL._id,
  });

  const groupSE1 = await Group.create({
    nom: '4ALINFO-SE1',
    effectif: 22,
    filiere: filiereSE._id,
  });

  // 4. Utilisateurs
  const defaultPassword = await hashPassword('admin123');
  const profPassword = await hashPassword('prof123');
  const studentPassword = await hashPassword('etudiant123');

  // Admin
  const admin = await User.create({
    nom: 'Karim Mansouri',
    email: 'admin@uniconnect.tn',
    password: defaultPassword,
    role: 'admin',
    telephone: '+216 71 100 200',
  });

  // Enseignants
  const profDupont = await User.create({
    nom: 'Dr. Mehdi Ben Salem',
    email: 'prof.dupont@uniconnect.tn',
    password: profPassword,
    role: 'teacher',
    telephone: '+216 98 123 456',
  });

  const profBenali = await User.create({
    nom: 'Pr. Sonia Khemir',
    email: 'prof.benali@uniconnect.tn',
    password: profPassword,
    role: 'teacher',
    telephone: '+216 98 654 321',
  });

  // Étudiants (affiliés au groupe 4ALINFO-GL1)
  const studentAli = await User.create({
    nom: 'Ali Trabelsi',
    email: 'etudiant.ali@uniconnect.tn',
    password: studentPassword,
    role: 'student',
    groupe: groupGL1._id,
    telephone: '+216 55 111 222',
  });

  const studentSarah = await User.create({
    nom: 'Sarah Bouazizi',
    email: 'etudiant.sarah@uniconnect.tn',
    password: studentPassword,
    role: 'student',
    groupe: groupGL1._id,
    telephone: '+216 55 333 444',
  });

  const studentYoussef = await User.create({
    nom: 'Youssef Gharbi',
    email: 'etudiant.youssef@uniconnect.tn',
    password: studentPassword,
    role: 'student',
    groupe: groupGL1._id,
    telephone: '+216 55 555 666',
  });

  const studentNour = await User.create({
    nom: 'Nour Hammami',
    email: 'etudiant.nour@uniconnect.tn',
    password: studentPassword,
    role: 'student',
    groupe: groupGL1._id,
    telephone: '+216 55 777 888',
  });

  // 5. Matières
  const matWeb = await Matiere.create({
    nom: 'Développement Web Avancé & Mobile (PWA/Next.js)',
    code: 'GL-401',
    coefficient: 4,
    credits: 6,
    semestre: 'S1',
    filiere: filiereGL._id,
  });

  const matAlgo = await Matiere.create({
    nom: 'Algorithmique Avancée & Graphes',
    code: 'GL-402',
    coefficient: 3,
    credits: 5,
    semestre: 'S1',
    filiere: filiereGL._id,
  });

  const matNoSQL = await Matiere.create({
    nom: 'Bases de Données NoSQL & MongoDB',
    code: 'GL-403',
    coefficient: 3,
    credits: 5,
    semestre: 'S1',
    filiere: filiereGL._id,
  });

  const matIA = await Matiere.create({
    nom: 'Intelligence Artificielle & Machine Learning',
    code: 'GL-404',
    coefficient: 3,
    credits: 4,
    semestre: 'S1',
    filiere: filiereGL._id,
  });

  // 6. Affectations
  await Affectation.create({
    anneeUniversitaire: '2025-2026',
    matiere: matWeb._id,
    enseignant: profDupont._id,
    groupe: groupGL1._id,
  });

  await Affectation.create({
    anneeUniversitaire: '2025-2026',
    matiere: matNoSQL._id,
    enseignant: profDupont._id,
    groupe: groupGL1._id,
  });

  await Affectation.create({
    anneeUniversitaire: '2025-2026',
    matiere: matAlgo._id,
    enseignant: profBenali._id,
    groupe: groupGL1._id,
  });

  await Affectation.create({
    anneeUniversitaire: '2025-2026',
    matiere: matIA._id,
    enseignant: profBenali._id,
    groupe: groupGL1._id,
  });

  // 7. Salles
  const salleLabo1 = await Salle.create({
    nom: 'Labo Info 301',
    capacite: 32,
    type: 'Laboratoire Informatique',
  });

  const salleAmphi = await Salle.create({
    nom: 'Amphi Alan Turing',
    capacite: 160,
    type: 'Amphithéâtre',
  });

  const salle204 = await Salle.create({
    nom: 'Salle 204 (TD)',
    capacite: 40,
    type: 'Salle de cours/TD',
  });

  // 8. Séances (Emploi du temps de 4ALINFO-GL1)
  const seanceWebLundi = await Seance.create({
    jour: 'Lundi',
    heureDebut: '08:30',
    heureFin: '11:45',
    matiere: matWeb._id,
    enseignant: profDupont._id,
    groupe: groupGL1._id,
    salle: salleLabo1._id,
    typeSeance: 'TP',
  });

  const seanceAlgoMardi = await Seance.create({
    jour: 'Mardi',
    heureDebut: '08:30',
    heureFin: '11:45',
    matiere: matAlgo._id,
    enseignant: profBenali._id,
    groupe: groupGL1._id,
    salle: salleAmphi._id,
    typeSeance: 'Cours',
  });

  const seanceNoSQLMercredi = await Seance.create({
    jour: 'Mercredi',
    heureDebut: '13:30',
    heureFin: '16:45',
    matiere: matNoSQL._id,
    enseignant: profDupont._id,
    groupe: groupGL1._id,
    salle: salleLabo1._id,
    typeSeance: 'TP',
  });

  const seanceIAJeudi = await Seance.create({
    jour: 'Jeudi',
    heureDebut: '10:00',
    heureFin: '12:00',
    matiere: matIA._id,
    enseignant: profBenali._id,
    groupe: groupGL1._id,
    salle: salle204._id,
    typeSeance: 'TD',
  });

  // 9. Notes
  // Ali (très bon étudiant)
  await Note.create({ valeur: 16.5, type: 'DS', etudiant: studentAli._id, matiere: matWeb._id });
  await Note.create({ valeur: 18.0, type: 'TP', etudiant: studentAli._id, matiere: matWeb._id });
  await Note.create({ valeur: 15.0, type: 'DS', etudiant: studentAli._id, matiere: matAlgo._id });
  await Note.create({ valeur: 17.5, type: 'TP', etudiant: studentAli._id, matiere: matNoSQL._id });

  // Sarah (excellente)
  await Note.create({ valeur: 18.5, type: 'DS', etudiant: studentSarah._id, matiere: matWeb._id });
  await Note.create({ valeur: 19.0, type: 'TP', etudiant: studentSarah._id, matiere: matWeb._id });
  await Note.create({ valeur: 17.0, type: 'DS', etudiant: studentSarah._id, matiere: matAlgo._id });

  // Youssef (étudiant en difficulté / risque pour tester la détection IA)
  await Note.create({ valeur: 6.5, type: 'DS', etudiant: studentYoussef._id, matiere: matWeb._id });
  await Note.create({ valeur: 8.0, type: 'TP', etudiant: studentYoussef._id, matiere: matWeb._id });
  await Note.create({ valeur: 7.0, type: 'DS', etudiant: studentYoussef._id, matiere: matAlgo._id });

  // Nour (moyenne)
  await Note.create({ valeur: 11.5, type: 'DS', etudiant: studentNour._id, matiere: matWeb._id });
  await Note.create({ valeur: 12.0, type: 'TP', etudiant: studentNour._id, matiere: matWeb._id });

  // 10. Absences
  // Ali: 1 absence justifiée
  const absAli = await Absence.create({
    date: new Date('2026-10-15'),
    statut: 'absent',
    justifiee: true,
    etudiant: studentAli._id,
    seance: seanceWebLundi._id,
    remarque: 'Certificat médical fourni',
  });

  await Justificatif.create({
    motif: 'Consultation médicale d’urgence pour état grippal aigu',
    pieceJointe: 'certificat_medical_dr_karoui_15_10_2026.pdf',
    decision: 'valide',
    absence: absAli._id,
    commentaireEnseignant: 'Justificatif conforme et validé',
  });

  // Youssef: plusieurs absences non justifiées (> 25% taux d'absence) pour tester alertes et IA
  await Absence.create({
    date: new Date('2026-10-06'),
    statut: 'absent',
    justifiee: false,
    etudiant: studentYoussef._id,
    seance: seanceWebLundi._id,
  });

  await Absence.create({
    date: new Date('2026-10-13'),
    statut: 'absent',
    justifiee: false,
    etudiant: studentYoussef._id,
    seance: seanceWebLundi._id,
  });

  const absYoussefPending = await Absence.create({
    date: new Date('2026-10-20'),
    statut: 'absent',
    justifiee: false,
    etudiant: studentYoussef._id,
    seance: seanceWebLundi._id,
  });

  await Justificatif.create({
    motif: 'Panne de transport ferroviaire sur la ligne banlieue sud',
    pieceJointe: 'attestation_retard_sncft.pdf',
    decision: 'en_attente',
    absence: absYoussefPending._id,
  });

  await Absence.create({
    date: new Date('2026-10-27'),
    statut: 'retard',
    justifiee: false,
    etudiant: studentYoussef._id,
    seance: seanceAlgoMardi._id,
    remarque: 'Arrivée avec 35 minutes de retard',
  });

  // 11. Annonces
  await Annonce.create({
    titre: 'Bienvenue sur UniConnect - Année Universitaire 2025/2026',
    contenu:
      'Chers étudiants et enseignants, l’application UniConnect centralise l’ensemble de vos activités pédagogiques (emploi du temps, notes, émargement hors ligne et justificatifs). Installez l’application sur votre smartphone pour recevoir les alertes.',
    portee: 'generale',
    auteur: admin._id,
    priorite: 'importante',
    date: new Date('2026-09-15'),
  });

  await Annonce.create({
    titre: 'Projet PWA Next.js : Consignes de rendu du Jalon 1',
    contenu:
      'Pour le groupe 4ALINFO-GL1, le rendu du premier jalon concernant l’architecture Server Actions et le mode hors ligne (IndexedDB) est fixé pour vendredi prochain à 23h59.',
    portee: 'groupe',
    auteur: profDupont._id,
    groupe: groupGL1._id,
    priorite: 'urgente',
    date: new Date('2026-10-28'),
  });

  await Annonce.create({
    titre: 'Séance de rattrapage en Algorithmique Avancée',
    contenu:
      'Une séance supplémentaire de résolution des problèmes de chemin le plus court aura lieu ce jeudi de 14h à 16h en Amphi Turing.',
    portee: 'groupe',
    auteur: profBenali._id,
    groupe: groupGL1._id,
    priorite: 'normale',
    date: new Date('2026-11-02'),
  });

  console.log('[Seed] Database successfully seeded with full academic dataset!');
  return { success: true, message: 'Base de données initialisée avec succès avec données réalistes !' };
}
