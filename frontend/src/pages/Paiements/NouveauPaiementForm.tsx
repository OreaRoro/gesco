import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FaSave, FaTimes } from "react-icons/fa";
import Input from "../../components/form/input/InputField";
import DatePicker from "../../components/form/date-picker";
import Spinner from "../../components/common/Spinner";

interface NouveauPaiementFormProps {
  onSubmit: (data: any) => Promise<void>;
  loading: boolean;
  soldeRestant: number;
  isAnneeActive?: boolean;
}

interface PaiementFormData {
  montant: number;
  date_paiement: string;
  mode_paiement: string;
  reference_paiement?: string;
  mois: string;
}

const NouveauPaiementForm: React.FC<NouveauPaiementFormProps> = ({
  onSubmit,
  loading,
  soldeRestant,
  isAnneeActive = true,
}) => {
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<PaiementFormData>({
    defaultValues: {
      date_paiement: new Date().toISOString().split("T")[0],
      mode_paiement: "especes",
      mois: new Date().toISOString().slice(0, 7),
      montant: 0,
    },
  });

  const watchedMontant = Number(watch("montant")) || 0;

  const handleFormSubmit = async (data: PaiementFormData) => {
    if (data.montant <= 0) {
      toast.error("Le montant doit être supérieur à 0");
      return;
    }

    if (data.montant > soldeRestant) {
      toast.error("Le montant ne peut pas dépasser le solde restant");
      return;
    }

    try {
      await onSubmit(data);
      reset();
      setShowForm(false);
    } catch (error) {
      // L'erreur est déjà gérée dans le parent
    }
  };

  const handleCancel = () => {
    reset();
    setShowForm(false);
  };

  const suggestions = [
    { label: "Acompte 25%", value: Math.round(soldeRestant * 0.25) },
    { label: "Acompte 50%", value: Math.round(soldeRestant * 0.5) },
    { label: "Solde complet", value: soldeRestant },
  ].filter((suggestion) => suggestion.value > 0);

  if (!showForm) {
    return (
      <div className="text-center">
        <button
          onClick={() => setShowForm(true)}
          disabled={soldeRestant <= 0 || !isAnneeActive}
          className={`px-4 py-2 font-medium text-white rounded-lg transition-colors ${
            soldeRestant <= 0 || !isAnneeActive
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          Nouveau Paiement
          {!isAnneeActive && " (Désactivé)"}
        </button>
        {soldeRestant <= 0 && (
          <p className="mt-2 text-sm text-gray-500">Aucun solde à régler</p>
        )}
        {!isAnneeActive && (
          <p className="mt-2 text-sm text-orange-500">
            Les paiements sont désactivés en mode consultation
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Nouveau Paiement</h3>
        <button
          onClick={handleCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <FaTimes className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Suggestions de montant */}
        {suggestions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Suggestions de paiement
            </label>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setValue("montant", suggestion.value)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  {suggestion.label}: {suggestion.value.toLocaleString("fr-FR")}{" "}
                  Ar
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Montant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              name="montant"
              placeholder="0"
              register={register}
              validation={{
                required: "Le montant est obligatoire",
                min: {
                  value: 1,
                  message: "Le montant doit être supérieur à 0",
                },
                max: {
                  value: soldeRestant,
                  message: `Le montant ne peut pas dépasser ${soldeRestant.toLocaleString(
                    "fr-FR"
                  )} Ar`,
                },
              }}
              error={errors.montant}
            />
            <p className="mt-1 text-xs text-gray-500">
              Solde restant: {soldeRestant.toLocaleString("fr-FR")} Ar
            </p>
          </div>

          {/* Date de paiement */}
          <DatePicker
            id="date_paiement"
            name="date_paiement"
            label="Date de paiement"
            placeholder="Sélectionnez une date"
            register={register}
            setValue={setValue}
            validation={{
              required: "La date de paiement est obligatoire",
            }}
            error={errors.date_paiement}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Mode de paiement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mode de paiement <span className="text-red-500">*</span>
            </label>
            <select
              {...register("mode_paiement", {
                required: "Le mode de paiement est obligatoire",
              })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.mode_paiement ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="especes">Espèces</option>
              <option value="cheque">Chèque</option>
              <option value="virement">Virement</option>
              <option value="mobile">Paiement mobile</option>
            </select>
            {errors.mode_paiement && (
              <p className="mt-1 text-sm text-red-600">
                {errors.mode_paiement.message}
              </p>
            )}
          </div>

          {/* Mois */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mois de référence
            </label>
            <input
              type="month"
              {...register("mois")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Référence de paiement */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Référence de paiement
          </label>
          <Input
            type="text"
            name="reference_paiement"
            placeholder="Numéro de chèque, référence virement..."
            register={register}
            error={errors.reference_paiement}
          />
        </div>

        {/* Résumé */}
        {watchedMontant > 0 && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-blue-900">
                Nouveau solde après ce paiement:
              </span>
              <span className="text-lg font-bold text-blue-900">
                {(soldeRestant - watchedMontant).toLocaleString("fr-FR")} Ar
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || watchedMontant <= 0}
            className={`flex items-center justify-center gap-2 flex-1 px-4 py-2 text-white rounded-md transition-colors ${
              loading || watchedMontant <= 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? (
              <>
                <Spinner size="sm" color="white" />
                Enregistrement...
              </>
            ) : (
              <>
                <FaSave className="w-4 h-4" />
                Enregistrer le paiement
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NouveauPaiementForm;
