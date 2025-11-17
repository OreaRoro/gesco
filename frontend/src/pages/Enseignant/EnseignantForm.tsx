import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  enseignantService,
  EnseignantFormData,
} from "../../services/enseignantService";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Spinner from "../../components/common/Spinner";
import Input from "../../components/form/input/InputField.tsx";
import Label from "../../components/form/Label.tsx";
import DatePicker from "../../components/form/date-picker.tsx";
import {
  FaSave,
  FaTimes,
  FaUpload,
  FaChalkboardTeacher,
  FaUserGraduate,
} from "react-icons/fa";

const EnseignantForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [specialites, setSpecialites] = useState<any[]>([]);
  const [niveauxEtude, setNiveauxEtude] = useState<any[]>([]);
  const [statuts, setStatuts] = useState<any[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<EnseignantFormData>({
    defaultValues: {
      nom: "",
      prenom: "",
      sexe: "",
      date_naissance: "",
      lieu_naissance: "",
      adresse: "",
      telephone: "",
      email: "",
      type_personnel: "enseignant",
      date_embauche: "",
      salaire_base: "",
      statut: "actif",
      specialite: "",
      niveau_etude: "",
    },
  });

  const watchedPhoto = watch("photo");

  useEffect(() => {
    loadSelectData();
    if (isEdit && id) {
      loadEnseignant(parseInt(id));
    }
  }, [isEdit, id]);

  useEffect(() => {
    if (watchedPhoto && watchedPhoto instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(watchedPhoto);
    }
  }, [watchedPhoto]);

  const loadEnseignant = async (enseignantId: number) => {
    setLoading(true);
    try {
      const response = await enseignantService.getById(enseignantId);
      const enseignant = response.data.personnel;

      reset({
        nom: enseignant.nom,
        prenom: enseignant.prenom,
        sexe: enseignant.sexe || "",
        date_naissance: enseignant.date_naissance || "",
        lieu_naissance: enseignant.lieu_naissance || "",
        adresse: enseignant.adresse || "",
        telephone: enseignant.telephone || "",
        email: enseignant.email || "",
        type_personnel: "enseignant",
        date_embauche: enseignant.date_embauche || "",
        salaire_base: enseignant.salaire_base,
        statut: enseignant.statut,
        specialite: enseignant.specialite || "",
        niveau_etude: enseignant.niveau_etude || "",
      });

      if (enseignant.photo) {
        setPhotoPreview(`/api/${enseignant.photo}`);
      }
    } catch (error: any) {
      console.error("Erreur chargement enseignant:", error);
      toast.error("Erreur lors du chargement des données de l'enseignant");
    } finally {
      setLoading(false);
    }
  };

  const loadSelectData = async () => {
    try {
      const [specialitesList, niveauxList, statutsList] = await Promise.all([
        enseignantService.getSpecialites(),
        enseignantService.getNiveauxEtude(),
        enseignantService.getStatuts(),
      ]);

      setSpecialites(specialitesList);
      setNiveauxEtude(niveauxList);
      setStatuts(statutsList);
    } catch (error: any) {
      console.error("Erreur chargement données:", error);
    }
  };

  const onSubmit = async (data: EnseignantFormData) => {
    setLoading(true);

    try {
      const formData = new FormData();

      // Ajouter les champs texte
      Object.keys(data).forEach((key) => {
        const value = data[key as keyof EnseignantFormData];
        if (value !== null && value !== undefined && value !== "") {
          if (key === "photo" && value instanceof File) {
            formData.append(key, value);
          } else if (key !== "photo") {
            formData.append(key, value.toString());
          }
        }
      });

      if (isEdit && id) {
        await enseignantService.update(parseInt(id), data);
        toast.success("Enseignant modifié avec succès");
      } else {
        await enseignantService.create(data);
        toast.success("Enseignant créé avec succès");
      }

      navigate("/enseignants");
    } catch (error: any) {
      console.error("Erreur sauvegarde enseignant:", error);
      toast.error(
        error.response?.data?.message || "Erreur lors de la sauvegarde"
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue("photo", file);
    }
  };

  const removePhoto = () => {
    setValue("photo", null);
    setPhotoPreview(null);
  };

  if (loading && isEdit) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
        <span className="ml-2">Chargement...</span>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`${
          isEdit ? "Modifier" : "Ajouter"
        } Enseignant | Système de Gestion Scolaire`}
        description={`${isEdit ? "Modifier" : "Ajouter"} un enseignant`}
      />

      <PageBreadcrumb
        pageTitle={isEdit ? "Modifier l'Enseignant" : "Ajouter un Enseignant"}
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Enseignants", path: "/enseignants" },
          { label: isEdit ? "Modifier" : "Ajouter", path: "#" },
        ]}
      />

      <div className="space-y-6">
        <ComponentCard
          title={`${isEdit ? "Modifier" : "Ajouter"} un Enseignant`}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Colonne gauche */}
              <div className="space-y-6">
                {/* Informations personnelles */}
                <div className="p-6 border border-gray-200 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Informations Personnelles
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Nom */}
                    <div>
                      <Label htmlFor="nom">Nom *</Label>
                      <Input
                        type="text"
                        id="nom"
                        name="nom"
                        placeholder="Entrez le nom"
                        register={register}
                        validation={{
                          required: "Le nom est obligatoire",
                        }}
                        error={errors.nom}
                      />
                    </div>

                    {/* Prénom */}
                    <div>
                      <Label htmlFor="prenom">Prénom *</Label>
                      <Input
                        type="text"
                        id="prenom"
                        name="prenom"
                        placeholder="Entrez le prénom"
                        register={register}
                        validation={{
                          required: "Le prénom est obligatoire",
                        }}
                        error={errors.prenom}
                      />
                    </div>

                    {/* Sexe */}
                    <div>
                      <Label htmlFor="sexe">Sexe</Label>
                      <select
                        {...register("sexe")}
                        className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
                      >
                        <option value="">Sélectionner</option>
                        <option value="M">Masculin</option>
                        <option value="F">Féminin</option>
                      </select>
                    </div>

                    {/* Date de naissance */}
                    <div>
                      <Label htmlFor="date_naissance">Date de naissance</Label>
                      <DatePicker
                        id="date_naissance"
                        name="date_naissance"
                        setValue={setValue}
                        placeholder="JJ/MM/AAAA"
                        label=""
                        defaultDate={watch("date_naissance")}
                      />
                    </div>

                    {/* Lieu de naissance */}
                    <div className="md:col-span-2">
                      <Label htmlFor="lieu_naissance">Lieu de naissance</Label>
                      <Input
                        type="text"
                        id="lieu_naissance"
                        name="lieu_naissance"
                        placeholder="Entrez le lieu de naissance"
                        register={register}
                      />
                    </div>

                    {/* Adresse */}
                    <div className="md:col-span-2">
                      <Label htmlFor="adresse">Adresse</Label>
                      <textarea
                        {...register("adresse")}
                        rows={3}
                        placeholder="Entrez l'adresse complète"
                        className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Informations professionnelles */}
                <div className="p-6 border border-gray-200 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Informations Professionnelles
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Spécialité */}
                    <div>
                      <Label htmlFor="specialite">Spécialité</Label>
                      <select
                        {...register("specialite")}
                        className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
                      >
                        <option value="">Sélectionner une spécialité</option>
                        {specialites.map((specialite) => (
                          <option
                            key={specialite.value}
                            value={specialite.value}
                          >
                            {specialite.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Niveau d'étude */}
                    <div>
                      <Label htmlFor="niveau_etude">Niveau d'étude</Label>
                      <select
                        {...register("niveau_etude")}
                        className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
                      >
                        <option value="">Sélectionner un niveau</option>
                        {niveauxEtude.map((niveau) => (
                          <option key={niveau.value} value={niveau.value}>
                            {niveau.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Statut */}
                    <div>
                      <Label htmlFor="statut">Statut *</Label>
                      <select
                        {...register("statut", {
                          required: "Le statut est obligatoire",
                        })}
                        className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
                      >
                        {statuts.map((statut) => (
                          <option key={statut.value} value={statut.value}>
                            {statut.label}
                          </option>
                        ))}
                      </select>
                      {errors.statut && (
                        <p className="mt-1.5 text-xs text-error-500">
                          {errors.statut.message}
                        </p>
                      )}
                    </div>

                    {/* Date d'embauche */}
                    <div>
                      <Label htmlFor="date_embauche">Date d'embauche *</Label>
                      <DatePicker
                        id="date_embauche"
                        name="date_embauche"
                        setValue={setValue}
                        placeholder="JJ/MM/AAAA"
                        label=""
                        defaultDate={watch("date_embauche")}
                        error={errors.date_embauche}
                      />
                      {errors.date_embauche && (
                        <p className="mt-1.5 text-xs text-error-500">
                          {errors.date_embauche.message}
                        </p>
                      )}
                    </div>

                    {/* Salaire de base */}
                    <div className="md:col-span-2">
                      <Label htmlFor="salaire_base">Salaire de base *</Label>
                      <Input
                        type="number"
                        id="salaire_base"
                        name="salaire_base"
                        placeholder="0.00"
                        // step="0.01"
                        min="0"
                        register={register}
                        validation={{
                          required: "Le salaire de base est obligatoire",
                          min: {
                            value: 0,
                            message: "Le salaire doit être positif",
                          },
                          valueAsNumber: true,
                        }}
                        error={errors.salaire_base}
                        hint="Salaire mensuel en Ariary"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Colonne droite */}
              <div className="space-y-6">
                {/* Photo */}
                <div className="p-6 border border-gray-200 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Photo
                  </h3>

                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FaChalkboardTeacher className="w-12 h-12 text-gray-400" />
                      )}
                    </div>

                    <div className="flex gap-2">
                      <label className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <FaUpload className="w-4 h-4" />
                        Choisir une photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </label>

                      {photoPreview && (
                        <button
                          type="button"
                          onClick={removePhoto}
                          className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>

                    <p className="text-sm text-gray-500 text-center">
                      Formats supportés: JPG, PNG, GIF
                      <br />
                      Taille max: 2MB
                    </p>
                  </div>
                </div>

                {/* Informations de contact */}
                <div className="p-6 border border-gray-200 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Informations de Contact
                  </h3>

                  <div className="space-y-4">
                    {/* Téléphone */}
                    <div>
                      <Label htmlFor="telephone">Téléphone</Label>
                      <Input
                        type="tel"
                        id="telephone"
                        name="telephone"
                        placeholder="+261 XX XX XXX XX"
                        register={register}
                        autocomplete="tel"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="email@exemple.com"
                        register={register}
                        autocomplete="email"
                      />
                    </div>
                  </div>
                </div>

                {/* Informations complémentaires */}
                <div className="p-6 border border-gray-200 rounded-lg bg-blue-50">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    <FaUserGraduate className="inline w-5 h-5 mr-2" />
                    Informations Pédagogiques
                  </h3>

                  <div className="space-y-3 text-sm text-gray-600">
                    <p>• L'enseignant pourra être assigné à des matières</p>
                    <p>• Gestion de l'emploi du temps spécifique</p>
                    <p>• Suivi des classes attribuées</p>
                    <p>• Historique des cours dispensés</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate("/enseignants")}
                className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FaSave className="w-4 h-4" />
                {loading ? "Enregistrement..." : isEdit ? "Modifier" : "Créer"}
              </button>
            </div>
          </form>
        </ComponentCard>
      </div>
    </>
  );
};

export default EnseignantForm;
