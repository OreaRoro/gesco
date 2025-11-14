export interface FraisScolarite {
  id: number;
  niveau_id: number;
  annee_scolaire_id: number;
  montant: number;
  frais_inscription: number;
  frais_dossier: number;
  created_at: string;
  niveau?: {
    id: number;
    nom: string;
    cycle: string;
  };
  annee_scolaire?: {
    id: number;
    annee: string;
  };
}

export interface FraisScolariteCreateRequest {
  niveau_id: number;
  annee_scolaire_id?: number;
  montant: number;
  frais_inscription: number;
  frais_dossier: number;
}

export interface PaiementFrais {
  id: number;
  eleve_id: number;
  inscription_id: number;
  annee_scolaire_id: number;
  mois: string;
  montant: number;
  date_paiement: string;
  mode_paiement: "especes" | "cheque" | "virement" | "mobile";
  reference_paiement?: string;
  statut: "paye" | "impaye" | "partiel";
  encaisse_par: number;
  created_at: string;
  eleve?: {
    id: number;
    nom: string;
    prenom: string;
    matricule: string;
  };
  inscription?: {
    id: number;
    classe_id: number;
    classe?: {
      nom: string;
    };
  };
}

export interface PaiementFraisCreateRequest {
  eleve_id: number;
  inscription_id: number;
  annee_scolaire_id: number;
  mois: string;
  montant: number;
  date_paiement: string;
  mode_paiement: "especes" | "cheque" | "virement" | "mobile";
  reference_paiement?: string;
  statut: "paye" | "impaye" | "partiel";
}

export interface StatistiquesPaiements {
  totalPaye: number;
  totalImpaye: number;
  tauxPaiement: number;
  paiementsParMois: { [mois: string]: number };
  paiementsParMode: { [mode: string]: number };
}
