import React, { useState } from "react";
import { useAnneeScolaire } from "../../context/AnneeScolaireContext";
import Spinner from "./Spinner";
import { FaCalendarAlt, FaCheck, FaSync } from "react-icons/fa";

const AnneeScolaireSelector: React.FC = () => {
  const {
    anneeActive,
    anneesScolaires,
    loading,
    changeAnneeActive,
    refreshAnneeScolaire,
  } = useAnneeScolaire();

  const [changing, setChanging] = useState(false);

  const handleChangeAnnee = async (id: number) => {
    if (changing || id === anneeActive?.id) return; // Empêcher les clics inutiles

    setChanging(true);
    try {
      await changeAnneeActive(id);
    } catch (error) {
      console.error("Erreur changement année:", error);
    } finally {
      setChanging(false);
    }
  };

  const handleRefresh = async () => {
    await refreshAnneeScolaire();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600">
        <Spinner size="sm" />
        <span>Chargement...</span>
      </div>
    );
  }

  if (!anneeActive) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg">
        <FaCalendarAlt className="w-4 h-4" />
        <span>Aucune année scolaire configurée</span>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Affichage de l'année active */}
      <div className="flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-white/[0.03] dark:text-gray-300 border border-gray-300 dark:border-gray-400 rounded-lg cursor-pointer hover:bg-gray-50">
        <FaCalendarAlt className="w-4 h-4 text-blue-600" />
        <span className="font-medium">{anneeActive.annee}</span>
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            anneeActive.statut === "courante"
              ? "bg-green-100 text-green-800"
              : anneeActive.statut === "terminee"
              ? "bg-gray-100 text-gray-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {anneeActive.statut}
        </span>
      </div>

      {/* Dropdown menu */}
      <div className="absolute right-0 z-50 hidden w-64 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg group-hover:block">
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">
              Années Scolaires
            </h3>
            <button
              onClick={handleRefresh}
              className="p-1 text-gray-400 rounded hover:text-gray-600 hover:bg-gray-100"
              title="Actualiser"
            >
              <FaSync className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto">
          {anneesScolaires.map((annee) => (
            <div
              key={annee.id}
              className={`flex items-center justify-between px-3 py-2 cursor-pointer ${
                annee.id === anneeActive.id
                  ? "bg-blue-50 text-blue-700"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => handleChangeAnnee(annee.id)}
            >
              <div className="flex-1">
                <div className="text-sm font-medium">{annee.annee}</div>
                <div className="text-xs text-gray-500">
                  {new Date(annee.date_debut).toLocaleDateString("fr-FR")} -{" "}
                  {new Date(annee.date_fin).toLocaleDateString("fr-FR")}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    annee.statut === "courante"
                      ? "bg-green-100 text-green-800"
                      : annee.statut === "terminee"
                      ? "bg-gray-100 text-gray-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {annee.statut}
                </span>

                {annee.id === anneeActive.id && (
                  <FaCheck className="w-4 h-4 text-green-600" />
                )}

                {changing && annee.id === anneeActive.id && (
                  <Spinner size="sm" />
                )}
              </div>
            </div>
          ))}
        </div>

        {anneesScolaires.length === 0 && (
          <div className="px-3 py-4 text-center text-gray-500">
            Aucune année scolaire configurée
          </div>
        )}
      </div>
    </div>
  );
};

export default AnneeScolaireSelector;
