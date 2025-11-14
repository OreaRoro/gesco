// services/paiementService.ts
import api from "./http/api";
import { PaiementCreateRequest } from "../interfaces/paiement.interface";

export const paiementService = {
  create: async (data: PaiementCreateRequest) => {
    const { encaisse_par, ...dataToSend } = data;
    const response = await api.post("/paiements", dataToSend);
    return response.data;
  },

  getByInscription: async (inscriptionId: number) => {
    const response = await api.get(`/inscriptions/${inscriptionId}/paiements`);
    return response.data;
  },

  getByEleveAndAnnee: async (eleveId: number, anneeScolaireId: number) => {
    const response = await api.get(
      `/eleves/${eleveId}/paiements/annee/${anneeScolaireId}`
    );
    return response.data;
  },

  getSolde: async (inscriptionId: number) => {
    const response = await api.get(`/inscriptions/${inscriptionId}/solde`);
    return response.data;
  },

  getSoldeByEleveAndAnnee: async (eleveId: number, anneeScolaireId: number) => {
    const response = await api.get(
      `/eleves/${eleveId}/solde/annee/${anneeScolaireId}`
    );
    return response.data;
  },

  delete: async (paiementId: number) => {
    const response = await api.delete(`/paiements/${paiementId}`);
    return response.data;
  },
};
