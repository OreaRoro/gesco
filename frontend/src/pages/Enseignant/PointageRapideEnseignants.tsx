import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { enseignantPointageService } from "../../services/enseignantPointageService";
import PageMeta from "../../components/common/PageMeta.tsx";
import PageBreadcrumb from "../../components/common/PageBreadCrumb.tsx";
import ComponentCard from "../../components/common/ComponentCard.tsx";
import Spinner from "../../components/common/Spinner.tsx";
import {
  FaArrowRight,
  FaArrowLeft,
  FaClock,
  FaChalkboardTeacher,
  FaSearch,
} from "react-icons/fa";

const PointageRapideEnseignants: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [pointageLoading, setPointageLoading] = useState<number | null>(null);
  const [enseignants, setEnseignants] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadEnseignants();
  }, []);

  const loadEnseignants = async () => {
    setLoading(true);
    try {
      const enseignantsList = await enseignantPointageService.getEnseignants();
      setEnseignants(enseignantsList);
    } catch (error: any) {
      console.error("Erreur chargement enseignants:", error);
      toast.error("Erreur lors du chargement des enseignants");
    } finally {
      setLoading(false);
    }
  };

  const handlePointage = async (
    enseignantId: number,
    type: "arrivee" | "depart"
  ) => {
    setPointageLoading(enseignantId);
    try {
      await enseignantPointageService.pointageRapide(enseignantId, type);
      toast.success(
        `Pointage ${type === "arrivee" ? "d'arrivée" : "de départ"} enregistré`
      );

      // Recharger la liste pour mettre à jour les statuts
      setTimeout(() => {
        loadEnseignants();
      }, 500);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors du pointage");
    } finally {
      setPointageLoading(null);
    }
  };

  // Filtrer les enseignants par recherche
  const filteredEnseignants = enseignants.filter((enseignant) =>
    `${enseignant.nom} ${enseignant.prenom} ${enseignant.matricule} ${
      enseignant.specialite || ""
    }`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const getStatutAujourdhui = (enseignant: any) => {
    // Cette fonction devrait récupérer le statut du pointage du jour depuis votre API
    // Pour l'instant, on retourne un statut fictif
    return {
      statut: "non_pointe",
      heureArrivee: null,
      heureDepart: null,
    };
  };

  const getStatutColor = (statut: string) => {
    const colors = {
      present: "text-green-600 bg-green-100",
      absent: "text-red-600 bg-red-100",
      retard: "text-orange-600 bg-orange-100",
      non_pointe: "text-gray-600 bg-gray-100",
      congé: "text-blue-600 bg-blue-100",
      maladie: "text-purple-600 bg-purple-100",
    };
    return colors[statut as keyof typeof colors] || colors.non_pointe;
  };

  const getStatutLabel = (statut: string) => {
    const labels = {
      present: "Présent",
      absent: "Absent",
      retard: "En retard",
      non_pointe: "Non pointé",
      congé: "Congé",
      maladie: "Maladie",
    };
    return labels[statut as keyof typeof labels] || statut;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
        <span className="ml-2">Chargement des enseignants...</span>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Pointage Rapide - Enseignants | Système de Gestion Scolaire"
        description="Pointage rapide des enseignants"
      />

      <PageBreadcrumb
        pageTitle="Pointage Rapide - Enseignants"
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Enseignants", path: "/enseignants" },
          { label: "Pointage", path: "/enseignants/pointage" },
          { label: "Pointage Rapide", path: "/enseignants/pointage/rapide" },
        ]}
      />

      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Pointage Rapide - Enseignants
            </h1>
            <p className="text-gray-600">
              Pointage rapide d'arrivée et de départ des enseignants
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/enseignants/pointage"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FaClock className="w-4 h-4" />
              Retour à la liste
            </Link>
          </div>
        </div>

        {/* Barre de recherche */}
        <ComponentCard title="Recherche">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FaSearch className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher un enseignant par nom, prénom, matricule ou spécialité..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {filteredEnseignants.length} enseignant(s) trouvé(s)
          </div>
        </ComponentCard>

        {/* Liste des enseignants */}
        <ComponentCard title="Enseignants">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEnseignants.map((enseignant) => {
              const statutAujourdhui = getStatutAujourdhui(enseignant);

              return (
                <div
                  key={enseignant.id}
                  className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <FaChalkboardTeacher className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {enseignant.nom} {enseignant.prenom}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {enseignant.matricule}
                        </p>
                        {enseignant.specialite && (
                          <p className="text-xs text-gray-400">
                            {enseignant.specialite}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Statut du jour */}
                  <div className="mb-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatutColor(
                        statutAujourdhui.statut
                      )}`}
                    >
                      {getStatutLabel(statutAujourdhui.statut)}
                    </span>
                    {statutAujourdhui.heureArrivee && (
                      <p className="text-xs text-gray-500 mt-1">
                        Arrivée: {statutAujourdhui.heureArrivee}
                        {statutAujourdhui.heureDepart &&
                          ` - Départ: ${statutAujourdhui.heureDepart}`}
                      </p>
                    )}
                  </div>

                  {/* Boutons de pointage */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePointage(enseignant.id, "arrivee")}
                      disabled={pointageLoading === enseignant.id}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {pointageLoading === enseignant.id ? (
                        <Spinner size="sm" />
                      ) : (
                        <FaArrowRight className="w-4 h-4" />
                      )}
                      Arrivée
                    </button>

                    <button
                      onClick={() => handlePointage(enseignant.id, "depart")}
                      disabled={pointageLoading === enseignant.id}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {pointageLoading === enseignant.id ? (
                        <Spinner size="sm" />
                      ) : (
                        <FaArrowLeft className="w-4 h-4" />
                      )}
                      Départ
                    </button>
                  </div>

                  {/* Informations supplémentaires */}
                  <div className="mt-3 text-xs text-gray-500">
                    <div>Date: {new Date().toLocaleDateString("fr-FR")}</div>
                    <div>
                      Heure:{" "}
                      {new Date().toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredEnseignants.length === 0 && (
            <div className="text-center py-12">
              <FaChalkboardTeacher className="w-16 h-16 mx-auto text-gray-400" />
              <p className="mt-4 text-lg font-medium text-gray-900">
                Aucun enseignant trouvé
              </p>
              <p className="text-gray-500">
                {searchTerm
                  ? "Aucun enseignant ne correspond à votre recherche."
                  : "Aucun enseignant actif trouvé dans le système."}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-2 text-sm text-brand-600 hover:text-brand-700"
                >
                  Réinitialiser la recherche
                </button>
              )}
            </div>
          )}
        </ComponentCard>

        {/* Instructions */}
        <ComponentCard title="Instructions">
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>Pointage d'arrivée :</strong> Enregistre l'heure d'arrivée
              de l'enseignant et le marque comme "Présent"
            </p>
            <p>
              <strong>Pointage de départ :</strong> Enregistre l'heure de départ
              et calcule automatiquement les heures travaillées
            </p>
            <p>
              <strong>Statut :</strong> Le statut est mis à jour automatiquement
              en fonction des pointages
            </p>
            <p className="text-xs text-gray-500">
              Les pointages sont enregistrés pour la date du jour :{" "}
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </ComponentCard>
      </div>
    </>
  );
};

export default PointageRapideEnseignants;
