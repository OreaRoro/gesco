import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { enseignantService } from "../../services/enseignantService";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Spinner from "../../components/common/Spinner";
import {
  FaChalkboardTeacher,
  FaBook,
  FaClock,
  FaEdit,
  FaUserGraduate,
} from "react-icons/fa";

const EnseignantDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [enseignant, setEnseignant] = useState<any>(null);
  const [matieres, setMatieres] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadEnseignant(parseInt(id));
      loadMatieres(parseInt(id));
      loadStats(parseInt(id));
    }
  }, [id]);

  const loadEnseignant = async (enseignantId: number) => {
    setLoading(true);
    try {
      const response = await enseignantService.getById(enseignantId);
      setEnseignant(response.data.personnel);
    } catch (error: any) {
      console.error("Erreur chargement enseignant:", error);
      toast.error("Erreur lors du chargement des données de l'enseignant");
    } finally {
      setLoading(false);
    }
  };

  const loadMatieres = async (enseignantId: number) => {
    try {
      const response = await enseignantService.getMatieresEnseignees(
        enseignantId
      );
      setMatieres(response.data.matieres || []);
    } catch (error: any) {
      console.error("Erreur chargement matières:", error);
    }
  };

  const loadStats = async (enseignantId: number) => {
    try {
      const response = await enseignantService.getStats(enseignantId);
      setStats(response.data.stats);
    } catch (error: any) {
      console.error("Erreur chargement stats:", error);
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("fr-MG", {
      style: "currency",
      currency: "MGA",
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Non renseigné";
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
        <span className="ml-2">Chargement...</span>
      </div>
    );
  }

  if (!enseignant) {
    return (
      <div className="text-center py-12">
        <FaChalkboardTeacher className="w-16 h-16 mx-auto text-gray-400" />
        <p className="mt-4 text-lg font-medium text-gray-900">
          Enseignant non trouvé
        </p>
        <Link to="/enseignants" className="text-brand-600 hover:text-brand-700">
          Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`${enseignant.nom} ${enseignant.prenom} | Enseignant`}
        description={`Détails de l'enseignant ${enseignant.nom} ${enseignant.prenom}`}
      />

      <PageBreadcrumb
        pageTitle={`${enseignant.nom} ${enseignant.prenom}`}
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Enseignants", path: "/enseignants" },
          { label: "Détails", path: "#" },
        ]}
      />

      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              {enseignant.photo ? (
                <img
                  src={`/api/${enseignant.photo}`}
                  alt={enseignant.nom}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <FaChalkboardTeacher className="w-8 h-8 text-blue-600" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {enseignant.nom} {enseignant.prenom}
              </h1>
              <p className="text-gray-600">{enseignant.matricule}</p>
            </div>
          </div>

          <Link
            to={`/enseignants/${enseignant.id}/modifier`}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
          >
            <FaEdit className="w-4 h-4" />
            Modifier
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Colonne gauche - Informations personnelles */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations personnelles */}
            <ComponentCard title="Informations Personnelles">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nom complet
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {enseignant.nom} {enseignant.prenom}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Matricule
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {enseignant.matricule}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Sexe
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {enseignant.sexe === "M" ? "Masculin" : "Féminin"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date de naissance
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(enseignant.date_naissance)}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Lieu de naissance
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {enseignant.lieu_naissance || "Non renseigné"}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Adresse
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {enseignant.adresse || "Non renseignée"}
                  </p>
                </div>
              </div>
            </ComponentCard>

            {/* Informations professionnelles */}
            <ComponentCard title="Informations Professionnelles">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Spécialité
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {enseignant.specialite || "Non spécifiée"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <FaUserGraduate className="inline w-4 h-4 mr-1" />
                    Niveau d'étude
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {enseignant.niveau_etude || "Non spécifié"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date d'embauche
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(enseignant.date_embauche)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Salaire de base
                  </label>
                  <p className="mt-1 text-sm font-medium text-green-600">
                    {formatCurrency(enseignant.salaire_base)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Statut
                  </label>
                  <span
                    className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                      enseignant.statut === "actif"
                        ? "bg-green-100 text-green-800"
                        : enseignant.statut === "inactif"
                        ? "bg-gray-100 text-gray-800"
                        : enseignant.statut === "congé"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {enseignant.statut === "actif"
                      ? "Actif"
                      : enseignant.statut === "inactif"
                      ? "Inactif"
                      : enseignant.statut === "congé"
                      ? "En Congé"
                      : "Licencié"}
                  </span>
                </div>
              </div>
            </ComponentCard>

            {/* Matières enseignées */}
            <ComponentCard
              title={
                <div className="flex items-center gap-2">
                  <FaBook className="w-5 h-5" />
                  Matières Enseignées
                </div>
              }
            >
              {matieres.length > 0 ? (
                <div className="space-y-3">
                  {matieres.map((matiere) => (
                    <div
                      key={matiere.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {matiere.matiere_nom}
                        </p>
                        <p className="text-sm text-gray-500">
                          {matiere.classe_nom} • {matiere.annee_scolaire} •{" "}
                          {matiere.heures_semaine}h/semaine
                        </p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
                        {matiere.matiere_code}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Aucune matière assignée
                </p>
              )}
            </ComponentCard>
          </div>

          {/* Colonne droite - Statistiques et contact */}
          <div className="space-y-6">
            {/* Statistiques */}
            {stats && (
              <ComponentCard
                title={
                  <div className="flex items-center gap-2">
                    <FaClock className="w-5 h-5" />
                    Statistiques
                  </div>
                }
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Matières enseignées
                    </span>
                    <span className="font-bold text-gray-900">
                      {stats.total_matieres || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Heures/semaine
                    </span>
                    <span className="font-bold text-gray-900">
                      {stats.total_heures_semaine || 0}h
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Classes</span>
                    <span className="font-bold text-gray-900">
                      {stats.total_classes || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Années scolaires
                    </span>
                    <span className="font-bold text-gray-900">
                      {stats.total_annees || 0}
                    </span>
                  </div>
                </div>
              </ComponentCard>
            )}

            {/* Contact */}
            <ComponentCard title="Contact">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Téléphone
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {enseignant.telephone || "Non renseigné"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {enseignant.email || "Non renseigné"}
                  </p>
                </div>
              </div>
            </ComponentCard>

            {/* Actions rapides */}
            <ComponentCard title="Actions Rapides">
              <div className="space-y-2">
                <Link
                  to={`/enseignants/${enseignant.id}/matieres`}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FaBook className="w-4 h-4" />
                  Gérer les matières
                </Link>
                <Link
                  to={`/enseignants/${enseignant.id}/emploi-du-temps`}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FaClock className="w-4 h-4" />
                  Voir l'emploi du temps
                </Link>
              </div>
            </ComponentCard>
          </div>
        </div>
      </div>
    </>
  );
};

export default EnseignantDetails;
