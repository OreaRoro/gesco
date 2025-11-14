import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { inscriptionService } from "../../services/inscriptionService";
import { eleveService } from "../../services/eleveService";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Spinner from "../../components/common/Spinner";
import { ArrowLeftIcon } from "../../icons";
import {
  FaEdit,
  FaPrint,
  FaDownload,
  FaCalendarAlt,
  FaUser,
  FaMoneyBillWave,
  FaClipboardCheck,
  FaHistory,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { useImageUrl } from "../../hooks/useImageUrl.ts";
import { useAnneeScolaire } from "../../context/AnneeScolaireContext";
import { fraisService } from "../../services/fraisService.ts";

interface InscriptionDetails {
  id: number;
  eleve_id: number;
  classe_id: number;
  annee_scolaire_id: number;
  date_inscription: string;
  montant_inscription: number;
  montant_paye: number;
  statut: "inscrit" | "reinscrit" | "transfere" | "abandon";
  frais_inscription: number;
  frais_scolarite: number;
  remises: number;
  modalites_paiement: string;
  observations: string;
  created_at: string;
  updated_at: string;
  eleve?: {
    id: number;
    matricule: string;
    nom: string;
    prenom: string;
    date_naissance: string;
    lieu_naissance: string;
    sexe: string;
    adresse: string;
    telephone_parent: string;
    email_parent: string;
    photo: string;
    statut: string;
  };
  classe?: {
    id: number;
    nom: string;
    niveau_id: number;
    niveau?: {
      nom: string;
      cycle: string;
    };
  };
  annee_scolaire?: {
    id: number;
    annee: string;
    date_debut: string;
    date_fin: string;
  };
  fraisDeScolarite?: {
    id: number;
    montant: number;
    frais_inscription: number;
  };
  paiements?: Array<{
    id: number;
    mois: string;
    montant: string;
    date_paiement: string;
    mode_paiement: string;
    statut: string;
    reference_paiement: string;
  }>;
}

// Fonction utilitaire pour formater les nombres (accepte string et number)
const formatNumber = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null) return "0";

  // Convertir en nombre si c'est une string
  const numericValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numericValue)) return "0";
  return numericValue.toLocaleString("fr-FR");
};

// Fonction pour formater les montants avec "Ar"
const formatMontant = (montant: string | number | undefined | null): string => {
  if (montant === undefined || montant === null) return "0 Ar";

  const numericValue =
    typeof montant === "string" ? parseFloat(montant) : montant;

  if (isNaN(numericValue)) return "0 Ar";
  return `${numericValue.toLocaleString("fr-FR")} Ar`;
};

// Fonction utilitaire pour formater les dates
const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return "Non spécifié";
  try {
    return new Date(dateString).toLocaleDateString("fr-FR");
  } catch {
    return "Date invalide";
  }
};

