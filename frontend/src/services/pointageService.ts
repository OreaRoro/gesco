import api from "./http/api";

export interface PointagePersonnel {
  id: number;
  personnel_id: number;
  date_pointage: string;
  heure_arrivee: string | null;
  heure_depart: string | null;
  statut: "present" | "absent" | "retard" | "congé" | "maladie";
  heures_travail: string;
  remarque: string | null;
  pointe_par: number | null;
  created_at: string;
  personnel_nom?: string;
  personnel_prenom?: string;
  personnel_matricule?: string;
  personnel_type?: string;
}

export interface PointageFormData {
  personnel_id: number;
  date_pointage: string;
  heure_arrivee: string;
  heure_depart: string;
  statut: "present" | "absent" | "retard" | "congé" | "maladie";
  remarque?: string;
}

export interface PointageFilters {
  date_debut?: string;
  date_fin?: string;
  personnel_id?: number;
  statut?: string;
  type_personnel?: string;
}

class PointageService {
  async getAll(filters: PointageFilters = {}) {
    const params = new URLSearchParams();

    if (filters.date_debut) params.append("date_debut", filters.date_debut);
    if (filters.date_fin) params.append("date_fin", filters.date_fin);
    if (filters.personnel_id)
      params.append("personnel_id", filters.personnel_id.toString());
    if (filters.statut) params.append("statut", filters.statut);
    if (filters.type_personnel)
      params.append("type_personnel", filters.type_personnel);

    const response = await api.get(`/pointages/personnel?${params.toString()}`);
    return response.data;
  }

  async getById(id: number) {
    const response = await api.get(`/pointages/personnel/${id}`);
    return response.data;
  }

  async create(data: PointageFormData) {
    const response = await api.post("/pointages/personnel", data);
    return response.data;
  }

  async update(id: number, data: Partial<PointageFormData>) {
    const response = await api.post(`/pointages/personnel/${id}`, data);
    return response.data;
  }

  async delete(id: number) {
    const response = await api.delete(`/pointages/personnel/${id}`);
    return response.data;
  }

  async pointageRapide(personnelId: number, type: "arrivee" | "depart") {
    const response = await api.post("/pointages/personnel/rapide", {
      personnel_id: personnelId,
      type: type,
    });
    return response.data;
  }

  async getStatuts() {
    return [
      { value: "present", label: "Présent" },
      { value: "absent", label: "Absent" },
      { value: "retard", label: "En retard" },
      { value: "congé", label: "Congé" },
      { value: "maladie", label: "Maladie" },
    ];
  }

  async getStatsMensuelles(mois: string, personnelId?: number) {
    const params = new URLSearchParams();
    params.append("mois", mois);
    if (personnelId) params.append("personnel_id", personnelId.toString());

    const response = await api.get(
      `/pointages/personnel/stats/mensuelles?${params.toString()}`
    );
    return response.data;
  }

  // Calculer les heures de travail
  calculerHeuresTravail(heureArrivee: string, heureDepart: string): number {
    const arrivee = new Date(`2000-01-01T${heureArrivee}`);
    const depart = new Date(`2000-01-01T${heureDepart}`);

    const diffMs = depart.getTime() - arrivee.getTime();
    const diffHeures = diffMs / (1000 * 60 * 60);

    return Math.max(0, diffHeures);
  }

  // Formater les heures
  formatHeures(heures: number): string {
    const heuresEntieres = Math.floor(heures);
    const minutes = Math.round((heures - heuresEntieres) * 60);
    return `${heuresEntieres.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  }
}

export const pointageService = new PointageService();
