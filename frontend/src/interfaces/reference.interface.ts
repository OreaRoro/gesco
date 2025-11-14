export interface Niveau {
  id: number;
  nom: string;
  cycle: string;
  ordre: number;
  created_at: string;
}

export interface AnneeScolaire {
  is_active: unknown;
  id: number;
  annee: string;
  date_debut: string;
  date_fin: string;
  statut: "planifie" | "courante" | "terminee" | "archivee";
  created_at: string;
  updated_at: string;
}

export interface Classe {
  id: number;
  nom: string;
  niveau_id: number;
  capacite_max: number;
  professeur_principal_id?: number;
  surveillant_id?: number;
  annee_scolaire_id?: number;
  created_at: string;
  niveau?: Niveau;
  professeur_principal?: any;
  surveillant?: any;
  annee_scolaire?: AnneeScolaire;
  niveau_nom: string;
}

export interface ClasseCreateRequest {
  nom: string;
  niveau_id: number;
  capacite_max: number;
  professeur_principal_id?: number;
  surveillant_id?: number;
  annee_scolaire_id?: number;
}

export interface AnneeScolaireCreateRequest {
  annee: string;
  date_debut: string;
  date_fin: string;
  statut?: "planifie" | "courante" | "terminee" | "archivee";
}

export interface NiveauCreateRequest {
  nom: string;
  cycle: string;
  ordre: number;
}
