// components/school/ClassesDistribution.tsx
import { useState, useMemo } from "react";
import { Dropdown } from "../../components/ui/dropdown/Dropdown.tsx";
import { DropdownItem } from "../../components/ui/dropdown/DropdownItem.tsx";
import { MoreDotIcon, SearchIcon } from "../../icons";

interface ClasseData {
  id: number;
  nom: string;
  niveau: string;
  eleves: number;
  capacite: number;
  taux: number;
  cycle: string;
}

interface ClassesDistributionProps {}

// Fonction pour générer des données de test pour 100 salles
const generateClassesData = (): ClasseData[] => {
  const niveaux = [
    "Maternelle",
    "Grande section",
    "CP",
    "CE1",
    "CE2",
    "6ème",
    "7ème",
    "8ème",
    "5ème",
    "4ème",
    "3ème",
    "Seconde",
    "Première",
    "Terminale",
  ];

  const cycles = ["Préscolaire", "Primaire", "Collège", "Lycée"];

  return Array.from({ length: 100 }, (_, i) => {
    const niveauIndex = i % niveaux.length;
    const cycleIndex = Math.floor(niveauIndex / 3.5); // Répartition approximative par cycle
    const capacite = 25 + Math.floor(Math.random() * 15); // Capacité entre 25 et 40
    const eleves = Math.floor(Math.random() * (capacite + 1)); // Élèves entre 0 et capacité
    const taux = Math.round((eleves / capacite) * 100);

    return {
      id: i + 1,
      nom: `Salle ${i + 1}`,
      niveau: niveaux[niveauIndex],
      eleves,
      capacite,
      taux,
      cycle: cycles[cycleIndex],
    };
  });
};

export default function ClassesDistribution(props: ClassesDistributionProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCycle, setSelectedCycle] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const classesPerPage = 5;

  const classesData = useMemo(() => generateClassesData(), []);

  // Filtrage des données
  const filteredClasses = useMemo(() => {
    return classesData.filter((classe) => {
      const matchesSearch =
        classe.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        classe.niveau.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCycle = !selectedCycle || classe.cycle === selectedCycle;
      return matchesSearch && matchesCycle;
    });
  }, [classesData, searchTerm, selectedCycle]);

  // Pagination
  const totalPages = Math.ceil(filteredClasses.length / classesPerPage);
  const currentClasses = useMemo(() => {
    const startIndex = (currentPage - 1) * classesPerPage;
    return filteredClasses.slice(startIndex, startIndex + classesPerPage);
  }, [filteredClasses, currentPage, classesPerPage]);

  // Statistiques globales
  const stats = useMemo(() => {
    const totalEleves = filteredClasses.reduce(
      (acc, classe) => acc + classe.eleves,
      0
    );
    const totalCapacite = filteredClasses.reduce(
      (acc, classe) => acc + classe.capacite,
      0
    );
    const tauxMoyen =
      totalCapacite > 0 ? Math.round((totalEleves / totalCapacite) * 100) : 0;
    const classesPleines = filteredClasses.filter(
      (classe) => classe.taux >= 90
    ).length;
    const classesVides = filteredClasses.filter(
      (classe) => classe.taux === 0
    ).length;

    return {
      totalEleves,
      totalCapacite,
      tauxMoyen,
      classesPleines,
      classesVides,
      placesDisponibles: totalCapacite - totalEleves,
    };
  }, [filteredClasses]);

  function toggleDropdown(): void {
    setIsOpen(!isOpen);
  }

  function closeDropdown(): void {
    setIsOpen(false);
  }

  const cycles = Array.from(new Set(classesData.map((classe) => classe.cycle)));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Répartition des Classes
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            {filteredClasses.length} classes sur {classesData.length} total
          </p>
        </div>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem onItemClick={closeDropdown}>
              Exporter Excel
            </DropdownItem>
            <DropdownItem onItemClick={closeDropdown}>
              Exporter PDF
            </DropdownItem>
            <DropdownItem onItemClick={closeDropdown}>
              Vue détaillée
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
          <input
            type="text"
            placeholder="Rechercher une classe ou niveau..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <select
          value={selectedCycle}
          onChange={(e) => {
            setSelectedCycle(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="">Tous les cycles</option>
          {cycles.map((cycle) => (
            <option key={cycle} value={cycle}>
              {cycle}
            </option>
          ))}
        </select>
      </div>

      {/* Liste des classes avec pagination */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {currentClasses.map((classe) => (
          <div
            key={classe.id}
            className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            <div className="flex items-center gap-3 flex-1">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  classe.taux >= 90
                    ? "bg-green-100 dark:bg-green-900"
                    : classe.taux >= 50
                    ? "bg-blue-100 dark:bg-blue-900"
                    : classe.taux >= 20
                    ? "bg-yellow-100 dark:bg-yellow-900"
                    : "bg-gray-100 dark:bg-gray-800"
                }`}
              >
                <span
                  className={`text-sm font-semibold ${
                    classe.taux >= 90
                      ? "text-green-600 dark:text-green-400"
                      : classe.taux >= 50
                      ? "text-blue-600 dark:text-blue-400"
                      : classe.taux >= 20
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {classe.nom.split(" ")[1]}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                    {classe.nom}
                  </p>
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded dark:bg-gray-700 dark:text-gray-300">
                    {classe.cycle}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                    {classe.niveau}
                  </span>
                  <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                    • {classe.eleves}/{classe.capacite} élèves
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <div className="flex w-32 items-center gap-3">
                  <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-700">
                    <div
                      className={`absolute left-0 top-0 flex h-full items-center justify-center rounded-sm ${
                        classe.taux >= 90
                          ? "bg-green-500"
                          : classe.taux >= 50
                          ? "bg-blue-500"
                          : classe.taux >= 20
                          ? "bg-yellow-500"
                          : "bg-gray-400"
                      }`}
                      style={{ width: `${classe.taux}%` }}
                    ></div>
                  </div>
                  <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90 min-w-12">
                    {classe.taux}%
                  </p>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {classe.capacite - classe.eleves} places libres
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Page {currentPage} sur {totalPages} • {filteredClasses.length}{" "}
            classes
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Précédent
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Statistiques globales */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg dark:bg-gray-800">
        <h4 className="font-semibold text-gray-800 dark:text-white mb-3">
          Aperçu global
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Taux moyen
            </p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">
              {stats.tauxMoyen}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Élèves total
            </p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">
              {stats.totalEleves}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Places libres
            </p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">
              {stats.placesDisponibles}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Classes pleines
            </p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">
              {stats.classesPleines}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
