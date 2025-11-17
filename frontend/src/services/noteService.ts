import api from "./http/api";
import {
  Note,
  NotesResponse,
  NoteFormData,
  Bulletin,
  MoyenneMatiere,
} from "../interfaces/note.interface";

// Interface pour les filtres de recherche des notes
interface NoteFilters {
  annee_scolaire_id?: number;
  examen_id?: number;
  matiere_id?: number;
  classe_id?: number;
  eleve_id?: number;
}

export const noteService = {
  /**
   * Récupère les notes d'un élève
   */
  async getNotesEleve(
    eleveId: number,
    filters: NoteFilters = {}
  ): Promise<NotesResponse> {
    const response = await api.get(`/eleves/${eleveId}/notes`, {
      params: filters,
    });
    return response.data;
  },

  /**
   * Récupère les moyennes d'un élève
   */
  async getMoyennesEleve(
    eleveId: number,
    anneeScolaireId?: number
  ): Promise<{ data: { moyennes: MoyenneMatiere[] } }> {
    const params: any = {};
    if (anneeScolaireId) params.annee_scolaire_id = anneeScolaireId;

    const response = await api.get(`/eleves/${eleveId}/moyennes`, { params });
    return response.data;
  },

  /**
   * Récupère le bulletin d'un élève
   */
  async getBulletin(
    eleveId: number,
    anneeScolaireId?: number
  ): Promise<{ data: { bulletin: Bulletin } }> {
    const params: any = {};
    if (anneeScolaireId) params.annee_scolaire_id = anneeScolaireId;

    const response = await api.get(`/eleves/${eleveId}/bulletin`, { params });
    return response.data;
  },

  /**
   * Récupère les notes d'une classe
   */
  async getNotesClasse(
    classeId: number,
    filters: NoteFilters = {}
  ): Promise<any> {
    const response = await api.get(`/classes/${classeId}/notes`, {
      params: filters,
    });
    return response.data;
  },

  /**
   * Crée une nouvelle note
   */
  async create(noteData: NoteFormData): Promise<{ data: { note: Note } }> {
    const response = await api.post("/notes", noteData);
    return response.data;
  },

  /**
   * Met à jour une note existante
   */
  async update(
    id: number,
    noteData: Partial<NoteFormData>
  ): Promise<{ data: { note: Note } }> {
    const response = await api.put(`/notes/${id}`, noteData);
    return response.data;
  },

  /**
   * Supprime une note
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/notes/${id}`);
  },

  /**
   * Récupère les statistiques des notes
   */
  async getStatistiques(filters: NoteFilters = {}): Promise<any> {
    const response = await api.get("/notes/statistiques", {
      params: filters,
    });
    return response.data;
  },

  /**
   * Calcule la moyenne d'un élève pour une matière
   */
  calculerMoyenneMatiere(notes: Note[]): number {
    if (!notes || notes.length === 0) return 0;

    let totalPondere = 0;
    let totalCoefficients = 0;

    notes.forEach((note) => {
      totalPondere += note.note * note.coefficient;
      totalCoefficients += note.coefficient;
    });

    return totalCoefficients > 0 ? totalPondere / totalCoefficients : 0;
  },

  /**
   * Calcule la moyenne générale d'un élève
   */
  calculerMoyenneGenerale(moyennesMatiere: MoyenneMatiere[]): number {
    if (!moyennesMatiere || moyennesMatiere.length === 0) return 0;

    let totalPondere = 0;
    let totalCoefficients = 0;

    moyennesMatiere.forEach((matiere) => {
      totalPondere += matiere.moyenne_ponderee * matiere.coefficient;
      totalCoefficients += matiere.coefficient;
    });

    return totalCoefficients > 0 ? totalPondere / totalCoefficients : 0;
  },

  /**
   * Génère une appréciation basée sur la moyenne
   */
  genererAppreciation(moyenne: number): string {
    if (moyenne >= 16) {
      return "Excellent - Félicitations";
    } else if (moyenne >= 14) {
      return "Très bon travail";
    } else if (moyenne >= 12) {
      return "Bon travail";
    } else if (moyenne >= 10) {
      return "Satisfaisant";
    } else if (moyenne >= 8) {
      return "Insuffisant - Doit faire des efforts";
    } else {
      return "Très insuffisant - Travail à reprendre";
    }
  },

  /**
   * Formate une note pour l'affichage
   */
  formatNote(note: number | null | undefined): string {
    // Vérifier si la note est null, undefined, ou non numérique
    if (note === null || note === undefined || isNaN(Number(note))) {
      return "0,00";
    }

    // Convertir en nombre et formater
    const numericNote = Number(note);
    return numericNote.toFixed(2).replace(".", ",");
  },

  /**
   * Valide une note (doit être entre 0 et 20)
   */
  validerNote(note: number): boolean {
    return note >= 0 && note <= 20;
  },

  /**
   * Exporte les notes en CSV
   */
  async exportNotesCSV(filters: NoteFilters = {}): Promise<Blob> {
    const response = await api.get("/notes/export/csv", {
      params: filters,
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Récupère l'historique des notes d'un élève
   */
  async getHistoriqueNotes(
    eleveId: number,
    filters: {
      annee_scolaire_id?: number;
      matiere_id?: number;
    } = {}
  ): Promise<any> {
    const response = await api.get(`/eleves/${eleveId}/historique-notes`, {
      params: filters,
    });
    return response.data;
  },

  /**
   * Compare les performances d'un élève sur plusieurs périodes
   */
  async comparerPerformances(
    eleveId: number,
    periodes: string[]
  ): Promise<any> {
    const response = await api.get(`/eleves/${eleveId}/comparer-performances`, {
      params: { periodes: periodes.join(",") },
    });
    return response.data;
  },

  /**
   * Récupère le classement des élèves
   */
  async getClassement(
    filters: {
      annee_scolaire_id?: number;
      examen_id?: number;
      classe_id?: number;
      matiere_id?: number;
    } = {}
  ): Promise<any> {
    const response = await api.get("/notes/classement", {
      params: filters,
    });
    return response.data;
  },
};

export default noteService;
