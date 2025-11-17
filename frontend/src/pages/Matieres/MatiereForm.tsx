import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  matiereService,
  CreateMatiereData,
} from "../../services/matiereService";
import { niveauService } from "../../services/niveauService";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Spinner from "../../components/common/Spinner";
import Input from "../../components/form/input/InputField";
import { ArrowLeftIcon } from "../../icons";
import { FaSave, FaTimes } from "react-icons/fa";

interface MatiereFormData {
  nom: string;
  code: string;
  coefficient: number;
  niveau_id: number;
}

const MatiereForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [niveaux, setNiveaux] = useState<any[]>([]);
  const [isEditing] = useState(!!id);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<MatiereFormData>({
    defaultValues: {
      nom: "",
      code: "",
      coefficient: 1,
      niveau_id: 0,
    },
  });

  useEffect(() => {
    loadNiveaux();
    if (id) {
      loadMatiere(parseInt(id));
    }
  }, [id]);

  const loadNiveaux = async () => {
    try {
      const response = await niveauService.getAll();
      setNiveaux(response.data.niveaux || []);
    } catch (error: any) {
      console.error("Erreur chargement niveaux:", error);
      toast.error("Erreur lors du chargement des niveaux");
    }
  };

  const loadMatiere = async (matiereId: number) => {
    try {
      const response = await matiereService.getById(matiereId);
      const matiere = response.data.matiere;

      reset({
        nom: matiere.nom,
        code: matiere.code,
        coefficient: matiere.coefficient,
        niveau_id: matiere.niveau_id,
      });
    } catch (error: any) {
      console.error("Erreur chargement matière:", error);
      toast.error("Erreur lors du chargement de la matière");
      navigate("/matieres");
    }
  };

  const onSubmit = async (formData: MatiereFormData) => {
    setLoading(true);
    try {
      if (isEditing && id) {
        await matiereService.update(parseInt(id), formData);
        toast.success("Matière modifiée avec succès");
      } else {
        await matiereService.create(formData);
        toast.success("Matière créée avec succès");
      }
      navigate("/matieres");
    } catch (error: any) {
      console.error("Erreur sauvegarde matière:", error);
      const errorMessage =
        error.response?.data?.message ||
        `Erreur lors de ${
          isEditing ? "la modification" : "la création"
        } de la matière`;
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onError = (errors: any) => {
    console.log("Erreurs de validation:", errors);
    toast.error("Veuillez corriger les erreurs dans le formulaire");
  };

  const coefficientOptions = [1, 2, 3, 4, 5];

  return (
    <>
      <PageMeta
        title={`${
          isEditing ? "Modifier" : "Nouvelle"
        } Matière | Système de Gestion Scolaire`}
        description={`${isEditing ? "Modifier" : "Créer"} une matière`}
      />

      <PageBreadcrumb
        pageTitle={`${isEditing ? "Modifier" : "Nouvelle"} Matière`}
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Matières", path: "/matieres" },
          {
            label: `${isEditing ? "Modifier" : "Nouvelle"} Matière`,
            path: `/matieres/${isEditing ? id + "/modifier" : "nouveau"}`,
          },
        ]}
      />

      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/matieres"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Retour aux matières
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Formulaire */}
          <div className="lg:col-span-2">
            <ComponentCard
              title={`${isEditing ? "Modifier" : "Nouvelle"} Matière`}
            >
              <form
                onSubmit={handleSubmit(onSubmit, onError)}
                className="space-y-6"
              >
                {/* Nom */}
                <Input
                  type="text"
                  name="nom"
                  //   label="Nom de la matière"
                  placeholder="Ex: Mathématiques"
                  register={register}
                  validation={{
                    required: "Le nom de la matière est obligatoire",
                    minLength: {
                      value: 2,
                      message: "Le nom doit contenir au moins 2 caractères",
                    },
                  }}
                  error={errors.nom}
                />

                {/* Code */}
                <Input
                  type="text"
                  name="code"
                  //   label="Code de la matière"
                  placeholder="Ex: MATH"
                  register={register}
                  validation={{
                    required: "Le code de la matière est obligatoire",
                    pattern: {
                      value: /^[A-Z0-9]{2,10}$/,
                      message:
                        "Le code doit contenir uniquement des lettres majuscules et chiffres (2-10 caractères)",
                    },
                  }}
                  error={errors.code}
                />

                {/* Coefficient et Niveau */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Coefficient */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coefficient <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("coefficient", {
                        required: "Le coefficient est obligatoire",
                        valueAsNumber: true,
                      })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                        errors.coefficient
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    >
                      {coefficientOptions.map((coef) => (
                        <option key={coef} value={coef}>
                          Coefficient {coef}
                        </option>
                      ))}
                    </select>
                    {errors.coefficient && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.coefficient.message}
                      </p>
                    )}
                  </div>

                  {/* Niveau */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Niveau <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("niveau_id", {
                        required: "Le niveau est obligatoire",
                        valueAsNumber: true,
                        validate: (value) =>
                          value > 0 || "Veuillez sélectionner un niveau",
                      })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                        errors.niveau_id ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value={0}>Sélectionnez un niveau</option>
                      {niveaux.map((niveau) => (
                        <option key={niveau.id} value={niveau.id}>
                          {niveau.nom}
                        </option>
                      ))}
                    </select>
                    {errors.niveau_id && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.niveau_id.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-4 pt-6 sm:flex-row sm:justify-end sm:items-center">
                  <Link
                    to="/matieres"
                    className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <FaTimes className="w-4 h-4" />
                    Annuler
                  </Link>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white transition-colors rounded-lg ${
                      loading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-brand-600 hover:bg-brand-700"
                    }`}
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" color="white" />
                        {isEditing ? "Modification..." : "Création..."}
                      </>
                    ) : (
                      <>
                        <FaSave className="w-4 h-4" />
                        {isEditing ? "Modifier la matière" : "Créer la matière"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </ComponentCard>
          </div>

          {/* Informations */}
          <div className="space-y-6">
            <ComponentCard title="Informations">
              <div className="space-y-3 text-sm text-gray-600">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <strong className="text-blue-700">Nom de la matière:</strong>
                  <p className="text-blue-600 mt-1">
                    Doit être clair et descriptif (ex: "Mathématiques",
                    "Physique-Chimie")
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <strong className="text-green-700">Code matière:</strong>
                  <p className="text-green-600 mt-1">
                    Code unique en majuscules (ex: "MATH", "PHY", "FRAN")
                  </p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <strong className="text-orange-700">Coefficient:</strong>
                  <p className="text-orange-600 mt-1">
                    Détermine le poids de la matière dans le calcul des moyennes
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <strong className="text-purple-700">Niveau:</strong>
                  <p className="text-purple-600 mt-1">
                    Niveau scolaire auquel cette matière est enseignée
                  </p>
                </div>
              </div>
            </ComponentCard>
          </div>
        </div>
      </div>
    </>
  );
};

export default MatiereForm;
