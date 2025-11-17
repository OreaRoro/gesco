import api from "./http/api";

export interface Personnel {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  sexe: "M" | "F" | null;
  date_naissance: string | null;
  lieu_naissance: string | null;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  type_personnel:
    | "enseignant"
    | "surveillant"
    | "administratif"
    | "menage"
    | "direction"
    | "autre";
  date_embauche: string | null;
  salaire_base: string;
  statut: "actif" | "inactif" | "congé" | "licencie";
  photo: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonnelFormData {
  nom: string;
  prenom: string;
  sexe: "M" | "F" | "";
  date_naissance: string;
  lieu_naissance: string;
  adresse: string;
  telephone: string;
  email: string;
  type_personnel:
    | "enseignant"
    | "surveillant"
    | "administratif"
    | "menage"
    | "direction"
    | "autre";
  date_embauche: string;
  salaire_base: string;
  statut: "actif" | "inactif" | "congé" | "licencie";
  photo?: File | null;
}

export interface PersonnelFilters {
  search?: string;
  type_personnel?: string;
  statut?: string;
}

class PersonnelService {
  async getAll(filters: PersonnelFilters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.search) params.append("search", filters.search);
      if (filters.type_personnel)
        params.append("type_personnel", filters.type_personnel);
      if (filters.statut) params.append("statut", filters.statut);

      const response = await api.get(`/personnel?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  async All() {
    try {
      const response = await api.get(`/personnel/all`);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  async getById(id: number) {
    const response = await api.get(`/personnel/${id}`);
    return response.data;
  }

  async create(formData: FormData) {
    const response = await api.post("/personnel", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  async update(id: number, formData: FormData) {
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

  async getAdministratif(): Promise<{ data: { administratif: Personnel[] } }> {
    try {
      const response = await api.get("/personnel/administratif");
      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération du personnel administratif:",
        error
      );
      return { data: { administratif: [] } };
    }
  }

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

  async getStatuts() {
    return [
      { value: "actif", label: "Actif" },
      { value: "inactif", label: "Inactif" },
      { value: "congé", label: "En Congé" },
      { value: "licencie", label: "Licencié" },
    ];
  }
}

export const personnelService = new PersonnelService();
