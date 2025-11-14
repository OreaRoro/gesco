// services/absenceService.ts
import { api } from "./http/api";

export interface PointageEleve {
  id: number;
  eleve_id: number;
  inscription_id: number;
  date_pointage: string;
  heure_arrivee?: string;
  heure_depart?: string;
  statut: "present" | "absent" | "retard" | "justifie" | "exclu";
  remarque?: string;
  justification?: string;
  piece_justificative?: string;
  pointe_par: number;
  pointe_par_nom?: string;
  classe_nom?: string;
  created_at: string;
}

export interface PointageCreateRequest {
  date_pointage: string;
  statut: "present" | "absent" | "retard" | "justifie" | "exclu";
  heure_arrivee?: string;
  heure_depart?: string;
  remarque?: string;
  justification?: string;
}

export interface StatistiquesAbsences {
  total_jours: number;
  absences: number;
  retards: number;
  justifies: number;
  presents: number;
  exclus: number;
}

export interface PointagesResponse {
  pointages: PointageEleve[];
  total: number;
  per_page: number;
  current_page: number;
  total_pages: number;
}

export const absenceService = {
  // Récupérer les absences d'un élève
  // Dans votre service absenceService.ts
  getByEleve: async (
    eleveId: number,
    filters?: {
      date_debut?: string;
      date_fin?: string;
      statut?: string;
      classe_id?: number;
      annee_scolaire_id?: number; // Ajouter ce paramètre
      page?: number;
      perPage?: number;
    }
  ): Promise<{ status: string; data: PointagesResponse }> => {
    const params = new URLSearchParams();

    if (filters?.date_debut) params.append("date_debut", filters.date_debut);
    if (filters?.date_fin) params.append("date_fin", filters.date_fin);
    if (filters?.statut) params.append("statut", filters.statut);
    if (filters?.classe_id)
      params.append("classe_id", filters.classe_id.toString());
    if (filters?.annee_scolaire_id)
      // Ajouter le filtre année scolaire
      params.append("annee_scolaire_id", filters.annee_scolaire_id.toString());
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.perPage) params.append("perPage", filters.perPage.toString());

    const response = await api.get(
      `/eleves/${eleveId}/absences?${params.toString()}`
    );
    return response.data;
  },

  // getStatistiques: async (
  //   eleveId: number,
  //   anneeScolaireId?: number
  // ): Promise<{
  //   status: string;
  //   data: { statistiques: StatistiquesAbsences };
  // }> => {
  //   const params = new URLSearchParams();
  //   if (anneeScolaireId) {
  //     params.append("annee_scolaire_id", anneeScolaireId.toString());
  //   }

  //   const response = await api.get(
  //     `/eleves/${eleveId}/absences/statistiques?${params.toString()}`
  //   );
  //   return response.data;
  // },

  // Créer un pointage

  create: async (
    eleveId: number,
    pointageData: PointageCreateRequest
  ): Promise<{
    status: string;
    message: string;
    data: { pointage_id: number };
  }> => {
    const response = await api.post(
      `/eleves/${eleveId}/absences`,
      pointageData
    );
    return response.data;
  },

  // Modifier un pointage
  update: async (
    pointageId: number,
    pointageData: Partial<PointageCreateRequest>
  ): Promise<{ status: string; message: string }> => {
    const response = await api.put(`/absences/${pointageId}`, pointageData);
    return response.data;
  },

  // Supprimer un pointage
  delete: async (
    pointageId: number
  ): Promise<{ status: string; message: string }> => {
    const response = await api.delete(`/absences/${pointageId}`);
    return response.data;
  },

  // Récupérer les statistiques
  getStatistiques: async (
    eleveId: number,
    anneeScolaireId?: number
  ): Promise<{
    status: string;
    data: { statistiques: StatistiquesAbsences };
  }> => {
    const params = new URLSearchParams();
    if (anneeScolaireId) {
      params.append("annee_scolaire_id", anneeScolaireId.toString());
    }

    const response = await api.get(
      `/eleves/${eleveId}/absences/statistiques?${params.toString()}`
    );
    return response.data;
  },
};
