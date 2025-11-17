export interface Note {
  note_id?: number;
  eleve_id: number;
  inscription_id: number;
  matiere_id: number;
  examen_id: number;
  note: number;
  coefficient: number;
  appreciation?: string;
  saisie_par?: number;
  created_at?: string;
  updated_at?: string;

  // Champs joints
  eleve_nom?: string;
  eleve_prenom?: string;
  matricule?: string;
  matiere_nom?: string;
  matiere_coefficient?: number;
  classe_nom?: string;
  examen_nom?: string;
  examen_type?: string;
}

export interface NoteFormData {
  notes: Note[];
}

export interface NotesResponse {
  status: string;
  data:
    | Note[]
    | {
        notes: Note[];
        examen?: any;
        filters?: any;
      };
}

export interface MoyenneMatiere {
  matiere_id: number;
  matiere_nom: string;
  coefficient: number;
  moyenne: number;
  moyenne_ponderee: number;
  nb_notes: number;
}

export interface Bulletin {
  eleve: any;
  classe: any;
  annee_scolaire: any;
  inscription: any;
  notes: Note[];
  moyennes_par_matiere: MoyenneMatiere[];
  moyenne_generale: number;
  total_coefficients: number;
  appreciation_generale: string;
}

export interface NoteStatistiques {
  total_notes: number;
  moyenne_generale: number;
  note_minimale: number;
  note_maximale: number;
  ecart_type: number;
  mediane: number;
  par_matiere?: Array<{
    matiere_nom: string;
    nb_notes: number;
    moyenne: number;
    note_min: number;
    note_max: number;
  }>;
}
