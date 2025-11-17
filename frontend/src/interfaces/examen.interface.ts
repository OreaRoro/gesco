export interface Examen {
  id: number;
  nom: string;
  type: "trimestriel" | "semestriel" | "annuel" | "composition";
  date_debut: string;
  date_fin: string;
  annee_scolaire_id: number;
  periode_id?: number;
  statut: "planifie" | "en_cours" | "termine" | "archive";
  created_at?: string;
  updated_at?: string;
  annee?: string;
  periode_nom?: string;
  periode_type?: string;
}

export interface ExamenFormData {
  nom: string;
  type: string;
  date_debut: string;
  date_fin: string;
  annee_scolaire_id: number;
  periode_id?: number;
}

export interface ExamensResponse {
  status: string;
  data: Examen[];
}

export interface ExamenResponse {
  status: string;
  data: Examen;
}
