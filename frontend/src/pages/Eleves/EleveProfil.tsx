import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { eleveService } from "../../services/eleveService";
import { InscriptionProfil } from "../../interfaces/eleve.interface";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Spinner from "../../components/common/Spinner";
import {
  ArrowLeftIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  UserIcon,
} from "../../icons";
import {
  FaEdit,
  FaHistory,
  FaCalendar,
  FaGraduationCap,
  FaChartBar,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaIdCard,
  FaRedo,
  FaUserPlus,
} from "react-icons/fa";
import { useAnneeScolaire } from "../../context/AnneeScolaireContext";
import {
  absenceService,
  StatistiquesAbsences,
} from "../../services/absenceService";

const EleveProfil: React.FC = () => {
  const { anneeActive, loading: loadingAnneeScolaire } = useAnneeScolaire();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [eleve, setEleve] = useState<any>(null);
  const [inscriptions, setInscriptions] = useState<InscriptionProfil[]>([]);
  // const [statistiques, setStatistiques] = useState<any>(null);
  const [statistiques, setStatistiques] = useState<StatistiquesAbsences | null>(
    null
  );

  useEffect(() => {
    if (id) {
      loadEleveProfil(parseInt(id));
    }
  }, [id]);

  const loadEleveProfil = async (eleveId: number) => {
    setLoading(true);
    try {
      // const response = await eleveService.getById(eleveId);
      const [eleveResponse, statsResponse] = await Promise.all([
        eleveService.getById(eleveId),
        absenceService.getStatistiques(eleveId, anneeActive?.id),
      ]);

      setEleve(eleveResponse.data.eleve);
      setInscriptions(eleveResponse.data.inscriptions || []);
      setStatistiques(statsResponse.data.statistiques);
    } catch (error: any) {
      console.error("Erreur chargement profil élève:", error);
      toast.error("Erreur lors du chargement du profil");
      navigate("/eleves");
    } finally {
      setLoading(false);
    }
  };

  const getAge = (dateNaissance: string) => {
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatutBadge = (statut: string) => {
    const statutConfig: { [key: string]: { class: string; text: string } } = {
      actif: { class: "bg-success-100 text-success-800", text: "Actif" },
      inactif: { class: "bg-gray-100 text-gray-800", text: "Inactif" },
      transfere: {
        class: "bg-warning-100 text-warning-800",
        text: "Transféré",
      },
      diplome: { class: "bg-info-100 text-info-800", text: "Diplômé" },
    };

    const config = statutConfig[statut] || statutConfig.inactif;
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${config.class}`}
      >
        {config.text}
      </span>
    );
  };

  const getInscriptionStatutBadge = (statut: string) => {
    const statutConfig: { [key: string]: { class: string; text: string } } = {
      transfere: { class: "bg-info-100 text-info-800", text: "Transférer" },
      inscrit: { class: "bg-success-100 text-success-800", text: "Inscrit" },
      reinscrit: { class: "bg-green-100 text-green-800", text: "Réinscrit" },
      termine: { class: "bg-info-100 text-info-800", text: "Terminée" },
      abandon: { class: "bg-error-100 text-error-800", text: "Abandon" },
    };

    const config = statutConfig[statut] || statutConfig.termine;

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${config.class}`}
      >
        {config.text}
      </span>
    );
  };

  // Trouver l'inscription active pour l'année scolaire courante
  const getInscriptionActive = () => {
    if (!anneeActive) return null;
    return inscriptions.find(
      (ins) => ins.annee_scolaire_id === Number(anneeActive.id)
    );
  };

  const inscriptionActive = getInscriptionActive();
  const hasCurrentInscription = !!inscriptionActive;

  // Vérifier si l'élève a un historique d'inscriptions (pour d'autres années)
  const hasHistoriqueInscriptions = inscriptions.some(
    (ins) => !anneeActive || ins.annee_scolaire_id !== anneeActive.id
  );

  // Déterminer le type de bouton à afficher
  const getInscriptionButtonConfig = () => {
    if (!anneeActive) {
      return {
        type: "disabled" as const,
        label: "Aucune année active",
        icon: FaExclamationTriangle,
        className: "bg-gray-100 text-gray-400 cursor-not-allowed",
      };
    }

    if (hasCurrentInscription) {
      return {
        type: "already_inscribed" as const,
        label: `Inscrit en ${inscriptionActive?.classe?.nom}`,
        status: inscriptionActive?.statut as
          | "inscrit"
          | "reinscrit"
          | "abandon"
          | "transfere",
        className: "bg-green-100 text-green-800",
      };
    }

    if (hasHistoriqueInscriptions) {
      return {
        type: "reinscription" as const,
        label: "Réinscrire",
        icon: FaRedo,
        to: `/eleves/${id}/reinscrire`,
        className: "bg-green-600 hover:bg-green-700 text-white",
      };
    }

    return {
      type: "new_inscription" as const,
      label: "Inscrire",
      icon: FaUserPlus,
      to: `/eleves/${id}/inscrire`,
      className: "bg-brand-600 hover:bg-brand-700 text-white",
    };
  };

  const inscriptionButtonConfig = getInscriptionButtonConfig();

  // Vérifier si l'élève peut effectuer des paiements
  const canAccessPaiements = hasCurrentInscription && anneeActive;

  if (loading || loadingAnneeScolaire) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
        <span className="ml-2">Chargement...</span>
      </div>
    );
  }

  if (!eleve) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Élève non trouvé
          </h2>
          <button
            onClick={() => navigate("/eleves")}
            className="text-brand-600 hover:text-brand-700"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`${eleve.prenom} ${eleve.nom} - Profil | Système de Gestion Scolaire`}
        description={`Profil de l'élève ${eleve.prenom} ${eleve.nom}`}
      />

      <PageBreadcrumb
        pageTitle={`Profil de ${eleve.prenom} ${eleve.nom}`}
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Élèves", path: "/eleves" },
          {
            label: `${eleve.prenom} ${eleve.nom}`,
            path: `/eleves/${eleve.id}`,
          },
        ]}
      />

      <div className="space-y-6">
        {/* En-tête avec actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => navigate("/eleves")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Retour à la liste
          </button>

          <div className="flex gap-3">
            <Link
              to={`/eleves/${eleve.id}/historique`}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <FaHistory className="w-4 h-4" />
              Historique
            </Link>

            {/* Bouton Paiements dans le header */}
            {canAccessPaiements ? (
              <Link
                to={`/eleves/${eleve.id}/paiements`}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 transition-colors"
              >
                <FaMoneyBillWave className="w-4 h-4" />
                Paiements
              </Link>
            ) : (
              <button
                disabled
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
                title="Aucune inscription active pour l'année scolaire courante"
              >
                <FaMoneyBillWave className="w-4 h-4" />
                Paiements
              </button>
            )}

            <Link
              to={`/eleves/${eleve.id}/carte`}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <FaIdCard className="w-4 h-4" />
              Générer carte étudiante
            </Link>

            <Link
              to={`/eleves/${eleve.id}/modifier`}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-brand-600 border border-transparent rounded-lg hover:bg-brand-700"
            >
              <FaEdit className="w-4 h-4" />
              Modifier
            </Link>
          </div>
        </div>

        {/* Bannière d'information sur l'année scolaire */}
        {anneeActive && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaCalendar className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-900">
                    Année Scolaire Active
                  </h3>
                  <p className="text-sm text-blue-700">
                    {anneeActive.annee}
                    {inscriptionActive && ` - ${inscriptionActive.classe?.nom}`}
                  </p>
                </div>
              </div>

              {/* Affichage du statut d'inscription */}
              <div className="flex items-center gap-2">
                {inscriptionButtonConfig.type === "already_inscribed" ? (
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full ${inscriptionButtonConfig.className}`}
                    >
                      {inscriptionButtonConfig.label}
                    </span>
                    {inscriptionButtonConfig.status === "reinscrit" && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        Réinscrit
                      </span>
                    )}
                  </div>
                ) : inscriptionButtonConfig.type === "disabled" ? (
                  <div className="flex items-center gap-2 text-orange-600">
                    <FaExclamationTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {inscriptionButtonConfig.label}
                    </span>
                  </div>
                ) : (
                  <Link
                    to={inscriptionButtonConfig.to!}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${inscriptionButtonConfig.className}`}
                  >
                    {inscriptionButtonConfig.icon && (
                      <inscriptionButtonConfig.icon className="w-4 h-4" />
                    )}
                    {inscriptionButtonConfig.label}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Colonne de gauche - Informations personnelles */}
          <div className="lg:col-span-2 space-y-6">
            {/* Carte Informations Personnelles */}
            <ComponentCard title="Informations Personnelles">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Matricule
                    </label>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {eleve.matricule}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Nom
                    </label>
                    <p className="mt-1 text-sm text-gray-900">{eleve.nom}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Prénom
                    </label>
                    <p className="mt-1 text-sm text-gray-900">{eleve.prenom}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Sexe
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {eleve.sexe === "M" ? "Masculin" : "Féminin"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Date de Naissance
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <FaCalendar className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-900">
                        {formatDate(eleve.date_naissance)} (
                        {getAge(eleve.date_naissance)} ans)
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Lieu de Naissance
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {eleve.lieu_naissance || "Non renseigné"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Statut
                    </label>
                    <div className="mt-1">{getStatutBadge(eleve.statut)}</div>
                  </div>
                </div>
              </div>
            </ComponentCard>

            {/* Carte Informations de Contact */}
            <ComponentCard title="Informations de Contact">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-4">
                  {eleve.adresse && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">
                        Adresse
                      </label>
                      <div className="flex items-start gap-2 mt-1">
                        <MapPinIcon className="w-4 h-4 mt-0.5 text-gray-400" />
                        <p className="text-sm text-gray-900">{eleve.adresse}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {eleve.telephone_parent && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">
                        Téléphone Parent
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <PhoneIcon className="w-4 h-4 text-gray-400" />
                        <p className="text-sm text-gray-900">
                          {eleve.telephone_parent}
                        </p>
                      </div>
                    </div>
                  )}

                  {eleve.email_parent && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">
                        Email Parent
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <MailIcon className="w-4 h-4 text-gray-400" />
                        <p className="text-sm text-gray-900">
                          {eleve.email_parent}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ComponentCard>

            {/* Carte Historique des Inscriptions */}
            <ComponentCard title="Historique des Inscriptions">
              {inscriptions.length > 0 ? (
                <div className="space-y-4">
                  {inscriptions.map((inscription) => {
                    const isActive =
                      anneeActive &&
                      inscription.annee_scolaire_id === anneeActive.id;

                    return (
                      <div
                        key={inscription.id}
                        className={`p-4 border rounded-lg ${
                          isActive
                            ? "border-blue-300 bg-blue-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {inscription.classe?.niveau?.cycle ||
                                "Niveau inconnu"}{" "}
                              - {inscription.classe?.nom || "Classe inconnue"}
                              {isActive && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  Actuelle
                                </span>
                              )}
                            </h4>
                            <p className="text-sm text-gray-500">
                              Année scolaire:{" "}
                              {inscription.annee_scolaire?.annee}
                            </p>
                          </div>
                          {getInscriptionStatutBadge(inscription.statut)}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                          <div>
                            <span className="text-gray-500">
                              Date d'inscription:
                            </span>
                            <p className="font-medium">
                              {formatDate(inscription.date_inscription)}
                            </p>
                          </div>
                          {inscription.date_fin && (
                            <div>
                              <span className="text-gray-500">
                                Date de fin:
                              </span>
                              <p className="font-medium">
                                {formatDate(inscription.date_fin)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaGraduationCap className="w-12 h-12 mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    Aucune inscription trouvée
                  </p>
                </div>
              )}
            </ComponentCard>
          </div>

          {/* Colonne de droite - Photo et statistiques */}
          <div className="space-y-6">
            {/* Photo de profil */}
            <ComponentCard title="Photo de Profil">
              <div className="text-center">
                <div className="relative inline-block">
                  {eleve.photo ? (
                    <img
                      src={eleveService.getPhotoUrl(eleve.photo)}
                      alt={`${eleve.prenom} ${eleve.nom}`}
                      className="w-32 h-32 mx-auto rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-32 h-32 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
                      <UserIcon className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <p className="mt-4 text-sm text-gray-500">
                  Matricule: {eleve.matricule}
                </p>
                <p className="text-sm text-gray-500">
                  {eleve.date_inscription
                    ? `Inscrit le: ${formatDate(eleve.date_inscription)}`
                    : "Non inscrit"}
                </p>
              </div>
            </ComponentCard>

            {/* Statistiques */}
            <ComponentCard title="Statistiques">
              <div className="space-y-4">
                {/* {statistiques.moyenne_generale !== undefined && (
                  <div className="text-center p-4 bg-success-50 rounded-lg">
                    <FaChartBar className="w-8 h-8 mx-auto text-success-600" />
                    <p className="mt-2 text-2xl font-bold text-success-600">
                      {statistiques.moyenne_generale.toFixed(2)}
                    </p>
                    <p className="text-sm text-success-600">Moyenne Générale</p>
                  </div>
                )} */}

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-xl font-bold text-red-600">
                      {/* {statistiques.map(stats => {})} */}
                      {statistiques?.absences || 0}
                    </p>
                    <p className="text-xs text-red-600">Absences</p>
                  </div>

                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-xl font-bold text-orange-600">
                      {statistiques?.retards || 0}
                    </p>
                    <p className="text-xs text-orange-600">Retards</p>
                  </div>
                </div>

                {/* {statistiques.dernier_bulletin && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">
                      Dernier Bulletin
                    </p>
                    <p className="text-xs text-gray-500">
                      {statistiques.dernier_bulletin.periode}
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {statistiques.dernier_bulletin.moyenne.toFixed(2)}/20
                    </p>
                  </div>
                )} */}
              </div>
            </ComponentCard>

            {/* Actions rapides */}
            <ComponentCard title="Actions Rapides">
              <div className="space-y-3">
                {/* Bouton d'inscription principal */}
                {inscriptionButtonConfig.type === "already_inscribed" ? (
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-800">
                      {inscriptionButtonConfig.label}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Inscription active
                    </p>
                    <Link
                      to={`/eleves/${eleve.id}/paiements`}
                      className="mt-2 flex items-center justify-center gap-2 w-full px-3 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700"
                    >
                      <FaMoneyBillWave className="w-3 h-3" />
                      Gérer les paiements
                    </Link>
                  </div>
                ) : inscriptionButtonConfig.type !== "disabled" ? (
                  <Link
                    to={inscriptionButtonConfig.to!}
                    className={`flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${inscriptionButtonConfig.className}`}
                  >
                    {inscriptionButtonConfig.icon && (
                      <inscriptionButtonConfig.icon className="w-4 h-4" />
                    )}
                    {inscriptionButtonConfig.label}
                    {anneeActive && (
                      <span className="block text-xs opacity-75 mt-1">
                        {anneeActive.annee}
                      </span>
                    )}
                  </Link>
                ) : (
                  <button
                    disabled
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
                  >
                    <FaExclamationTriangle className="w-4 h-4" />
                    {inscriptionButtonConfig.label}
                  </button>
                )}

                {/* Actions secondaires */}
                <div className="grid grid-cols-1 gap-2">
                  {inscriptionActive && (
                    <>
                      {/* Notes */}
                      <Link
                        to={`/eleves/${eleve.id}/notes`}
                        className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      >
                        <FaChartBar className="w-3 h-3" />
                        Consulter les Notes
                      </Link>

                      {/* Absences */}
                      <Link
                        to={`/eleves/${eleve.id}/absences`}
                        className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      >
                        <FaHistory className="w-3 h-3" />
                        Gérer les Absences
                      </Link>
                    </>
                  )}

                  {/* Historique complet */}
                  <Link
                    to={`/eleves/${eleve.id}/historique`}
                    className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    <FaHistory className="w-3 h-3" />
                    Historique complet
                  </Link>
                </div>
              </div>
            </ComponentCard>
          </div>
        </div>
      </div>
    </>
  );
};

export default EleveProfil;
