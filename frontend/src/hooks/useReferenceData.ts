import { useState, useEffect } from "react";
import { referenceService } from "../services/referenceService";
import { useAnneeScolaire } from "../context/AnneeScolaireContext";

export const useReferenceData = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [niveaux, setNiveaux] = useState<any[]>([]);
  const [anneesScolaires, setAnneesScolaires] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { anneeActive, anneesScolaires: contextAnnees } = useAnneeScolaire();

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Utiliser la méthode combinée pour charger toutes les références
      const references = await referenceService.getReferencesCompletes();

      setClasses(references.classes || []);
      setNiveaux(references.niveaux || []);

      // Priorité au contexte, sinon utiliser les données de l'API
      if (contextAnnees && contextAnnees.length > 0) {
        setAnneesScolaires(contextAnnees);
      } else {
        setAnneesScolaires(references.anneesScolaires || []);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur inconnue";
      setError(`Erreur lors du chargement des données: ${errorMessage}`);
      console.error("Erreur reference data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Recharger les classes quand l'année active change
  useEffect(() => {
    if (anneeActive?.id) {
      loadClassesForCurrentYear();
    }
  }, [anneeActive?.id]);

  const loadClassesForCurrentYear = async () => {
    if (!anneeActive?.id) return;

    try {
      // Charger toutes les classes puis filtrer côté client
      const classesRes = await referenceService.getClassesWithDetails();
      const classesFiltrees =
        classesRes.data?.classes?.filter(
          (classe: any) => classe.annee_scolaire_id === anneeActive.id
        ) || [];
      setClasses(classesFiltrees);
    } catch (err) {
      console.error("Erreur chargement classes année active:", err);
      // En cas d'erreur, filtrer les classes existantes
      const classesFiltrees = classes.filter(
        (classe) => classe.annee_scolaire_id === anneeActive.id
      );
      setClasses(classesFiltrees);
    }
  };

  const getClassesByNiveau = (niveauId: number) => {
    return classes.filter((classe) => classe.niveau_id === niveauId);
  };

  const getNiveauById = (niveauId: number) => {
    return niveaux.find((niveau) => niveau.id === niveauId);
  };

  const getClassesByAnneeScolaire = (anneeScolaireId: number) => {
    return classes.filter(
      (classe) => classe.annee_scolaire_id === anneeScolaireId
    );
  };

  const getClassesDisponibles = () => {
    if (anneeActive) {
      return getClassesByAnneeScolaire(anneeActive.id);
    }
    return classes;
  };

  const getNiveauxDisponibles = () => {
    // Filtrer les niveaux qui ont des classes dans l'année active
    if (anneeActive) {
      const niveauxAvecClasses = new Set(
        getClassesDisponibles().map((classe) => classe.niveau_id)
      );
      return niveaux.filter((niveau) => niveauxAvecClasses.has(niveau.id));
    }
    return niveaux;
  };

  const getAnneeScolaireById = (anneeId: number) => {
    return anneesScolaires.find((annee) => annee.id === anneeId);
  };

  const getAnneeScolairePrecedente = () => {
    if (!anneeActive || anneesScolaires.length === 0) return null;

    // Trier les années scolaires par date de début
    const anneesTriees = [...anneesScolaires].sort((a, b) => {
      const dateA = new Date(a.date_debut);
      const dateB = new Date(b.date_debut);
      return dateA.getTime() - dateB.getTime();
    });

    const currentIndex = anneesTriees.findIndex((a) => a.id === anneeActive.id);
    return currentIndex > 0 ? anneesTriees[currentIndex - 1] : null;
  };

  const getClassesAvecDetails = () => {
    return getClassesDisponibles().map((classe) => ({
      ...classe,
      niveau: getNiveauById(classe.niveau_id),
      annee_scolaire: getAnneeScolaireById(classe.annee_scolaire_id),
    }));
  };

  const refreshClasses = async () => {
    try {
      if (anneeActive?.id) {
        await loadClassesForCurrentYear();
      } else {
        const classesRes = await referenceService.getClassesWithDetails();
        setClasses(classesRes.data?.classes || []);
      }
    } catch (err) {
      console.error("Erreur rafraîchissement classes:", err);
      throw err;
    }
  };

  const refreshNiveaux = async () => {
    try {
      // Utiliser la méthode getAll du niveauService via referenceService
      const niveauxRes = await referenceService.getAll();
      setNiveaux(niveauxRes.data?.niveaux || []);
    } catch (err) {
      console.error("Erreur rafraîchissement niveaux:", err);
      throw err;
    }
  };

  const refreshAnneesScolaires = async () => {
    try {
      // Recharger les années scolaires depuis l'API
      // Utiliser getAll() qui est disponible via anneeScolaireService
      const anneesRes = await referenceService.getAll();
      setAnneesScolaires(anneesRes.data?.annees_scolaires || []);
    } catch (err) {
      console.error("Erreur rafraîchissement années scolaires:", err);
      throw err;
    }
  };

  // Alternative: utiliser getReferencesCompletes pour tout rafraîchir
  const refreshAll = async () => {
    try {
      const references = await referenceService.getReferencesCompletes();
      setClasses(references.classes || []);
      setNiveaux(references.niveaux || []);
      setAnneesScolaires(references.anneesScolaires || []);
    } catch (err) {
      console.error("Erreur rafraîchissement complet:", err);
      throw err;
    }
  };

  return {
    // Données brutes
    classes,
    niveaux,
    anneesScolaires,
    loading,
    error,

    // Données filtrées et dérivées
    classesActives: getClassesDisponibles(),
    niveauxActifs: getNiveauxDisponibles(),
    classesAvecDetails: getClassesAvecDetails(),

    // Méthodes de filtrage
    getClassesByNiveau,
    getNiveauById,
    getClassesByAnneeScolaire,
    getClassesDisponibles,
    getNiveauxDisponibles,
    getAnneeScolaireById,
    getAnneeScolairePrecedente,

    // Méthodes de rafraîchissement
    refresh: loadData,
    refreshAll,
    refreshClasses,
    refreshNiveaux,
    refreshAnneesScolaires,

    // Getters contextuels
    anneeActive,
    getCycles: () => [...new Set(niveaux.map((n) => n.cycle))].sort(),

    // États utiles
    hasData:
      classes.length > 0 && niveaux.length > 0 && anneesScolaires.length > 0,
    hasActiveYear: !!anneeActive,
  };
};
