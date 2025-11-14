import { classeService } from "./classeService";
import { anneeScolaireService } from "./anneeScolaireService";
import { niveauService } from "./niveauService";

export const referenceService = {
  // Classes
  ...classeService,

  // Années scolaires
  ...anneeScolaireService,

  // Niveaux
  ...niveauService,

  // Méthodes combinées
  async getReferencesCompletes() {
    try {
      const [classesRes, anneesRes, niveauxRes] = await Promise.all([
        classeService.getClassesWithDetails(),
        anneeScolaireService.getAll(),
        niveauService.getAll(),
      ]);

      return {
        classes: classesRes.data?.classes || [],
        anneesScolaires: anneesRes.data?.annees_scolaires || [],
        niveaux: niveauxRes.data?.niveaux || [],
      };
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des références complètes:",
        error
      );
      return {
        classes: [],
        anneesScolaires: [],
        niveaux: [],
      };
    }
  },

  async getDonneesPourInscription() {
    try {
      const [anneeCourante, classes, niveaux] = await Promise.all([
        anneeScolaireService.getCurrent(),
        classeService.getClassesWithDetails(),
        niveauService.getAll(),
      ]);

      return {
        anneeCourante,
        classes: classes.data?.classes || [],
        niveaux: niveaux.data?.niveaux || [],
      };
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des données pour inscription:",
        error
      );
      return {
        anneeCourante: null,
        classes: [],
        niveaux: [],
      };
    }
  },
};

export default referenceService;
