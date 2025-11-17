import api from "./http/api";
import { Personnel, PersonnelFormData } from "./personnelService";

export interface Enseignant extends Personnel {
  specialite?: string;
  niveau_etude?: string;
  date_embauche: string;
  statut: "actif" | "inactif" | "congé" | "licencie";
}

export interface EnseignantFormData extends PersonnelFormData {
  specialite?: string;
  niveau_etude?: string;
}

export interface EnseignantFilters {
  search?: string;
  specialite?: string;
  statut?: string;
}

export interface MatiereEnseignee {
  id: number;
  enseignant_id: number;
  matiere_id: number;
  classe_id: number;
  annee_scolaire_id: number;
  heures_semaine: number;
  created_at: string;
  matiere_nom?: string;
  classe_nom?: string;
  annee_scolaire?: string;
}

class EnseignantService {
  async getAll(filters: EnseignantFilters = {}) {
    const params = new URLSearchParams();

    if (filters.search) params.append("search", filters.search);
    if (filters.specialite) params.append("specialite", filters.specialite);
    if (filters.statut) params.append("statut", filters.statut);

    // Filtrer uniquement les enseignants
    params.append("type_personnel", "enseignant");

    const response = await api.get(`/personnel?${params.toString()}`);
    return response.data;
  }

  async getById(id: number) {
    const response = await api.get(`/personnel/${id}`);
    return response.data;
  }

  async create(data: EnseignantFormData) {
    // S'assurer que le type est bien enseignant
    data.type_personnel = "enseignant";

    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      const value = data[key as keyof EnseignantFormData];
      if (value !== null && value !== undefined && value !== "") {
        if (key === "photo" && value instanceof File) {
          formData.append(key, value);
        } else if (key !== "photo") {
          formData.append(key, value.toString());
        }
      }
    });

    const response = await api.post("/personnel", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  async update(id: number, data: Partial<EnseignantFormData>) {
    // S'assurer que le type reste enseignant
    data.type_personnel = "enseignant";

    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      const value = data[key as keyof EnseignantFormData];
      if (value !== null && value !== undefined && value !== "") {
        if (key === "photo" && value instanceof File) {
          formData.append(key, value);
        } else if (key !== "photo") {
          formData.append(key, value.toString());
        }
      }
    });

    const response = await api.post(`/personnel/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  async delete(id: number) {
    const response = await api.delete(`/personnel/${id}`);
    return response.data;
  }

  // Gestion des matières enseignées
  async getMatieresEnseignees(enseignantId: number) {
    const response = await api.get(`/enseignants/${enseignantId}/matieres`);
    return response.data;
  }

  async assignerMatiere(
    enseignantId: number,
    matiereId: number,
    classeId: number,
    anneeScolaireId: number,
    heuresSemaine: number
  ) {
    const response = await api.post(`/enseignants/${enseignantId}/matieres`, {
      matiere_id: matiereId,
      classe_id: classeId,
      annee_scolaire_id: anneeScolaireId,
      heures_semaine: heuresSemaine,
    });
    return response.data;
  }

  async retirerMatiere(assignmentId: number) {
    const response = await api.delete(`/enseignants/matieres/${assignmentId}`);
    return response.data;
  }

  // Emploi du temps
  async getEmploiDuTemps(enseignantId: number, anneeScolaireId?: number) {
    const params = new URLSearchParams();
    if (anneeScolaireId)
      params.append("annee_scolaire_id", anneeScolaireId.toString());

    const response = await api.get(
      `/enseignants/${enseignantId}/emploi-du-temps?${params.toString()}`
    );
    return response.data;
  }

  // Statistiques
  async getStats(enseignantId: number) {
    const response = await api.get(`/enseignants/${enseignantId}/stats`);
    return response.data;
  }

  async getSpecialites() {
    return [
      { value: "mathematiques", label: "Mathématiques" },
      { value: "francais", label: "Français" },
      { value: "histoire_geo", label: "Histoire-Géographie" },
      { value: "sciences", label: "Sciences" },
      { value: "anglais", label: "Anglais" },
      { value: "eps", label: "Éducation Physique et Sportive" },
      { value: "arts", label: "Arts" },
      { value: "musique", label: "Musique" },
      { value: "technologie", label: "Technologie" },
      { value: "autre", label: "Autre" },
    ];
  }

  async getNiveauxEtude() {
    return [
      { value: "licence", label: "Licence" },
      { value: "master", label: "Master" },
      { value: "doctorat", label: "Doctorat" },
      { value: "cap", label: "CAP" },
      { value: "bep", label: "BEP" },
      { value: "bac", label: "Baccalauréat" },
      { value: "autre", label: "Autre" },
    ];
  }

  async getStatuts() {
    return [
      { value: "actif", label: "Actif" },
      { value: "inactif", label: "Inactif" },
      { value: "congé", label: "En Congé" },
      { value: "licencie", label: "Licencié" },
    ];
  }

  // Méthode pour récupérer les types de personnel (si nécessaire)
  async getTypesPersonnel() {
    return [
      { value: "enseignant", label: "Enseignant" },
      { value: "surveillant", label: "Surveillant" },
      { value: "administratif", label: "Personnel Administratif" },
      { value: "menage", label: "Personnel de Ménage" },
      { value: "direction", label: "Direction" },
      { value: "autre", label: "Autre" },
    ];
  }
}

export const enseignantService = new EnseignantService();