const ViewInscription: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [inscription, setInscription] = useState<InscriptionDetails | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<
    "details" | "paiements" | "historique"
  >("details");
  const { getImageUrl } = useImageUrl();
  const { anneeActive } = useAnneeScolaire();

  useEffect(() => {
    if (id) {
      loadInscriptionData(parseInt(id));
    }
  }, [id]);

  const loadInscriptionData = async (inscriptionId: number) => {
    setLoading(true);
    try {
      const inscriptionResponse = await inscriptionService.getById(
        inscriptionId
      );
      const inscriptionData = inscriptionResponse.data.inscription;

      // Charger les données supplémentaires
      const [eleveResponse, paiementsResponse] = await Promise.all([
        eleveService.getById(inscriptionData.eleve_id),
        inscriptionService.getPaiements(inscriptionId).catch((error) => {
          console.warn("Erreur lors du chargement des paiements:", error);
          return { data: { paiements: [] } };
        }),
      ]);

      const eleveData = eleveResponse.data.eleve;
      const classeData = eleveResponse.data.inscriptions[0].classe;

      // Récupérer les frais spécifiques à la classe
      let fraisData = null;
      if (classeData?.id) {
        try {
          // Essayer avec le niveau comme fallback
          if (classeData?.niveau?.id) {
            try {
              const fraisResponse = await fraisService.getFraisByNiveau(
                classeData.niveau.id,
                anneeActive?.id
              );
              fraisData = fraisResponse.data.frais;
            } catch (niveauError) {
              console.warn("Erreur avec le fallback niveau:", niveauError);
            }
          }
        } catch (error) {
          console.warn(
            "Erreur lors du chargement des frais par classe:",
            error
          );
          const fraisResponse = await fraisService.getFraisByClasse(
            classeData.id
          );
          fraisData = fraisResponse.data.frais;
        }
      }

      setInscription({
        ...inscriptionData,
        eleve: eleveData,
        paiements: paiementsResponse.data.paiements || [],
        classe: classeData,
        fraisDeScolarite: fraisData,
      });
    } catch (error: any) {
      console.error("Erreur chargement inscription:", error);
      toast.error("Erreur lors du chargement de l'inscription");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case "inscrit":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "reinscrit":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "transfere":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "abandon":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case "inscrit":
        return "Inscrit";
      case "reinscrit":
        return "Réinscrit";
      case "transfere":
        return "Transféré";
      case "abandon":
        return "Abandon";
      default:
        return statut;
    }
  };

  const getModePaiementLabel = (mode: string) => {
    switch (mode) {
      case "especes":
        return "Espèces";
      case "cheque":
        return "Chèque";
      case "virement":
        return "Virement";
      case "mobile":
        return "Mobile Money";
      default:
        return mode;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
    if (inscription) {
      navigate(`/eleves/${inscription.id}/modifier-inscription`);
    }
  };

  const calculateStats = () => {
    if (!inscription) return null;

    const montantInscription = inscription.montant_inscription || 0;

    // CORRECTION : Conversion en nombre avec parseFloat
    const totalPaye =
      inscription.paiements?.reduce((sum, p) => {
        const montant = parseFloat(p.montant) || 0;
        return sum + montant;
      }, 0) || 0;

    const soldeRestant = montantInscription - totalPaye;
    const paiementRestant = Math.max(0, montantInscription - totalPaye);
    const tauxPaiement =
      montantInscription > 0
        ? Math.round((totalPaye / montantInscription) * 100)
        : 0;

    return {
      totalPaye,
      soldeRestant,
      paiementRestant,
      tauxPaiement,
      paiementsCount: inscription.paiements?.length || 0,
      montantInscription,
      hasSurplus: soldeRestant < 0,
    };
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
        <span className="ml-2">Chargement de l'inscription...</span>
      </div>
    );
  }

  if (!inscription) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Inscription non trouvée
          </h2>
          <Link to="/eleves" className="text-brand-600 hover:text-brand-700">
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  const stats = calculateStats();
  const eleve = inscription.eleve;
  const classe = inscription.classe;
  const frais = inscription.fraisDeScolarite;

  // Vérification de sécurité pour l'élève
  if (!eleve) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Données de l'élève non disponibles
          </h2>
          <Link to="/eleves" className="text-brand-600 hover:text-brand-700">
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`Inscription de ${eleve.prenom} ${eleve.nom} | Système de Gestion Scolaire`}
        description={`Détails de l'inscription pour ${eleve.prenom} ${eleve.nom}`}
      />

      <PageBreadcrumb
        pageTitle={`Inscription de ${eleve.prenom} ${eleve.nom}`}
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Élèves", path: "/eleves" },
          {
            label: `${eleve.prenom} ${eleve.nom}`,
            path: `/eleves/${eleve.id}`,
          },
          { label: "Détails Inscription", path: `/inscriptions/${id}/view` },
        ]}
      />

      <div className="space-y-6">
        {/* En-tête avec actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link
              to={`/eleve-inscriptions`}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Retour
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-brand-500 rounded-lg hover:bg-brand-600"
            >
              <FaEdit className="w-4 h-4" />
              Modifier
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <FaPrint className="w-4 h-4" />
              Imprimer
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700">
              <FaDownload className="w-4 h-4" />
              Exporter
            </button>
          </div>
        </div>

        {/* Bannière d'information */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              {eleve.photo ? (
                <img
                  src={getImageUrl(eleve)}
                  alt={`${eleve.prenom} ${eleve.nom}`}
                  className="w-16 h-16 rounded-full border-2 border-white shadow-sm"
                />
              ) : (
                <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full border-2 border-white dark:bg-blue-900">
                  <FaUser className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {eleve.prenom} {eleve.nom}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Matricule: {eleve.matricule || "Non attribué"} • Classe:{" "}
                  {classe?.nom || "Non assignée"} • Année:{" "}
                  {anneeActive?.annee || "Non spécifiée"}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${getStatutColor(
                  inscription.statut
                )}`}
              >
                {getStatutLabel(inscription.statut)}
              </span>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Inscrit le {formatDate(inscription.date_inscription)}
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques financières */}
        {stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ComponentCard className="text-center">
              <div className="p-4">
                <FaMoneyBillWave className="w-8 h-8 mx-auto text-green-500 mb-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatNumber(stats.montantInscription)} Ar
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total à payer
                </p>
              </div>
            </ComponentCard>

            <ComponentCard className="text-center">
              <div className="p-4">
                <FaClipboardCheck className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatNumber(stats.totalPaye)} Ar
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Déjà payé
                </p>
              </div>
            </ComponentCard>

            <ComponentCard className="text-center">
              <div className="p-4">
                <FaHistory className="w-8 h-8 mx-auto text-orange-500 mb-2" />
                <h3
                  className={`text-lg font-semibold ${
                    stats.soldeRestant < 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {formatNumber(stats.soldeRestant)} Ar
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Paiement restant
                </p>
              </div>
            </ComponentCard>

            <ComponentCard className="text-center">
              <div className="p-4">
                <div className="w-8 h-8 mx-auto mb-2">
                  <div className="relative w-full h-full">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {stats.tauxPaiement}%
                      </span>
                    </div>
                    <svg
                      className="w-full h-full transform -rotate-90"
                      viewBox="0 0 36 36"
                    >
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        className="stroke-current text-gray-200 dark:text-gray-700"
                        strokeWidth="2"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        className="stroke-current text-green-500"
                        strokeWidth="2"
                        strokeDasharray="100"
                        strokeDashoffset={100 - stats.tauxPaiement}
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Taux de paiement
                </p>
              </div>
            </ComponentCard>
          </div>
        )}

        {/* Navigation par onglets */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px space-x-8">
            {[
              { id: "details", label: "Détails", icon: FaUser },
              { id: "paiements", label: "Paiements", icon: FaMoneyBillWave },
              { id: "historique", label: "Historique", icon: FaHistory },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-brand-500 text-brand-600 dark:text-brand-400 dark:border-brand-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === "paiements" && stats && (
                    <span className="ml-1 bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full">
                      {stats.paiementsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenu des onglets */}
        <div className="mt-6">
          {activeTab === "details" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Informations de l'élève */}
              <ComponentCard title="Informations de l'Élève">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                        Matricule
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {eleve.matricule || "Non attribué"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                        Date de naissance
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {formatDate(eleve.date_naissance)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Lieu de naissance
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {eleve.lieu_naissance || "Non spécifié"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                        Sexe
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white capitalize">
                        {eleve.sexe === "M"
                          ? "Masculin"
                          : eleve.sexe === "F"
                          ? "Féminin"
                          : "Non spécifié"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                        Statut
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white capitalize">
                        {eleve.statut || "Non spécifié"}
                      </p>
                    </div>
                  </div>
                </div>
              </ComponentCard>

              {/* Informations des parents */}
              <ComponentCard title="Informations des Parents">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Téléphone
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <FaPhone className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-900 dark:text-white">
                        {eleve.telephone_parent || "Non spécifié"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Email
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <FaEnvelope className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-900 dark:text-white">
                        {eleve.email_parent || "Non spécifié"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Adresse
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <FaMapMarkerAlt className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-900 dark:text-white">
                        {eleve.adresse || "Non spécifié"}
                      </p>
                    </div>
                  </div>
                </div>
              </ComponentCard>

              {/* Informations scolaires */}
              <ComponentCard title="Informations Scolaires">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                        Classe
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {inscription.classe?.nom || "Non assignée"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                        Niveau
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {inscription.classe?.niveau?.nom || "Non spécifié"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Année Scolaire
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {anneeActive?.annee || "Non spécifiée"}
                    </p>
                    {anneeActive && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Du {formatDate(anneeActive?.date_debut)} au{" "}
                        {formatDate(anneeActive?.date_fin)}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Date d'inscription
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <FaCalendarAlt className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-900 dark:text-white">
                        {formatDate(inscription.date_inscription)}
                      </p>
                    </div>
                  </div>
                </div>
              </ComponentCard>

              {/* Informations financières */}
              <ComponentCard title="Informations Financières">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Frais de scolarité:
                    </span>
                    <span className="font-medium dark:text-white">
                      {formatNumber(frais?.montant)} Ar
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Frais d'inscription:
                    </span>
                    <span className="font-medium dark:text-white">
                      {formatNumber(frais?.frais_inscription)} Ar
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Mensuel:
                    </span>
                    <span className="font-medium dark:text-white">
                      {formatNumber((frais?.montant ?? 0) / 10)} Ar
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Remises:
                    </span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      -{formatNumber(inscription.remises)} Ar
                    </span>
                  </div>
                  <hr className="my-2 dark:border-gray-600" />
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Total à payer:
                    </span>
                    <span className="text-lg font-bold text-brand-600 dark:text-brand-400">
                      {formatNumber(inscription.montant_inscription)} Ar
                    </span>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Modalités de paiement
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white capitalize">
                      {inscription.modalites_paiement || "Non spécifié"}
                    </p>
                  </div>
                  {inscription.observations && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                        Observations
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {inscription.observations}
                      </p>
                    </div>
                  )}
                </div>
              </ComponentCard>
            </div>
          )}

          {activeTab === "paiements" && (
            <ComponentCard title="Historique des Paiements">
              {inscription.paiements && inscription.paiements.length > 0 ? (
                <div className="overflow-hidden border border-gray-200 rounded-lg dark:border-gray-700">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                          Mois
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                          Montant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                          Mode
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                          Référence
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                          Statut
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                      {inscription.paiements.map((paiement) => (
                        <tr
                          key={paiement.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {paiement.mois || "Non spécifié"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatMontant(paiement.montant)} Ar
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatDate(paiement.date_paiement)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {getModePaiementLabel(paiement.mode_paiement)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {paiement.reference_paiement || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                paiement.statut === "paye"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                  : paiement.statut === "partiel"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                              }`}
                            >
                              {paiement.statut === "paye"
                                ? "Payé"
                                : paiement.statut === "partiel"
                                ? "Partiel"
                                : "Impayé"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaMoneyBillWave className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Aucun paiement enregistré
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucun paiement n'a été effectué pour cette inscription.
                  </p>
                </div>
              )}
            </ComponentCard>
          )}

          {activeTab === "historique" && (
            <ComponentCard title="Historique des Modifications">
              <div className="text-center py-8">
                <FaHistory className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Historique des modifications
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  L'historique des modifications sera disponible prochainement.
                </p>
              </div>
            </ComponentCard>
          )}
        </div>
      </div>
    </>
  );
};

export default ViewInscription;
