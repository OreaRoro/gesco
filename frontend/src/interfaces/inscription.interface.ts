export interface Inscription {
  id: number;
  eleve_id: number;
  classe_id: number;
  annee_scolaire_id: number;
  date_inscription: string;
  montant_inscription: number;
  montant_paye: number;
  statut: "inscrit" | "reinscrit" | "transfere" | "abandon";
  created_at?: string;

  // Relations imbriquées
  eleve: {
    id: number;
    nom: string;
    prenom: string;
    matricule: string;
    date_naissance?: string;
    sexe?: "M" | "F";
    photo: string;
  };

  classe: {
    id: number;
    nom: string;
    capacite_max?: number;
    niveau: {
      id: number;
      nom: string;
      cycle: string;
    };
  };

  annee_scolaire: {
    id: number;
    annee: string;
    date_debut: string;
    date_fin: string;
    statut: string;
  };
}

export interface InscriptionFormData {
  annee_scolaire_id: number;
  classe_id: number;
  date_inscription: string;
  frais_inscription: number;
  frais_scolarite: number;
  remises: number;
  modalites_paiement: string;
  observations?: string;
}

export interface InscriptionCreateRequest {
  eleve_id: number;
  classe_id: number;
  annee_scolaire_id: number;
  date_inscription: string;
  montant_inscription: number;
  montant_paye?: number;
  statut: "inscrit" | "reinscrit" | "transfere" | "abandon";
  frais_inscription: number;
  remises: number;
  frais_scolarite?: number;
  modalites_paiement: string;
  observations: string;
}

export interface InscriptionUpdateRequest
  extends Partial<InscriptionCreateRequest> {
  id: number;
}

export interface InscriptionFilter {
  annee_scolaire_id?: number;
  statut?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

// Interface pour la réponse paginée
export interface InscriptionsResponse {
  status: string;
  data: {
    inscriptions: Inscription[];
    pagination?: {
      current_page: number;
      per_page: number;
      total: number;
      total_pages: number;
      from: number;
      to: number;
    };
  };
}

export interface InscriptionResponse {
  status: string;
  data: {
    inscription: Inscription;
  };
}

export interface Eleve {
  id: number;
  nom: string;
  prenom: string;
  matricule: string;
  date_naissance?: string;
  sexe?: "M" | "F";
  statut?: string;
  photo?: string;
}

export interface Niveau {
  id: number;
  nom: string;
  cycle: string;
  ordre?: number;
}

export interface Classe {
  id: number;
  nom: string;
  niveau_id?: number;
  niveau?: Niveau;
  capacite_max?: number;
  annee_scolaire_id?: number;
}

export interface AnneeScolaire {
  id: number;
  annee: string;
  date_debut: string;
  date_fin: string;
  statut: "planifie" | "courante" | "terminee" | "archivee";
  created_at?: string;
  updated_at?: string;
}

export interface AnneeScolaireResponse {
  status: string;
  data: {
    annees_scolaires: AnneeScolaire[];
  };
}

export interface InscriptionUpdateRequest {
  classe_id?: number;
  date_inscription?: string;
  frais_inscription?: number;
  frais_scolarite?: number;
  remises?: number;
  modalites_paiement?: string;
  observations?: string;
  montant_inscription?: number;
}

export interface HistoriqueInscription {
  id: number;
  inscription_id: number;
  changements: string[];
  modifie_par: string;
  anciennes_valeurs: any;
  nouvelles_valeurs: any;
  created_at: string;
}
