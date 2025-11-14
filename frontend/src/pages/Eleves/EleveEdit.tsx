import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { eleveService } from "../../services/eleveService";
import {
  EleveUpdateFormData,
  EleveUpdateRequest,
} from "../../interfaces/eleve.interface";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import DatePicker from "../../components/form/date-picker";
import PhotoPreview from "../../components/common/PhotoPreview";
import Spinner from "../../components/common/Spinner";
import { ArrowLeftIcon } from "../../icons";
import { FaSave, FaUserEdit, FaCamera } from "react-icons/fa";

const EleveEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [eleve, setEleve] = useState<any>(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string>("");
  const [newPhotoPreview, setNewPhotoPreview] = useState<string>("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [removeCurrentPhoto, setRemoveCurrentPhoto] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm<EleveUpdateFormData>();

  useEffect(() => {
    if (id) {
      loadEleveData(parseInt(id));
    }
  }, [id]);

  const loadEleveData = async (eleveId: number) => {
    setLoadingData(true);
    try {
      const response = await eleveService.getById(eleveId);
      const eleveData = response.data.eleve;

      setEleve(eleveData);

      // Pré-remplir le formulaire
      reset({
        nom: eleveData.nom,
        prenom: eleveData.prenom,
        date_naissance: eleveData.date_naissance,
        lieu_naissance: eleveData.lieu_naissance || "",
        sexe: eleveData.sexe,
        adresse: eleveData.adresse || "",
        telephone_parent: eleveData.telephone_parent || "",
        email_parent: eleveData.email_parent || "",
        statut: eleveData.statut,
      });

      // Charger la photo actuelle si elle existe
      if (eleveData.photo_url) {
        setCurrentPhotoUrl(eleveService.getPhotoUrl(eleveData.photo_url));
      }
    } catch (error: any) {
      console.error("Erreur chargement données élève:", error);
      toast.error("Erreur lors du chargement des données de l'élève");
      navigate("/eleves");
    } finally {
      setLoadingData(false);
    }
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La photo ne doit pas dépasser 5MB");
        return;
      }

      // Vérifier le type de fichier
      if (!file.type.startsWith("image/")) {
        toast.error("Veuillez sélectionner une image valide");
        return;
      }

      setPhotoFile(file);
      setRemoveCurrentPhoto(false); // Réactiver la photo si on en ajoute une nouvelle

      // Créer une preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCurrentPhoto = () => {
    setCurrentPhotoUrl("");
    setRemoveCurrentPhoto(true);
    setNewPhotoPreview(""); // Supprimer aussi la nouvelle photo si elle existe
    setPhotoFile(null);
  };

  const handleRemoveNewPhoto = () => {
    setNewPhotoPreview("");
    setPhotoFile(null);
  };

  const onSubmit = async (formData: EleveUpdateFormData) => {
    if (!id) return;

    setLoading(true);
    try {
      // Préparer les données pour l'API
      const updateData: EleveUpdateRequest = {
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        date_naissance: formData.date_naissance,
        sexe: formData.sexe,
        statut: formData.statut,
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

      let response;

      if (photoFile) {
        // Mettre à jour avec photo
        response = await eleveService.updateWithPhoto(
          parseInt(id),
          updateData,
          photoFile
        );
      } else if (removeCurrentPhoto && currentPhotoUrl) {
        // Supprimer la photo actuelle
        await eleveService.update(parseInt(id), updateData);
        // Note: Vous devriez avoir une méthode pour supprimer la photo dans votre API
        // await eleveService.deletePhoto(parseInt(id));
      } else {
        // Mettre à jour sans changer la photo
        response = await eleveService.update(parseInt(id), updateData);
      }

      toast.success("Élève modifié avec succès !");

      // Rediriger vers le profil
      navigate(`/eleves/${id}`, {
        state: { message: "Élève modifié avec succès" },
      });
    } catch (error: any) {
      console.error("Erreur modification élève:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la modification de l'élève";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onError = (errors: any) => {
    console.log("Erreurs de validation:", errors);
    toast.error("Veuillez corriger les erreurs dans le formulaire");
  };

  const handleReset = () => {
    if (eleve) {
      reset({
        nom: eleve.nom,
        prenom: eleve.prenom,
        date_naissance: eleve.date_naissance,
        lieu_naissance: eleve.lieu_naissance || "",
        sexe: eleve.sexe,
        adresse: eleve.adresse || "",
        telephone_parent: eleve.telephone_parent || "",
        email_parent: eleve.email_parent || "",
        statut: eleve.statut,
      });
      setNewPhotoPreview("");
      setPhotoFile(null);
      setRemoveCurrentPhoto(false);
      toast.info("Formulaire réinitialisé");
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
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

  return (
    <>
      <PageMeta
        title={`Modifier ${eleve.prenom} ${eleve.nom} | Système de Gestion Scolaire`}
        description={`Formulaire de modification pour ${eleve.prenom} ${eleve.nom}`}
      />

      <PageBreadcrumb
        pageTitle={`Modifier ${eleve.prenom} ${eleve.nom}`}
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Élèves", path: "/eleves" },
          { label: `${eleve.prenom} ${eleve.nom}`, path: `/eleves/${id}` },
          { label: "Modifier", path: `/eleves/${id}/modifier` },
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Formulaire d'édition */}
          <div className="lg:col-span-2">
            <ComponentCard title="Modifier l'Élève">
              <form
                onSubmit={handleSubmit(onSubmit, onError)}
                className="space-y-8"
              >
                {/* Section Photo */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Photo de Profil
                  </h3>

                  <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                    {/* Prévisualisation de la photo */}
                    <PhotoPreview
                      currentPhotoUrl={
                        removeCurrentPhoto ? undefined : currentPhotoUrl
                      }
                      newPhotoUrl={newPhotoPreview}
                      onRemovePhoto={handleRemoveCurrentPhoto}
                      onRemoveNewPhoto={handleRemoveNewPhoto}
                    />

                    {/* Upload de photo */}
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Changer la photo
                      </label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg cursor-pointer hover:bg-brand-700 transition-colors">
                          <FaCamera className="w-4 h-4" />
                          Choisir une photo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoChange}
                          />
                        </label>
                        <span className="text-sm text-gray-500">
                          JPG, PNG (max. 5MB)
                        </span>
                      </div>
                      {(photoFile || removeCurrentPhoto) && (
                        <p className="mt-2 text-sm text-green-600">
                          {removeCurrentPhoto
                            ? "Photo actuelle sera supprimée"
                            : "Nouvelle photo sélectionnée"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section Informations Personnelles */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Informations Personnelles
                  </h3>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* Nom */}
                    <Input
                      type="text"
                      name="nom"
                      placeholder="Entrez le nom de famille"
                      register={register}
                      validation={{
                        required: "Le nom est obligatoire",
                        minLength: {
                          value: 2,
                          message: "Le nom doit contenir au moins 2 caractères",
                        },
                      }}
                      error={errors.nom}
                    />

                    {/* Prénom */}
                    <Input
                      type="text"
                      name="prenom"
                      placeholder="Entrez le prénom"
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
                    />

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
                    />

                    {/* Lieu de Naissance */}
                    <Input
                      type="text"
                      name="lieu_naissance"
                      placeholder="Lieu de naissance"
                      register={register}
                    />

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

                    {/* Statut */}
                    <div>
                      <label
                        htmlFor="statut"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Statut <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="statut"
                        {...register("statut", {
                          required: "Le statut est obligatoire",
                        })}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                          errors.statut ? "border-red-500" : "border-gray-300"
                        } dark:bg-gray-800 dark:border-gray-700 dark:text-white`}
                      >
                        <option value="actif">Actif</option>
                        <option value="inactif">Inactif</option>
                        <option value="transfere">Transféré</option>
                        <option value="diplome">Diplômé</option>
                      </select>
                      {errors.statut && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.statut.message}
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
                      <Input
                        type="tel"
                        name="telephone_parent"
                        placeholder="+261 XX XX XXX XX"
                        register={register}
                        validation={{
                          pattern: {
                            value: /^[0-9+\-\s()]*$/,
                            message: "Numéro de téléphone invalide",
                          },
                        }}
                        error={errors.telephone_parent}
                      />

                      {/* Email Parent */}
                      <Input
                        type="email"
                        name="email_parent"
                        placeholder="parent@exemple.com"
                        register={register}
                        validation={{
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Adresse email invalide",
                          },
                        }}
                        error={errors.email_parent}
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
                        Modification...
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

          {/* Colonne de droite - Informations */}
          <div className="space-y-6">
            {/* Informations de l'élève */}
            <ComponentCard title="Informations de l'Élève">
              <div className="space-y-3">
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
                    Date d'inscription
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(eleve.date_inscription).toLocaleDateString(
                      "fr-FR"
                    )}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Dernière modification
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(eleve.updated_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
            </ComponentCard>

            {/* Instructions */}
            <ComponentCard title="Instructions">
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <FaUserEdit className="w-4 h-4 mt-0.5 text-blue-500" />
                  <p>
                    Tous les champs marqués d'un astérisque (*) sont
                    obligatoires.
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <FaCamera className="w-4 h-4 mt-0.5 text-green-500" />
                  <p>
                    La photo doit être au format JPG ou PNG et ne pas dépasser
                    5MB.
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-1.5 bg-blue-500 rounded-full"></div>
                  <p>Les modifications seront immédiatement appliquées.</p>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-1.5 bg-blue-500 rounded-full"></div>
                  <p>Un email de notification peut être envoyé aux parents.</p>
                </div>
              </div>
            </ComponentCard>

            {/* Actions rapides */}
            <ComponentCard title="Actions Rapides">
              <div className="space-y-3">
                <Link
                  to={`/eleves/${id}/inscrire`}
                  className="block w-full px-4 py-2 text-sm font-medium text-center text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
                >
                  Nouvelle Inscription
                </Link>

                <Link
                  to={`/eleves/${id}/historique`}
                  className="block w-full px-4 py-2 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Voir l'Historique
                </Link>
              </div>
            </ComponentCard>
          </div>
        </div>
      </div>
    </>
  );
};

export default EleveEdit;
