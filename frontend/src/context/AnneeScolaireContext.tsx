import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { anneeScolaireService } from "../services/anneeScolaireService";
import { AnneeScolaire } from "../interfaces/reference.interface";

interface AnneeScolaireContextType {
  anneeActive: AnneeScolaire | null;
  anneesScolaires: AnneeScolaire[];
  loading: boolean;
  error: string | null;
  refreshAnneeScolaire: () => Promise<void>;
  setAnneeActive: (annee: AnneeScolaire) => void;
  changeAnneeActive: (id: number) => Promise<void>;
}

const AnneeScolaireContext = createContext<
  AnneeScolaireContextType | undefined
>(undefined);

interface AnneeScolaireProviderProps {
  children: ReactNode;
}

export const AnneeScolaireProvider: React.FC<AnneeScolaireProviderProps> = ({
  children,
}) => {
  const [anneeActive, setAnneeActive] = useState<AnneeScolaire | null>(null);
  const [anneesScolaires, setAnneesScolaires] = useState<AnneeScolaire[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnneeScolaireData = async () => {
    setLoading(true);
    setError(null);
    try {
      const allResponse = await anneeScolaireService.getAll();
      const annees = allResponse.data?.annees_scolaires || [];

      // Normaliser les données - convertir is_active en boolean
      const anneesNormalisees = annees.map((annee) => ({
        ...annee,
        is_active:
          annee.is_active === "1" ||
          annee.is_active === 1 ||
          annee.is_active === true,
      }));

      setAnneesScolaires(anneesNormalisees);

      // Maintenant on peut chercher avec un boolean
      const anneeActiveData = anneesNormalisees.find(
        (annee: AnneeScolaire) => annee.is_active
      );

      setAnneeActive(anneeActiveData || anneesNormalisees[0] || null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur lors du chargement";
      setError(errorMessage);
      console.error("Erreur chargement année scolaire:", err);
    } finally {
      setLoading(false);
    }
  };

  const changeAnneeActive = async (id: number) => {
    try {
      setLoading(true);
      // Appel API pour changer l'année active
      await anneeScolaireService.setAsActive(id);
      // IMPORTANT: Recharger les données depuis le serveur
      await loadAnneeScolaireData();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors du changement d'année active";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnneeScolaireData();
  }, []);

  const value: AnneeScolaireContextType = {
    anneeActive,
    anneesScolaires,
    loading,
    error,
    refreshAnneeScolaire: loadAnneeScolaireData,
    setAnneeActive: (annee: AnneeScolaire) => setAnneeActive(annee),
    changeAnneeActive,
  };

  return (
    <AnneeScolaireContext.Provider value={value}>
      {children}
    </AnneeScolaireContext.Provider>
  );
};
export const useAnneeScolaire = (): AnneeScolaireContextType => {
  const context = useContext(AnneeScolaireContext);
  if (context === undefined) {
    throw new Error(
      "useAnneeScolaire must be used within an AnneeScolaireProvider"
    );
  }
  return context;
};
