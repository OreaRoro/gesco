// app/inscriptions/[id]/edit/page.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { inscriptionService } from "../../services/inscriptionService";
import { eleveService } from "../../services/eleveService";
import { useReferenceData } from "../../hooks/useReferenceData";
import { InscriptionCreateRequest } from "../../interfaces/inscription.interface";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import DatePicker from "../../components/form/date-picker";
import Spinner from "../../components/common/Spinner.tsx";
import { ArrowLeftIcon } from "../../icons";
import {
  FaSave,
  FaExclamationTriangle,
  FaHistory,
  FaCalculator,
  FaMoneyBillWave,
  FaAngleRight,
} from "react-icons/fa";

// Interface pour le formulaire de modification
interface InscriptionFormData {
  classe_id: number;
  date_inscription: string;
  frais_inscription: number;
  frais_scolarite: number;
  remises: number;
  modalites_paiement: string;
  observations: string;
  annee_scolaire_id: number;
}

const InscriptionEditForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { classes, getNiveauById } = useReferenceData();

  const [loading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [inscription, setInscription] = useState<any>(null);
  const [eleve, setEleve] = useState<any>(null);
  const [paiementsExistants, setPaiementsExistants] = useState<any[]>([]);
  const [hasPaiements, setHasPaiements] = useState(false);
  const [changements, setChangements] = useState<string[]>([]);
  const [fraisClasse, setFraisClasse] = useState<{
    frais_inscription: number;
    montant: number;
  } | null>(null);

  // NOUVEAU: État pour stocker les classes déjà occupées
  const [classesOccupees, setClassesOccupees] = useState<number[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
    reset,
  } = useForm<InscriptionFormData>();

  // Watch pour les calculs
  const watchedClasseId = watch("classe_id");
  const watchedFraisInscription = Number(watch("frais_inscription")) || 0;
  const watchedFraisScolarite = Number(watch("frais_scolarite")) || 0;
  const watchedRemises = Number(watch("remises")) || 0;

  const totalAPayer =
    watchedFraisInscription + watchedFraisScolarite - watchedRemises;
  const montantDejaPaye = paiementsExistants.reduce(
    (sum, p) => sum + Number(p.montant),
    0
  );
  const soldeRestant = totalAPayer - montantDejaPaye;

  useEffect(() => {
    if (id) {
      loadInscriptionData(parseInt(id));
    }
  }, [id]);

  useEffect(() => {
    if (watchedClasseId) {
      loadFraisClasse(watchedClasseId);
    }
  }, [watchedClasseId]);

  const loadInscriptionData = async (inscriptionId: number) => {
    setLoadingData(true);
    try {
      // Charger l'inscription
      const inscriptionResponse = await inscriptionService.getById(
        inscriptionId
      );
      const inscriptionData = inscriptionResponse?.data?.inscription;
      setInscription(inscriptionData);

      const eleveId = inscriptionResponse?.data?.inscription?.eleve_id;

      // Charger les données de l'élève
      const eleveResponse = await eleveService.getById(eleveId);
      setEleve(eleveResponse.data.eleve);

      // Charger les paiements existants
      const paiementsResponse = await inscriptionService.getPaiements(
        inscriptionId
      );
      const paiements = paiementsResponse.data.paiements || [];
      setPaiementsExistants(paiements);
      setHasPaiements(paiements.length > 0);

      // NOUVEAU: Charger les classes déjà occupées pour cette année scolaire
      await loadClassesOccupees(inscriptionData.annee_scolaire_id);

      // Pré-remplir le formulaire
      reset({
        classe_id: inscriptionData.classe_id,
        date_inscription: inscriptionData.date_inscription,
        frais_inscription: inscriptionData.frais_inscription,
        frais_scolarite: inscriptionData.frais_scolarite,
        remises: inscriptionData.remises,
        modalites_paiement: inscriptionData.modalites_paiement,
        observations: inscriptionData.observations,
        annee_scolaire_id: inscriptionData.annee_scolaire_id,
      });
    } catch (error: any) {
      console.error("Erreur chargement inscription:", error);
      toast.error("Erreur lors du chargement de l'inscription");
    } finally {
      setLoadingData(false);
    }
  };

  // NOUVELLE FONCTION: Charger les classes déjà occupées
  const loadClassesOccupees = async (anneeScolaireId: number) => {
    try {
      // Récupérer toutes les inscriptions de l'année scolaire
      const response = await inscriptionService.getByAnneeScolaire(
        anneeScolaireId
      );
      const inscriptions = response.data.inscriptions || [];

      // Extraire les IDs de classes déjà utilisées
      const classesUtilisees = inscriptions
        .filter(
          (inscription: { classe_id: any; statut: string }) =>
            inscription.classe_id && inscription.statut === "active"
        )
        .map((inscription: { classe_id: any }) => inscription.classe_id);

      setClassesOccupees(classesUtilisees);
    } catch (error) {
      console.error("Erreur chargement classes occupées:", error);
      // En cas d'erreur, on initialise avec un tableau vide
      setClassesOccupees([]);
    }
  };

  const loadFraisClasse = async (classeId: number) => {
    try {
      const response = await inscriptionService.getFraisParClasse(classeId);
      const frais = response.data.frais;
      setFraisClasse(frais);

      // Mettre à jour les frais si la classe change
      if (frais) {
        setValue("frais_inscription", frais.frais_inscription);
        setValue("frais_scolarite", frais.montant);
      }
    } catch (error) {
      console.error("Erreur chargement frais:", error);
      setFraisClasse(null);
    }
  };

  // NOUVELLE FONCTION: Filtrer les classes disponibles
  const getClassesDisponiblesFiltrees = () => {
    if (!inscription) return [];

    // Classes de l'année scolaire de l'inscription
    const classesAnnee = classes.filter(
      (classe) => classe.annee_scolaire_id === inscription.annee_scolaire_id
    );

    // Filtrer pour exclure les classes déjà occupées, SAUF la classe actuelle de l'élève
    return classesAnnee.filter((classe) => {
      // Toujours inclure la classe actuelle de l'élève
      if (classe.id === inscription.classe_id) {
        return true;
      }

      // Exclure les autres classes qui sont déjà occupées
      return !classesOccupees.includes(classe.id);
    });
  };

  const onSubmit = async (formData: InscriptionFormData) => {
    if (!id || !inscription) return;

    // Validation des changements
    const nouveauxChangements = detecterChangements(inscription, formData);
    if (nouveauxChangements.length === 0) {
      toast.info("Aucune modification détectée");
      return;
    }

    setLoadingData(true);
    try {
      // Préparer les données pour la mise à jour
      const updateData: Partial<InscriptionCreateRequest> = {
        classe_id: formData.classe_id,
        date_inscription: formData.date_inscription,
        frais_inscription: formData.frais_inscription,
        frais_scolarite: formData.frais_scolarite,
        remises: formData.remises,
        modalites_paiement: formData.modalites_paiement,
        observations: formData.observations,
        montant_inscription: totalAPayer,
        // Garder les champs inchangés
        eleve_id: inscription.eleve_id,
        annee_scolaire_id: inscription.annee_scolaire_id,
        statut: inscription.statut,
        montant_paye: inscription.montant_paye,
      };

      // Validation spéciale pour les paiements existants
      if (
        hasPaiements &&
        formData.frais_scolarite < inscription.frais_scolarite
      ) {
        if (
          !window.confirm(
            "Vous réduisez les frais de scolarité alors que des paiements existent. " +
              "Cela peut créer un solde négatif. Continuer ?"
          )
        ) {
          setLoadingData(false);
          return;
        }
      }

      await inscriptionService.update(parseInt(id), updateData);

      toast.success("Inscription modifiée avec succès !");
      navigate(`/eleves/${inscription.eleve_id}`, {
        state: { message: "Inscription mise à jour avec succès" },
      });
    } catch (error: any) {
      console.error("Erreur modification:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.messages?.error ||
        "Erreur lors de la modification";
      toast.error(errorMessage);
    } finally {
      setLoadingData(false);
    }
  };

  const detecterChangements = (ancien: any, nouveau: any): string[] => {
    const changes: string[] = [];

    // Fonction utilitaire pour formater les nombres en toute sécurité
    const formatMontant = (value: number | undefined | null): string => {
      if (value === undefined || value === null) return "0";
      return value.toLocaleString("fr-FR");
    };

    if (ancien.classe_id !== nouveau.classe_id) {
      const ancienneClasse = classes.find((c) => c.id === ancien.classe_id);
      const nouvelleClasse = classes.find((c) => c.id === nouveau.classe_id);
      changes.push(
        `Classe: ${ancienneClasse?.nom || ancien.classe_id} → ${
          nouvelleClasse?.nom || nouveau.classe_id
        }`
      );
    }

    if (ancien.frais_inscription !== nouveau.frais_inscription) {
      changes.push(
        `Frais inscription: ${formatMontant(
          ancien.frais_inscription
        )} Ar → ${formatMontant(nouveau.frais_inscription)} Ar`
      );
    }

    if (ancien.frais_scolarite !== nouveau.frais_scolarite) {
      changes.push(
        `Frais scolarité: ${formatMontant(
          ancien.frais_scolarite
        )} Ar → ${formatMontant(nouveau.frais_scolarite)} Ar`
      );
    }

    if (ancien.remises !== nouveau.remises) {
      changes.push(
        `Remises: ${formatMontant(ancien.remises)} Ar → ${formatMontant(
          nouveau.remises
        )} Ar`
      );
    }

    if (ancien.modalites_paiement !== nouveau.modalites_paiement) {
      changes.push(
        `Modalités: ${ancien.modalites_paiement || "Aucune"} → ${
          nouveau.modalites_paiement || "Aucune"
        }`
      );
    }

    if (ancien.date_inscription !== nouveau.date_inscription) {
      changes.push(
        `Date inscription: ${ancien.date_inscription} → ${nouveau.date_inscription}`
      );
    }

    setChangements(changes);
    return changes;
  };

  const onError = (errors: any) => {
    console.log("Erreurs de validation:", errors);

    if (errors.classe_id) {
      toast.error("Veuillez sélectionner une classe");
    } else if (errors.date_inscription) {
      toast.error("Veuillez sélectionner une date d'inscription valide");
    } else if (errors.frais_inscription || errors.frais_scolarite) {
      toast.error("Veuillez vérifier les montants des frais");
    } else {
      toast.error("Veuillez corriger les erreurs dans le formulaire");
    }
  };

  const handleReset = () => {
    if (inscription) {
      reset({
        classe_id: inscription.classe_id,
        date_inscription: inscription.date_inscription,
        frais_inscription: inscription.frais_inscription,
        frais_scolarite: inscription.frais_scolarite,
        remises: inscription.remises,
        modalites_paiement: inscription.modalites_paiement,
        observations: inscription.observations,
        annee_scolaire_id: inscription.annee_scolaire_id,
      });
      toast.info("Formulaire réinitialisé aux valeurs d'origine");
    }
  };

  // Utiliser la nouvelle fonction de filtrage
  const classesDisponibles = getClassesDisponiblesFiltrees();

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
        <span className="ml-2">Chargement de l'inscription...</span>
      </div>
    );
  }

  if (!inscription || !eleve) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Inscription non trouvée
          </h2>
          <button
            onClick={() => navigate(-1)}
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
        title={`Modifier l'inscription de ${eleve.prenom} ${eleve.nom} | Système de Gestion Scolaire`}
        description={`Modification de l'inscription pour ${eleve.prenom} ${eleve.nom}`}
      />

      <PageBreadcrumb
        pageTitle={`Modifier l'inscription de ${eleve.prenom} ${eleve.nom}`}
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Élèves", path: "/eleves" },
          {
            label: `${eleve.prenom} ${eleve.nom}`,
            path: `/eleves/${eleve.id}`,
          },
          { label: "Modifier Inscription", path: `/inscriptions/${id}/edit` },
        ]}
      />

      <div className="space-y-6">
        {/* En-tête avec bouton retour */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Retour
          </button>
        </div>

        {/* Alertes importantes */}
        {hasPaiements && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-900/20 dark:border-yellow-800">
            <div className="flex items-center gap-3">
              <FaAngleRight className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
              <div>
                <h3 className="font-medium text-yellow-800 dark:text-yellow-400">
                  Paiements existants détectés
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Des modifications peuvent affecter les soldes et l'historique
                  des paiements. Montant déjà payé:{" "}
                  <strong>{montantDejaPaye.toLocaleString()} Ar</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* NOUVELLE ALERTE: Classes disponibles */}
        {classesDisponibles.length === 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
            <div className="flex items-center gap-3">
              <FaExclamationTriangle className="w-5 h-5 text-red-600 dark:text-red-500" />
              <div>
                <h3 className="font-medium text-red-800 dark:text-red-400">
                  Aucune classe disponible
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Toutes les classes de cette année scolaire sont déjà occupées.
                  Vous ne pouvez pas modifier la classe actuelle.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Formulaire de modification */}
          <div className="lg:col-span-2">
            <ComponentCard title="Modifier l'Inscription">
              <form
                onSubmit={handleSubmit(onSubmit, onError)}
                className="space-y-6"
              >
                {/* Informations de base */}
                <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-800">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Informations de l'inscription
                  </h4>
                  <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Élève:
                      </span>
                      <p className="font-medium dark:text-white">
                        {eleve.prenom} {eleve.nom}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Statut inscription:
                      </span>
                      <p className="font-medium capitalize dark:text-white">
                        {inscription.statut}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Date création:
                      </span>
                      <p className="font-medium dark:text-white">
                        {new Date(inscription.created_at).toLocaleDateString(
                          "fr-FR"
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Dernière modification:
                      </span>
                      <p className="font-medium dark:text-white">
                        {new Date(inscription.updated_at).toLocaleDateString(
                          "fr-FR"
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section Scolarité */}
                <div className="border-b border-gray-200 pb-6 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Informations Scolaires
                  </h3>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* Classe */}
                    <div>
                      <label
                        htmlFor="classe_id"
                        className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300"
                      >
                        Classe <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="classe_id"
                        {...register("classe_id", {
                          required: "La classe est obligatoire",
                          valueAsNumber: true,
                        })}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                          errors.classe_id
                            ? "border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        } dark:bg-gray-800 dark:text-white`}
                        disabled={classesDisponibles.length === 0}
                      >
                        <option value="">Sélectionnez une classe</option>
                        {classesDisponibles
                          .filter(
                            (classe) => classe.effectif < classe.capacite_max
                          )
                          .map((classe) => {
                            const niveau = getNiveauById(classe.niveau_id);
                            const isClasseActuelle =
                              classe.id === inscription.classe_id;
                            return (
                              <option
                                key={classe.id}
                                value={classe.id}
                                disabled={
                                  classe.effectif >= classe.capacite_max
                                }
                              >
                                {niveau?.nom} - {classe.nom}
                                {classe.effectif !== undefined &&
                                  ` (${classe.effectif}/${classe.capacite_max})`}
                                {classe.effectif >= classe.capacite_max &&
                                  " ⚠️ Classe pleine"}
                                {isClasseActuelle && " ← Classe actuelle"}
                              </option>
                            );
                          })}
                      </select>
                      {errors.classe_id && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.classe_id.message}
                        </p>
                      )}
                      {/* NOUVEAU: Indication sur les classes disponibles */}
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {classesDisponibles.length} classe(s) disponible(s) -
                        Les classes déjà occupées sont masquées
                      </p>
                    </div>

                    {/* Date d'inscription */}
                    <DatePicker
                      id="date_inscription"
                      name="date_inscription"
                      label="Date d'Inscription"
                      placeholder="Sélectionnez la date d'inscription"
                      register={register}
                      setValue={setValue}
                      validation={{
                        required: "La date d'inscription est obligatoire",
                      }}
                      error={errors.date_inscription}
                    />
                  </div>
                </div>

                {/* Section Frais */}
                <div className="border-b border-gray-200 pb-6 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Frais de Scolarité
                  </h3>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {/* Frais d'inscription */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                        Frais d'Inscription{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        name="frais_inscription"
                        placeholder="0"
                        register={register}
                        validation={{
                          required: "Les frais d'inscription sont obligatoires",
                          min: {
                            value: 0,
                            message: "Les frais ne peuvent pas être négatifs",
                          },
                        }}
                        error={errors.frais_inscription}
                        disabled={fraisClasse !== null}
                        hint={fraisClasse ? "Défini automatiquement" : ""}
                      />
                    </div>

                    {/* Frais de scolarité */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                        Frais de Scolarité{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        name="frais_scolarite"
                        placeholder="0"
                        register={register}
                        validation={{
                          required: "Les frais de scolarité sont obligatoires",
                          min: {
                            value: 0,
                            message: "Les frais ne peuvent pas être négatifs",
                          },
                        }}
                        error={errors.frais_scolarite}
                        disabled={fraisClasse !== null}
                        hint={fraisClasse ? "Défini automatiquement" : ""}
                      />
                    </div>

                    {/* Remises */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                        Remises
                      </label>
                      <Input
                        type="number"
                        name="remises"
                        placeholder="0"
                        register={register}
                        validation={{
                          min: {
                            value: 0,
                            message:
                              "Les remises ne peuvent pas être négatives",
                          },
                        }}
                        error={errors.remises}
                      />
                    </div>
                  </div>

                  {/* Total à payer */}
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg dark:bg-blue-900/20">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-blue-900 dark:text-blue-400">
                        Total à payer:
                      </span>
                      <span className="text-xl font-bold text-blue-900 dark:text-blue-400">
                        {totalAPayer.toLocaleString("fr-FR")} Ar
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section Informations complémentaires */}
                <div className="border-b border-gray-200 pb-6 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Informations Complémentaires
                  </h3>

                  <div className="grid grid-cols-1 gap-6">
                    {/* Modalités de paiement */}
                    <div>
                      <label
                        htmlFor="modalites_paiement"
                        className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300"
                      >
                        Modalités de Paiement
                      </label>
                      <select
                        id="modalites_paiement"
                        {...register("modalites_paiement")}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      >
                        <option value="">Choisissez une modalité</option>
                        <option value="comptant">Paiement comptant</option>
                        <option value="2_tranches">2 tranches</option>
                        <option value="3_tranches">3 tranches</option>
                        <option value="4_tranches">4 tranches</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>

                    {/* Observations */}
                    <div>
                      <label
                        htmlFor="observations"
                        className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300"
                      >
                        Observations
                      </label>
                      <textarea
                        id="observations"
                        rows={3}
                        {...register("observations")}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        placeholder="Notes ou observations supplémentaires..."
                      />
                    </div>
                  </div>
                </div>

                {/* Section des changements détectés */}
                {changements.length > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
                    <h4 className="font-medium text-blue-900 dark:text-blue-400 mb-2">
                      Changements détectés:
                    </h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-300 list-disc list-inside">
                      {changements.map((change, index) => (
                        <li key={index}>{change}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-4 pt-6 sm:flex-row sm:justify-end sm:items-center">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-6 py-3 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                    disabled={loading}
                  >
                    Réinitialiser
                  </button>

                  <Link
                    to={`/eleves/${eleve.id}`}
                    className="px-6 py-3 text-sm font-medium text-gray-700 text-center transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Annuler
                  </Link>

                  <button
                    type="submit"
                    disabled={loading || !isDirty}
                    className={`flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white transition-colors rounded-lg ${
                      loading || !isDirty
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-brand-500 hover:bg-brand-600"
                    }`}
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" color="white" />
                        Modification en cours...
                      </>
                    ) : (
                      <>
                        <FaSave className="w-4 h-4" />
                        Enregistrer les modifications
                      </>
                    )}
                  </button>
                </div>
              </form>
            </ComponentCard>
          </div>

          {/* Colonne de droite - Informations contextuelles */}
          <div className="space-y-6">
            {/* Récapitulatif financier */}
            <ComponentCard title="Situation Financière">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Total à payer:
                  </span>
                  <span className="font-medium dark:text-white">
                    {totalAPayer.toLocaleString()} Ar
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Déjà payé:
                  </span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {montantDejaPaye.toLocaleString()} Ar
                  </span>
                </div>
                <hr className="dark:border-gray-600" />
                <div className="flex justify-between">
                  <span className="text-sm font-medium dark:text-white">
                    Solde restant:
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      soldeRestant < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {soldeRestant.toLocaleString()} Ar
                  </span>
                </div>
                {soldeRestant < 0 && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    ⚠️ Solde négatif - l'élève a payé plus que le nouveau total
                  </p>
                )}
              </div>
            </ComponentCard>

            {/* NOUVEAU: Informations sur les classes */}
            <ComponentCard title="Disponibilité des Classes">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Classes totales:
                  </span>
                  <span className="font-medium dark:text-white">
                    {
                      classes.filter(
                        (c) =>
                          c.annee_scolaire_id === inscription.annee_scolaire_id
                      ).length
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Classes disponibles:
                  </span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {classesDisponibles.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Classes occupées:
                  </span>
                  <span className="font-medium text-orange-600 dark:text-orange-400">
                    {classesOccupees.length}
                  </span>
                </div>
              </div>
            </ComponentCard>

            {/* Historique des modifications */}
            <ComponentCard title="Dernières Modifications">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded dark:bg-gray-800">
                  <FaHistory className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium dark:text-white">Création</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(inscription.created_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded dark:bg-gray-800">
                  <FaHistory className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium dark:text-white">
                      Dernière modification
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(inscription.updated_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                </div>
              </div>
            </ComponentCard>

            {/* Informations importantes */}
            <ComponentCard title="Informations Importantes">
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start gap-2">
                  <FaCalculator className="w-4 h-4 mt-0.5 text-blue-500" />
                  <p>
                    Les frais sont calculés automatiquement selon la classe
                    sélectionnée.
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <FaMoneyBillWave className="w-4 h-4 mt-0.5 text-green-500" />
                  <p>
                    Les remises doivent être approuvées par l'administration.
                  </p>
                </div>

                {hasPaiements && (
                  <div className="flex items-start gap-2">
                    <FaExclamationTriangle className="w-4 h-4 mt-0.5 text-yellow-500" />
                    <p className="text-yellow-700 dark:text-yellow-400">
                      Les modifications affectent la situation financière
                      existante.
                    </p>
                  </div>
                )}
              </div>
            </ComponentCard>
          </div>
        </div>
      </div>
    </>
  );
};

export default InscriptionEditForm;
