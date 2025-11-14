export interface PaiementCreateRequest {
  inscription_id: number;
  eleve_id: number;
  annee_scolaire_id: number;
  mois: string;
  montant: number;
  date_paiement: string;
  mode_paiement: "especes" | "cheque" | "virement" | "mobile";
  reference_paiement?: string;
  statut: "paye" | "impaye" | "partiel";
}

export interface Paiement {
  id: number;
  inscription_id: number;
  eleve_id: number;
  annee_scolaire_id: number;
  mois: string;
  montant: number;
  date_paiement: string;
  mode_paiement: string;
  reference_paiement?: string;
  statut: string;
  encaisse_par?: number;
  created_at: string;
}
