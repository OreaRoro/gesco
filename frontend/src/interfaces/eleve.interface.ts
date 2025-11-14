export interface Eleve {
  inscription_statut: string;
  photo_url: any;
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance?: string;
  sexe: "M" | "F";
  adresse?: string;
  telephone_parent?: string;
  email_parent?: string;
  statut: "actif" | "inactif" | "transfere" | "diplome";
  photo?: string;
  created_at: string;
  updated_at: string;

  // Relations (optionnelles car elles viennent des jointures)
  classe_nom?: string;
  niveau_nom?: string;
  code_eleve?: string;
}

export interface PaginationInfo {
  total_pages: number;
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
}

export interface ElevesResponse {
  status: string;
  data: {
    eleves: Eleve[];
    pagination: PaginationInfo;
  };
}

export interface EleveResponse {
  status: string;
  data: {
    statistiques: EleveStatistiques;
    eleve: Eleve;
    inscriptions: InscriptionProfil[];
  };
}

// Interfaces pour le formulaire
export interface EleveFormData {
  nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance: string;
  sexe: "M" | "F";
  adresse: string;
  telephone_parent: string;
  email_parent: string;
  date_inscription: string;
}

export interface EleveFormErrors {
  nom?: string;
  prenom?: string;
  date_naissance?: string;
  lieu_naissance?: string;
  sexe?: string;
  adresse?: string;
  telephone_parent?: string;
  email_parent?: string;
  date_inscription?: string;
}

// Interface pour la création d'élève (sans les champs optionnels)
export interface EleveCreateRequest {
  nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance?: string;
  sexe: "M" | "F";
  adresse?: string;
  telephone_parent?: string;
  email_parent?: string;
  date_inscription: string;
}

// Interface pour la mise à jour d'élève
export interface EleveUpdateRequest {
  nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance?: string;
  sexe: "M" | "F";
  adresse?: string;
  telephone_parent?: string;
  email_parent?: string;
  statut: "actif" | "inactif" | "transfere" | "diplome";
}

export interface InscriptionProfil {
  niveau_nom: string;
  classe_nom: string;
  id: number;
  annee_scolaire_id: number;
  classe_id: number;
  date_inscription: string;
  date_fin?: string;
  statut: "active" | "inscrit" | "abandon" | "transfere";
  classe: {
    id: number;
    nom: string;
    niveau: {
      id: number;
      nom: string;
      cycle: string;
    };
  };
  // annee_scolaire: string;
  annee_scolaire: {
    id: number;
    annee: string;
    statut: "active" | "termine" | "a_venir";
  };
}

export interface EleveStatistiques {
  moyenne_generale?: number;
  nombre_absences: number;
  nombre_retards: number;
  dernier_bulletin?: {
    id: number;
    periode: string;
    moyenne: number;
  };
}

export interface EleveUpdateFormData {
  nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance?: string;
  sexe: "M" | "F";
  adresse?: string;
  telephone_parent?: string;
  email_parent?: string;
  statut: "actif" | "inactif" | "transfere" | "diplome";
  photo?: FileList;
}
