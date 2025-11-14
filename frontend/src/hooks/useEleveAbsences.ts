import { useState, useEffect, useCallback } from "react";
import {
  absenceService,
  PointageEleve,
  StatistiquesAbsences,
} from "../services/absenceService";
import { eleveService } from "../services/eleveService";

export const useEleveAbsences = (eleveId: number, anneeScolaireId?: number) => {
  const [loading, setLoading] = useState(true);
  const [eleve, setEleve] = useState<any>(null);
  const [pointages, setPointages] = useState<PointageEleve[]>([]);
  const [statistiques, setStatistiques] = useState<StatistiquesAbsences | null>(
    null
  );

  const loadData = useCallback(
    async (filters = {}) => {
      if (!eleveId) return;

      setLoading(true);
      try {
        // Charger les données de l'élève (une seule fois)
        if (!eleve) {
          const eleveResponse = await eleveService.getById(eleveId);
          setEleve(eleveResponse.data.eleve);
        }

        // Préparer les filtres avec l'année scolaire
        const finalFilters = {
          ...filters,
          annee_scolaire_id: anneeScolaireId,
        };

        // Charger les données en parallèle
        const [pointagesResponse, statsResponse] = await Promise.all([
          absenceService.getByEleve(eleveId, finalFilters),
          absenceService.getStatistiques(eleveId, anneeScolaireId),
        ]);

        setPointages(pointagesResponse.data.pointages);
        setStatistiques(statsResponse.data.statistiques);
      } catch (error: any) {
        console.error("Erreur chargement absences:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [eleveId, anneeScolaireId, eleve]
  );

  // Recharger quand l'année scolaire change
  useEffect(() => {
    if (eleveId && anneeScolaireId) {
      loadData();
    }
  }, [eleveId, anneeScolaireId, loadData]);

  return {
    loading,
    eleve,
    pointages,
    statistiques,
    reload: loadData,
    refetch: (filters: any) => loadData(filters),
  };
};
