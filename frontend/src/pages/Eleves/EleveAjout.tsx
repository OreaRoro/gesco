import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { eleveService } from "../../services/eleveService";
import {
  EleveFormData,
  EleveCreateRequest,
} from "../../interfaces/eleve.interface";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { ArrowLeftIcon } from "../../icons";
import { FaSave } from "react-icons/fa";
import { Link } from "react-router-dom";
import Spinner from "../../components/common/Spinner";
import Input from "../../components/form/input/InputField";
import DatePicker from "../../components/form/date-picker";
import Label from "../../components/form/Label";

const EleveAjoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [, setAnneesScolaires] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<EleveFormData>({
    defaultValues: {
      nom: "",
      prenom: "",
      date_naissance: "",
      lieu_naissance: "",
      sexe: "M",
      adresse: "",
      telephone_parent: "",
      email_parent: "",
      date_inscription: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    try {
      // Charger les données pour les selects
      const [anneesResponse] = await Promise.all([
        eleveService.getAnneesScolaires(),
      ]);

      setAnneesScolaires(anneesResponse.data?.annees_scolaires || []);
    } catch (error) {
      console.error("Erreur chargement données formulaire:", error);
      toast.error("Erreur lors du chargement des données");
    }
  };

  const onSubmit = async (formData: EleveFormData) => {
    setLoading(true);
    try {
      // Convertir EleveFormData en EleveCreateRequest
      const eleveData: EleveCreateRequest = {
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        date_naissance: formData.date_naissance,
        sexe: formData.sexe,
        date_inscription: formData.date_inscription,
        // Champs optionnels - seulement s'ils ont une valeur
        ...(formData.lieu_naissance && {
          lieu_naissance: formData.lieu_naissance.trim(),
        }),
        ...(formData.adresse && { adresse: formData.adresse.trim() }),
        ...(formData.telephone_parent && {
          telephone_parent: formData.telephone_parent.trim(),
        }),
        ...(formData.email_parent && {
          email_parent: formData.email_parent.trim(),
        }),
      };

      const response = await eleveService.create(eleveData);
      const eleveId = response?.data?.eleve?.id;
      toast.success("Élève créé avec succès !");

      if (eleveId) {
        // Redirection vers le formulaire d'inscription après un court délai
        setTimeout(() => {
          navigate(`/eleves/${eleveId}/inscrire`, {
            state: {
              message: "Élève créé avec succès",
              eleve: response.data.eleve,
            },
          });
        }, 1000);
      } else {
        throw new Error("ID de l'élève non reçu");
      }
    } catch (error: any) {
      console.error("Erreur création élève:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la création de l'élève";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onError = (errors: any) => {
    console.log("Erreurs de validation:", errors);
    toast.error("Veuillez corriger les erreurs dans le formulaire");
  };

  // Fonction pour réinitialiser le formulaire
  const handleReset = () => {
    reset({
      nom: "",
      prenom: "",
      date_naissance: "",
      lieu_naissance: "",
      sexe: "M",
      adresse: "",
      telephone_parent: "",
      email_parent: "",
      date_inscription: new Date().toISOString().split("T")[0],
    });
    toast.info("Formulaire réinitialisé");
  };

  return (
    <>
      <PageMeta
        title="Ajouter un Élève | Système de Gestion Scolaire"
        description="Formulaire d'ajout d'un nouvel élève"
      />

      <PageBreadcrumb
        pageTitle="Ajouter un Élève"
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Élèves", path: "/eleves" },
          { label: "Nouvel Élève", path: "/eleves/nouveau" },
        ]}
      />

      <div className="space-y-6">
        {/* En-tête avec bouton retour */}
        <div className="flex items-center justify-between">
          <Link
            to="/eleves"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Retour à la liste
          </Link>
        </div>

        <ComponentCard title="Informations de l'Élève">
          <form
            onSubmit={handleSubmit(onSubmit, onError)}
            className="space-y-8"
          >
            {/* Section Informations Personnelles */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Informations Personnelles
              </h3>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Nom */}
                <div>
                  <Label>
                    Nom <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="nom"
                    placeholder="Entrez le nom de famille"
                    // label="Nom"
                    register={register}
                    validation={{
                      required: "Le nom est obligatoire",
                      minLength: {
                        value: 2,
                        message: "Le nom doit contenir au moins 2 caractères",
                      },
                    }}
                    error={errors.nom}
                    // required
                  />
                </div>

                {/* Prénom */}
                <div>
                  <Label>
                    Nom <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="prenom"
                    placeholder="Entrez le prénom"
                    // label="Prénom"
                    register={register}
                    validation={{
                      required: "Le prénom est obligatoire",
                      minLength: {
                        value: 2,
                        message:
                          "Le prénom doit contenir au moins 2 caractères",
                      },
                    }}
                    error={errors.prenom}
                    // required
                  />
                </div>

                {/* Date de Naissance */}
                <DatePicker
                  id="date_naissance"
                  name="date_naissance"
                  label="Date de Naissance"
                  placeholder="Sélectionnez la date de naissance"
                  register={register}
                  setValue={setValue}
                  validation={{
                    required: "La date de naissance est obligatoire",
                    validate: {
                      futureDate: (value) =>
                        new Date(value) <= new Date() ||
                        "La date de naissance ne peut pas être dans le futur",
                    },
                  }}
                  error={errors.date_naissance}
                  // required
                />

                {/* Lieu de Naissance */}
                <div>
                  <Label>
                    Lieu de Naissance <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="lieu_naissance"
                    placeholder="Lieu de naissance"
                    // label="Lieu de Naissance"
                    register={register}
                  />
                </div>

                {/* Sexe */}
                <div>
                  <label
                    htmlFor="sexe"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Sexe <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="sexe"
                    {...register("sexe", {
                      required: "Le sexe est obligatoire",
                    })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                      errors.sexe ? "border-red-500" : "border-gray-300"
                    } dark:bg-gray-800 dark:border-gray-700 dark:text-white`}
                  >
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                  {errors.sexe && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.sexe.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section Contact */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Informations de Contact
              </h3>

              <div className="grid grid-cols-1 gap-6">
                {/* Adresse */}
                <div>
                  <label
                    htmlFor="adresse"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Adresse
                  </label>
                  <textarea
                    id="adresse"
                    rows={3}
                    {...register("adresse")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    placeholder="Adresse complète"
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Téléphone Parent */}
                  <div>
                    <Label>
                      Téléphone Parent <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="tel"
                      name="telephone_parent"
                      placeholder="+261 XX XX XXX XX"
                      // label="Téléphone du Parent"
                      register={register}
                      validation={{
                        pattern: {
                          value: /^[0-9+\-\s()]*$/,
                          message: "Numéro de téléphone invalide",
                        },
                        required: "Le numéro de téléphone est requis",
                      }}
                      error={errors.telephone_parent}
                    />
                  </div>

                  {/* Email Parent */}
                  <div>
                    <Label>
                      Email Parent <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      name="email_parent"
                      placeholder="parent@exemple.com"
                      // label="Email du Parent"
                      register={register}
                      validation={{
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "Adresse email invalide",
                        },
                        required: "L'email est requis",
                      }}
                      error={errors.email_parent}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section Scolarité */}
            {/* <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Informations de Scolarité
              </h3>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                  defaultDate={new Date().toISOString().split("T")[0]}
                  // required
                />
              </div>
            </div> */}

            {/* Actions du formulaire */}
            <div className="flex flex-col gap-4 pt-6 sm:flex-row sm:justify-end sm:items-center">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-3 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Réinitialiser
              </button>

              <Link
                to="/eleves"
                className="px-6 py-3 text-sm font-medium text-gray-700 text-center transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Annuler
              </Link>

              <button
                type="submit"
                disabled={loading}
                className={`flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white transition-colors rounded-lg ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-brand-500 hover:bg-brand-600"
                }`}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" color="white" />
                    Création...
                  </>
                ) : (
                  <>
                    <FaSave className="w-4 h-4" />
                    Créer l'élève
                  </>
                )}
              </button>
            </div>
          </form>
        </ComponentCard>

        {/* Informations supplémentaires */}
        <ComponentCard title="Informations Importantes">
          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
              <p>
                <strong>Matricule généré automatiquement :</strong> Le système
                générera automatiquement un matricule unique pour le nouvel
                élève.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
              <p>
                <strong>Statut par défaut :</strong> L'élève sera créé avec le
                statut "Actif" par défaut.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
              <p>
                <strong>Inscription :</strong> Après la création, vous pourrez
                inscrire l'élève dans une classe depuis la page de détail.
              </p>
            </div>
          </div>
        </ComponentCard>
      </div>
    </>
  );
};

export default EleveAjoutPage;
