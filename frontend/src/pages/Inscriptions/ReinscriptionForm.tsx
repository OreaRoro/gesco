// components/ReinscriptionForm.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { eleveService } from "../../services/eleveService";
import { inscriptionService } from "../../services/inscriptionService";
import { useAnneeScolaire } from "../../context/AnneeScolaireContext";
import { useReferenceData } from "../../hooks/useReferenceData";
import { InscriptionCreateRequest } from "../../interfaces/inscription.interface";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import DatePicker from "../../components/form/date-picker";
import Spinner from "../../components/common/Spinner";
import { ArrowLeftIcon } from "../../icons";
import {
  FaCalculator,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaHistory,
  FaRedo,
} from "react-icons/fa";

interface ReinscriptionFormData {
  annee_scolaire_id: number;
  classe_id: number;
  date_inscription: string;
  frais_inscription: number;
  frais_scolarite: number;
  remises: number;
  modalites_paiement: string;
  observations?: string;
}

const ReinscriptionForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { anneeActive } = useAnneeScolaire();
  const {
    classes,
    loading: loadingRef,
    error: errorRef,
    getClassesDisponibles,
    getNiveauById,
  } = useReferenceData();

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [eleve, setEleve] = useState<any>(null);
  const [historiqueInscriptions, setHistoriqueInscriptions] = useState<any[]>(
    []
  );
  const [fraisClasse, setFraisClasse] = useState<{
    frais_inscription: number;
    frais_scolarite: number;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<ReinscriptionFormData>({
    defaultValues: {
      annee_scolaire_id: anneeActive?.id || 0,
      date_inscription: new Date().toISOString().split("T")[0],
      classe_id: 0,
      frais_inscription: 0,
      frais_scolarite: 0,
      remises: 0,
      modalites_paiement: "",
      observations: "",
    },
  });

  // Watch pour les calculs en temps réel
  const watchedClasseId = watch("classe_id");
  const watchedFraisInscription = Number(watch("frais_inscription")) || 0;
  const watchedFraisScolarite = Number(watch("frais_scolarite")) || 0;
  const watchedRemises = Number(watch("remises")) || 0;

  // Calcul du total
  const totalAPayer =
    watchedFraisInscription + watchedFraisScolarite - watchedRemises;

  // Classes disponibles pour l'année active
  const classesDisponibles = anneeActive ? getClassesDisponibles() : classes;

  useEffect(() => {
    if (id) {
      loadFormData(parseInt(id));
    }
  }, [id]);

  useEffect(() => {
    if (watchedClasseId) {
      loadFraisClasse(watchedClasseId);
    }
  }, [watchedClasseId]);

  const loadFormData = async (eleveId: number) => {
    setLoadingData(true);
    try {
      // Charger les données de l'élève
      const eleveResponse = await eleveService.getById(eleveId);
      setEleve(eleveResponse.data.eleve);

      // Charger l'historique des inscriptions
      const inscriptionsResponse = await inscriptionService.getByEleve(eleveId);
      setHistoriqueInscriptions(inscriptionsResponse.data.inscriptions || []);

      // Pré-remplir avec la dernière inscription si disponible
      const derniereInscription = inscriptionsResponse.data.inscriptions?.[0];
      if (derniereInscription) {
        // Suggérer la classe suivante si possible
        const classeActuelle = classes.find(
          (c: any) => c.id === derniereInscription.classe_id
        );
        if (classeActuelle) {
          const niveauActuel = getNiveauById(classeActuelle.niveau_id);
          // Trouver une classe du niveau suivant
          const classeSuivante = classes.find((c: any) => {
            const niveau = getNiveauById(c.niveau_id);
            return niveau && niveau.ordre === niveauActuel?.ordre + 1;
          });
          if (classeSuivante) {
            setValue("classe_id", classeSuivante.id);
          } else {
            setValue("classe_id", derniereInscription.classe_id);
          }
        }
      }

      // Définir l'année active par défaut
      if (anneeActive) {
        setValue("annee_scolaire_id", anneeActive.id);
      }
    } catch (error: any) {
      console.error("Erreur chargement données:", error);
      toast.error("Erreur lors du chargement des données de l'élève");
      navigate(`/eleves/${id}`);
    } finally {
      setLoadingData(false);
    }
  };

  const loadFraisClasse = async (classeId: number) => {
    try {
      const response = await inscriptionService.getFraisParClasse(classeId);
      const frais = response.data.frais;

      setFraisClasse(frais);
      setValue("frais_inscription", frais.frais_inscription);
      setValue("frais_scolarite", frais.montant);
    } catch (error) {
      console.error("Erreur chargement frais:", error);
      // Si les frais ne sont pas disponibles, on laisse l'utilisateur les saisir
      setFraisClasse(null);
      setValue("frais_inscription", 0);
      setValue("frais_scolarite", 0);
    }
  };

  const onSubmit = async (formData: ReinscriptionFormData) => {
    if (!id || !anneeActive) return;

    // Validation supplémentaire
    if (!anneeActive) {
      toast.error("Aucune année scolaire active n'est configurée");
      return;
    }

    setLoading(true);
    try {
      const reinscriptionData: InscriptionCreateRequest = {
        eleve_id: parseInt(id),
        annee_scolaire_id: anneeActive.id,
        classe_id: formData.classe_id,
        date_inscription: formData.date_inscription,
        montant_inscription: totalAPayer,
        frais_inscription: formData.frais_inscription || 0,
        frais_scolarite: formData.frais_scolarite || 0,
        remises: formData.remises || 0,
        modalites_paiement: formData.modalites_paiement || "",
        observations: formData.observations || "",
        statut: "reinscrit" as const,
        montant_paye: 0,
      };

      const response = await inscriptionService.create(reinscriptionData);

      toast.success("Élève réinscrit avec succès !");

      // Redirection vers la page de paiement
      navigate(`/eleves/${id}/paiements`, {
        state: {
          nouvelleInscription: response.data.inscription,
          totalAPayer: totalAPayer,
          eleve: eleve,
        },
        replace: true,
      });
    } catch (error: any) {
      console.error("Erreur réinscription:", error);
      const errorMessage =
        error.response?.data?.messages?.error ||
        "Erreur lors de la réinscription";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onError = (errors: any) => {
    console.log("Erreurs de validation:", errors);

    if (errors.classe_id) {
      toast.error("Veuillez sélectionner une classe");
    } else if (errors.date_inscription) {
      toast.error("Veuillez sélectionner une date d'inscription");
    } else {
      toast.error("Veuillez corriger les erreurs dans le formulaire");
    }
  };

  const handleReset = () => {
    reset({
      annee_scolaire_id: anneeActive?.id || 0,
      classe_id: 0,
      date_inscription: new Date().toISOString().split("T")[0],
      frais_inscription: 0,
      frais_scolarite: 0,
      remises: 0,
      modalites_paiement: "",
      observations: "",
    });
    setFraisClasse(null);
    toast.info("Formulaire réinitialisé");
  };

  if (loadingData || loadingRef) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
        <span className="ml-2">Chargement des données...</span>
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
          <Link to="/eleves" className="text-brand-600 hover:text-brand-700">
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  if (errorRef) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FaExclamationTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Erreur de chargement
          </h2>
          <p className="text-gray-600 mb-4">{errorRef}</p>
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
        title={`Réinscrire ${eleve.prenom} ${eleve.nom} | Système de Gestion Scolaire`}
        description={`Formulaire de réinscription pour ${eleve.prenom} ${eleve.nom}`}
      />

      <PageBreadcrumb
        pageTitle={`Réinscrire ${eleve.prenom} ${eleve.nom}`}
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Élèves", path: "/eleves" },
          { label: `${eleve.prenom} ${eleve.nom}`, path: `/eleves/${id}` },
          { label: "Réinscription", path: `/eleves/${id}/reinscrire` },
        ]}
      />

      <div className="space-y-6">
        {/* En-tête avec bouton retour */}
        <div className="flex items-center justify-between">
          <Link
            to={`/eleves/${id}`}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Retour au profil
          </Link>
        </div>

        {/* Bannière d'information sur la réinscription */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <FaRedo className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="font-medium text-green-900">
                Processus de réinscription
              </h3>
              <p className="text-sm text-green-700">
                Réinscription de l'élève pour l'année scolaire{" "}
                {anneeActive?.annee}
              </p>
            </div>
          </div>
        </div>

        {/* Historique des inscriptions */}
        {historiqueInscriptions.length > 0 && (
          <ComponentCard title="Historique des inscriptions">
            <div className="space-y-3">
              {historiqueInscriptions.map((inscription) => (
                <div
                  key={inscription.id}
                  className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-blue-900">
                      {inscription.annee_scolaire_annee} -{" "}
                      {inscription.classe_nom}
                    </p>
                    <p className="text-sm text-blue-700">
                      Statut:{" "}
                      <span className="capitalize">{inscription.statut}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-blue-900">
                      {Number(inscription.montant_inscription).toLocaleString(
                        "fr-FR"
                      )}{" "}
                      Ar
                    </p>
                    <p className="text-xs text-blue-700">
                      Payé:{" "}
                      {Number(inscription.montant_paye).toLocaleString("fr-FR")}{" "}
                      Ar
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ComponentCard>
        )}

        {/* Bannière d'information sur l'année scolaire */}
        {anneeActive ? (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">
                  Réinscription pour l'année scolaire {anneeActive.annee}
                </h3>
                <p className="text-sm text-blue-700">
                  Période du{" "}
                  {new Date(anneeActive.date_debut).toLocaleDateString("fr-FR")}
                  au{" "}
                  {new Date(anneeActive.date_fin).toLocaleDateString("fr-FR")}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {classesDisponibles.length} classe(s) disponible(s) pour cette
                  année
                </p>
              </div>
              <span className="px-3 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
                Active
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-3">
              <FaExclamationTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-800">
                  Aucune année scolaire active
                </h3>
                <p className="text-sm text-yellow-700">
                  Veuillez configurer une année scolaire active avant de
                  procéder aux réinscriptions.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Formulaire de réinscription */}
          <div className="lg:col-span-2">
            <ComponentCard title="Formulaire de Réinscription">
              <form
                onSubmit={handleSubmit(onSubmit, onError)}
                className="space-y-6"
              >
                {/* Informations de l'élève */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">
                    Élève à réinscrire
                  </h4>
                  <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                    <div>
                      <span className="text-gray-600">Nom complet:</span>
                      <p className="font-medium">
                        {eleve.prenom} {eleve.nom}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Matricule:</span>
                      <p className="font-medium">{eleve.matricule}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Date de naissance:</span>
                      <p className="font-medium">
                        {new Date(eleve.date_naissance).toLocaleDateString(
                          "fr-FR"
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Statut actuel:</span>
                      <p className="font-medium capitalize">{eleve.statut}</p>
                    </div>
                  </div>
                </div>

                {/* Section Scolarité */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Informations Scolaires
                  </h3>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* Année Scolaire (lecture seule) */}
                    <div>
                      <label
                        htmlFor="annee_scolaire_id"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Année Scolaire <span className="text-red-500">*</span>
                      </label>
                      {anneeActive ? (
                        <div className="p-3 bg-gray-100 border border-gray-300 rounded-lg">
                          <p className="font-medium">{anneeActive.annee}</p>
                          <p className="text-sm text-gray-600">
                            Année scolaire active
                          </p>
                          <input
                            type="hidden"
                            {...register("annee_scolaire_id", {
                              required: "L'année scolaire est obligatoire",
                              valueAsNumber: true,
                            })}
                          />
                        </div>
                      ) : (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            Aucune année scolaire active
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Classe */}
                    <div>
                      <label
                        htmlFor="classe_id"
                        className="block text-sm font-medium text-gray-700 mb-2"
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
                            : "border-gray-300"
                        } ${
                          !anneeActive ? "bg-gray-100 cursor-not-allowed" : ""
                        } dark:bg-gray-800 dark:border-gray-700 dark:text-white`}
                        disabled={
                          !anneeActive || classesDisponibles.length === 0
                        }
                      >
                        <option value="">Sélectionnez une classe</option>
                        {classesDisponibles
                          .filter(
                            (classe) => classe.effectif < classe.capacite_max
                          )
                          .map((classe) => {
                            const niveau = getNiveauById(classe.niveau_id);
                            return (
                              <option key={classe.id} value={classe.id}>
                                {niveau?.nom} - {classe.nom}
                                {classe.effectif !== undefined &&
                                  ` (${classe.effectif}/${classe.capacite_max})`}
                              </option>
                            );
                          })}
                      </select>
                      {errors.classe_id && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.classe_id.message}
                        </p>
                      )}
                      {!anneeActive && (
                        <p className="mt-1 text-sm text-yellow-600">
                          Sélectionnez d'abord une année scolaire active
                        </p>
                      )}
                      {anneeActive && classesDisponibles.length === 0 && (
                        <p className="mt-1 text-sm text-yellow-600">
                          Aucune classe disponible pour cette année scolaire
                        </p>
                      )}
                    </div>

                    {/* Date d'inscription */}
                    <DatePicker
                      id="date_inscription"
                      name="date_inscription"
                      label="Date de Réinscription"
                      placeholder="Sélectionnez la date de réinscription"
                      register={register}
                      setValue={setValue}
                      validation={{
                        required: "La date de réinscription est obligatoire",
                      }}
                      error={errors.date_inscription}
                    />
                  </div>
                </div>

                {/* Section Frais */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Frais de Scolarité
                  </h3>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {/* Frais d'inscription */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Frais d'Inscription{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        name="frais_inscription"
                        placeholder="0"
                        register={register}
                        validation={{
                          min: {
                            value: 0,
                            message: "Les frais ne peuvent pas être négatifs",
                          },
                        }}
                        error={errors.frais_inscription}
                        disabled={fraisClasse !== null || !anneeActive}
                        hint={fraisClasse ? "Défini automatiquement" : ""}
                      />
                    </div>

                    {/* Frais de scolarité */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Frais de Scolarité{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        name="frais_scolarite"
                        placeholder="0"
                        register={register}
                        validation={{
                          min: {
                            value: 0,
                            message: "Les frais ne peuvent pas être négatifs",
                          },
                        }}
                        error={errors.frais_scolarite}
                        disabled={fraisClasse !== null || !anneeActive}
                        hint={fraisClasse ? "Défini automatiquement" : ""}
                      />
                    </div>

                    {/* Remises */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        disabled={!anneeActive}
                      />
                    </div>
                  </div>

                  {/* Total à payer */}
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-blue-900">
                        Total à payer:
                      </span>
                      <span className="text-xl font-bold text-blue-900">
                        {totalAPayer.toLocaleString("fr-FR")} Ar
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section Informations complémentaires */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Informations Complémentaires
                  </h3>

                  <div className="grid grid-cols-1 gap-6">
                    {/* Modalités de paiement */}
                    <div>
                      <label
                        htmlFor="modalites_paiement"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Modalités de Paiement
                      </label>
                      <select
                        id="modalites_paiement"
                        {...register("modalites_paiement")}
                        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                          !anneeActive ? "bg-gray-100 cursor-not-allowed" : ""
                        } dark:bg-gray-800 dark:border-gray-700 dark:text-white`}
                        disabled={!anneeActive}
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
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Observations
                      </label>
                      <textarea
                        id="observations"
                        rows={3}
                        {...register("observations")}
                        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                          !anneeActive ? "bg-gray-100 cursor-not-allowed" : ""
                        } dark:bg-gray-800 dark:border-gray-700 dark:text-white`}
                        placeholder="Notes ou observations supplémentaires..."
                        disabled={!anneeActive}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions du formulaire */}
                <div className="flex flex-col gap-4 pt-6 sm:flex-row sm:justify-end sm:items-center">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-6 py-3 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                    disabled={loading || !anneeActive}
                  >
                    Réinitialiser
                  </button>

                  <Link
                    to={`/eleves/${id}`}
                    className="px-6 py-3 text-sm font-medium text-gray-700 text-center transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Annuler
                  </Link>

                  <button
                    type="submit"
                    disabled={
                      loading || !anneeActive || classesDisponibles.length === 0
                    }
                    className={`flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white transition-colors rounded-lg ${
                      loading || !anneeActive || classesDisponibles.length === 0
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" color="white" />
                        Réinscription en cours...
                      </>
                    ) : (
                      <>
                        <FaRedo className="w-4 h-4" />
                        Confirmer la Réinscription
                      </>
                    )}
                  </button>
                </div>

                {!anneeActive && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FaExclamationTriangle className="w-4 h-4 text-yellow-600" />
                      <p className="text-sm text-yellow-800">
                        Veuillez sélectionner une année scolaire active pour
                        pouvoir réinscrire un élève.
                      </p>
                    </div>
                  </div>
                )}
              </form>
            </ComponentCard>
          </div>

          {/* Colonne de droite - Récapitulatif et informations */}
          <div className="space-y-6">
            {/* Récapitulatif des frais */}
            <ComponentCard title="Récapitulatif des Frais">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Frais d'inscription:
                  </span>
                  <span className="font-medium">
                    {watchedFraisInscription.toLocaleString("fr-FR")} Ar
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Frais de scolarité:
                  </span>
                  <span className="font-medium">
                    {watchedFraisScolarite.toLocaleString("fr-FR")} Ar
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Remises:</span>
                  <span className="font-medium text-red-600">
                    -{watchedRemises.toLocaleString("fr-FR")} Ar
                  </span>
                </div>

                <hr className="my-2" />

                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    Total à payer:
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    {totalAPayer.toLocaleString("fr-FR")} Ar
                  </span>
                </div>
              </div>
            </ComponentCard>

            {/* Informations importantes pour la réinscription */}
            <ComponentCard title="Informations Importantes">
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <FaHistory className="w-4 h-4 mt-0.5 text-blue-500" />
                  <p>
                    L'historique des inscriptions précédentes est affiché pour
                    référence.
                  </p>
                </div>

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

                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-1.5 bg-green-500 rounded-full"></div>
                  <p>Le statut de l'élève sera mis à jour automatiquement.</p>
                </div>
              </div>
            </ComponentCard>

            {/* Avertissement si pas d'année scolaire */}
            {!anneeActive && (
              <ComponentCard title="Attention">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <FaExclamationTriangle className="w-4 h-4 mt-0.5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        Aucune année scolaire active
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Veuillez configurer une année scolaire active avant de
                        procéder aux réinscriptions.
                      </p>
                    </div>
                  </div>
                </div>
              </ComponentCard>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ReinscriptionForm;
