import api from "./http/api";

export interface Salaire {
  id: number;
  personnel_id: number;
  annee_scolaire_id: number;
  mois: string; // Format: YYYY-MM
  salaire_base: string;
  prime: string;
  heures_supp: string;
  taux_heure_supp: string;
  deduction: string;
  salaire_net: string;
  statut_paiement: "paye" | "impaye";
  date_paiement: string | null;
  paye_par: number | null;
  created_at: string;
  personnel_nom?: string;
  personnel_prenom?: string;
  personnel_matricule?: string;
  personnel_type?: string;
}

export interface SalaireFormData {
  personnel_id: number;
  annee_scolaire_id: number;
  mois: string;
  salaire_base: number;
  prime?: number;
  heures_supp?: number;
  taux_heure_supp?: number;
  deduction?: number;
  salaire_net: number;
  statut_paiement: "paye" | "impaye";
  date_paiement?: string;
}

export interface SalaireFilters {
  mois?: string;
  annee_scolaire_id?: number;
  personnel_id?: number;
  statut_paiement?: string;
  type_personnel?: string;
}

export interface BulletinSalaire {
  salaire: Salaire;
  personnel: any;
  ecole: any;
  details: {
    libelle: string;
    montant: number;
    type: "gain" | "deduction";
  }[];
}

class SalaireService {
  async getAll(filters: SalaireFilters = {}) {
    const params = new URLSearchParams();

    if (filters.mois) params.append("mois", filters.mois);
    if (filters.annee_scolaire_id)
      params.append("annee_scolaire_id", filters.annee_scolaire_id.toString());
    if (filters.personnel_id)
      params.append("personnel_id", filters.personnel_id.toString());
    if (filters.statut_paiement)
      params.append("statut_paiement", filters.statut_paiement);
    if (filters.type_personnel)
      params.append("type_personnel", filters.type_personnel);

    const response = await api.get(`/salaires?${params.toString()}`);
    return response.data;
  }

  async getById(id: number) {
    const response = await api.get(`/salaires/${id}`);
    return response.data;
  }

  async create(data: SalaireFormData) {
    const response = await api.post("/salaires", data);
    return response.data;
  }

  async update(id: number, data: Partial<SalaireFormData>) {
    const response = await api.post(`/salaires/${id}`, data);
    return response.data;
  }

  async delete(id: number) {
    const response = await api.delete(`/salaires/${id}`);
    return response.data;
  }

  async payerSalaire(id: number, datePaiement: string) {
    const response = await api.post(`/salaires/${id}/payer`, {
      date_paiement: datePaiement,
    });
    return response.data;
  }

  async genererBulletin(id: number) {
    const response = await api.get(`/salaires/${id}/bulletin`);
    return response.data;
  }

  async getMoisDisponibles() {
    return [
      { value: "2025-01", label: "Janvier 2025" },
      { value: "2025-02", label: "Février 2025" },
      { value: "2025-03", label: "Mars 2025" },
      { value: "2025-04", label: "Avril 2025" },
      { value: "2025-05", label: "Mai 2025" },
      { value: "2025-06", label: "Juin 2025" },
      { value: "2025-07", label: "Juillet 2025" },
      { value: "2025-08", label: "Août 2025" },
      { value: "2025-09", label: "Septembre 2025" },
      { value: "2025-10", label: "Octobre 2025" },
      { value: "2025-11", label: "Novembre 2025" },
      { value: "2025-12", label: "Décembre 2025" },
    ];
  }

  async getStatutsPaiement() {
    return [
      { value: "paye", label: "Payé" },
      { value: "impaye", label: "Impayé" },
    ];
  }

  // Calcul automatique du salaire net
  calculerSalaireNet(data: {
    salaire_base: number;
    prime?: number;
    heures_supp?: number;
    taux_heure_supp?: number;
    deduction?: number;
  }): number {
    const prime = data.prime || 0;
    const heuresSupp = data.heures_supp || 0;
    const tauxHeureSupp = data.taux_heure_supp || 0;
    const deduction = data.deduction || 0;

    const montantHeuresSupp = heuresSupp * tauxHeureSupp;
    const totalGains = data.salaire_base + prime + montantHeuresSupp;

    return totalGains - deduction;
  }
}

export const salaireService = new SalaireService();
