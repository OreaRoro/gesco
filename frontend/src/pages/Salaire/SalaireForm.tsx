import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { salaireService, SalaireFormData } from "../../services/salaireService";
import { personnelService } from "../../services/personnelService";
import { anneeScolaireService } from "../../services/anneeScolaireService";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Spinner from "../../components/common/Spinner";
import Input from "../../components/form/input/InputField.tsx";
import Label from "../../components/form/Label.tsx";
import { FaSave, FaTimes, FaCalculator } from "react-icons/fa";

const SalaireForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [personnelList, setPersonnelList] = useState<any[]>([]);
  const [anneesScolaires, setAnneesScolaires] = useState<any[]>([]);
  const [moisDisponibles, setMoisDisponibles] = useState<any[]>([]);
  const [selectedPersonnel, setSelectedPersonnel] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<SalaireFormData>({
    defaultValues: {
      personnel_id: 0,
      annee_scolaire_id: 0,
      mois: "",
      salaire_base: 0,
      prime: 0,
      heures_supp: 0,
      taux_heure_supp: 0,
      deduction: 0,
      salaire_net: 0,
      statut_paiement: "impaye",
    },
  });

  // Watch les champs pour le calcul automatique
  const watchedSalaireBase = watch("salaire_base");
  const watchedPrime = watch("prime");
  const watchedHeuresSupp = watch("heures_supp");
  const watchedTauxHeureSupp = watch("taux_heure_supp");
  const watchedDeduction = watch("deduction");
  const watchedPersonnelId = watch("personnel_id");

  useEffect(() => {
    loadSelectData();
    if (isEdit && id) {
      loadSalaire(parseInt(id));
    }
  }, [isEdit, id]);

  useEffect(() => {
    // Calcul automatique du salaire net
    const salaireNet = salaireService.calculerSalaireNet({
      salaire_base: watchedSalaireBase || 0,
      prime: watchedPrime || 0,
      heures_supp: watchedHeuresSupp || 0,
      taux_heure_supp: watchedTauxHeureSupp || 0,
      deduction: watchedDeduction || 0,
    });
    setValue("salaire_net", salaireNet);
  }, [
    watchedSalaireBase,
    watchedPrime,
    watchedHeuresSupp,
    watchedTauxHeureSupp,
    watchedDeduction,
    setValue,
  ]);

  useEffect(() => {
    // Charger les informations du personnel sélectionné
    if (watchedPersonnelId) {
      const personnel = personnelList.find((p) => p.id === watchedPersonnelId);
      setSelectedPersonnel(personnel);
      if (personnel && !isEdit) {
        setValue("salaire_base", parseFloat(personnel.salaire_base));
      }
    }
  }, [watchedPersonnelId, personnelList, isEdit, setValue]);

  const loadSalaire = async (salaireId: number) => {
    setLoading(true);
    try {
      const response = await salaireService.getById(salaireId);
      const salaire = response.data.salaire;

      reset({
        personnel_id: salaire.personnel_id,
        annee_scolaire_id: salaire.annee_scolaire_id,
        mois: salaire.mois,
        salaire_base: parseFloat(salaire.salaire_base),
        prime: parseFloat(salaire.prime),
        heures_supp: parseFloat(salaire.heures_supp),
        taux_heure_supp: parseFloat(salaire.taux_heure_supp),
        deduction: parseFloat(salaire.deduction),
        salaire_net: parseFloat(salaire.salaire_net),
        statut_paiement: salaire.statut_paiement,
        date_paiement: salaire.date_paiement,
      });

      // Charger les infos du personnel
      const personnelResponse = await personnelService.getById(
        salaire.personnel_id
      );
      setSelectedPersonnel(personnelResponse.data.personnel);
    } catch (error: any) {
      console.error("Erreur chargement salaire:", error);
      toast.error("Erreur lors du chargement des données du salaire");
    } finally {
      setLoading(false);
    }
  };

  const loadSelectData = async () => {
    try {
      const [personnel, annees, mois] = await Promise.all([
        personnelService.getAll(),
        anneeScolaireService.getAll(),
        salaireService.getMoisDisponibles(),
      ]);

      setPersonnelList(personnel.data.personnel || []);
      setAnneesScolaires(annees.data.annees_scolaires || []);
      setMoisDisponibles(mois);

      // Sélectionner l'année scolaire courante par défaut
      const anneeCourante = annees.data.annees_scolaires.find(
        (a: any) => a.is_active
      );
      if (anneeCourante && !isEdit) {
        setValue("annee_scolaire_id", anneeCourante.id);
      }
    } catch (error: any) {
      console.error("Erreur chargement données:", error);
    }
  };

  const onSubmit = async (data: SalaireFormData) => {
    console.log(data);

    setLoading(true);
    try {
      if (isEdit && id) {
        await salaireService.update(parseInt(id), data);
        toast.success("Fiche de salaire modifiée avec succès");
      } else {
        await salaireService.create(data);
        toast.success("Fiche de salaire créée avec succès");
      }

      navigate("/personnel/salaires");
    } catch (error: any) {
      console.error("Erreur sauvegarde salaire:", error);
      toast.error(
        error.response?.data?.message || "Erreur lors de la sauvegarde"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-MG", {
      style: "currency",
      currency: "MGA",
      minimumFractionDigits: 0,
    }).format(amount);
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
        } Salaire | Système de Gestion Scolaire`}
        description={`${isEdit ? "Modifier" : "Ajouter"} une fiche de salaire`}
      />

      <PageBreadcrumb
        pageTitle={isEdit ? "Modifier le Salaire" : "Ajouter un Salaire"}
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Personnel", path: "/personnel" },
          { label: "Salaires", path: "/personnel/salaires" },
          { label: isEdit ? "Modifier" : "Ajouter", path: "#" },
        ]}
      />

      <div className="space-y-6">
        <ComponentCard
          title={`${isEdit ? "Modifier" : "Ajouter"} une Fiche de Salaire`}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Colonne gauche - Informations de base */}
              <div className="space-y-6">
                <div className="p-6 border border-gray-200 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Informations de Base
                  </h3>

                  <div className="space-y-4">
                    {/* Personnel */}
                    <div>
                      <Label htmlFor="personnel_id">Personnel *</Label>
                      <select
                        {...register("personnel_id", {
                          required: "Le personnel est obligatoire",
                          valueAsNumber: true,
                        })}
                        className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
                      >
                        <option value={0}>Sélectionner un personnel</option>
                        {personnelList.map((person) => (
                          <option key={person.id} value={person.id}>
                            {person.nom} {person.prenom} - {person.matricule}
                          </option>
                        ))}
                      </select>
                      {errors.personnel_id && (
                        <p className="mt-1.5 text-xs text-error-500">
                          {errors.personnel_id.message}
                        </p>
                      )}
                    </div>

                    {/* Année scolaire */}
                    <div>
                      <Label htmlFor="annee_scolaire_id">
                        Année scolaire *
                      </Label>
                      <select
                        {...register("annee_scolaire_id", {
                          required: "L'année scolaire est obligatoire",
                          valueAsNumber: true,
                        })}
                        className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
                      >
                        <option value={0}>Sélectionner une année</option>
                        {anneesScolaires.map((annee) => (
                          <option key={annee.id} value={annee.id}>
                            {annee.annee}
                          </option>
                        ))}
                      </select>
                      {errors.annee_scolaire_id && (
                        <p className="mt-1.5 text-xs text-error-500">
                          {errors.annee_scolaire_id.message}
                        </p>
                      )}
                    </div>

                    {/* Mois */}
                    <div>
                      <Label htmlFor="mois">Mois *</Label>
                      <select
                        {...register("mois", {
                          required: "Le mois est obligatoire",
                        })}
                        className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
                      >
                        <option value="">Sélectionner un mois</option>
                        {moisDisponibles.map((mois) => (
                          <option key={mois.value} value={mois.value}>
                            {mois.label}
                          </option>
                        ))}
                      </select>
                      {errors.mois && (
                        <p className="mt-1.5 text-xs text-error-500">
                          {errors.mois.message}
                        </p>
                      )}
                    </div>

                    {/* Statut paiement */}
                    <div>
                      <Label htmlFor="statut_paiement">
                        Statut de paiement *
                      </Label>
                      <select
                        {...register("statut_paiement", {
                          required: "Le statut de paiement est obligatoire",
                        })}
                        className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
                      >
                        <option value="impaye">Impayé</option>
                        <option value="paye">Payé</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Informations du personnel sélectionné */}
                {selectedPersonnel && (
                  <div className="p-6 border border-gray-200 rounded-lg bg-blue-50">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Informations du Personnel
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Nom:</strong> {selectedPersonnel.nom}{" "}
                        {selectedPersonnel.prenom}
                      </p>
                      <p>
                        <strong>Matricule:</strong>{" "}
                        {selectedPersonnel.matricule}
                      </p>
                      <p>
                        <strong>Type:</strong>{" "}
                        {selectedPersonnel.type_personnel}
                      </p>
                      <p>
                        <strong>Salaire de base:</strong>{" "}
                        {formatCurrency(
                          parseFloat(selectedPersonnel.salaire_base)
                        )}
                      </p>
                      <p>
                        <strong>Statut:</strong> {selectedPersonnel.statut}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Colonne droite - Détails du salaire */}
              <div className="space-y-6">
                <div className="p-6 border border-gray-200 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Détails du Salaire
                  </h3>

                  <div className="space-y-4">
                    {/* Salaire de base */}
                    <div>
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
                      />
                    </div>

                    {/* Prime */}
                    <div>
                      <Label htmlFor="prime">Prime</Label>
                      <Input
                        type="number"
                        id="prime"
                        name="prime"
                        placeholder="0.00"
                        // step="0.01"
                        min="0"
                        register={register}
                        validation={{
                          valueAsNumber: true,
                        }}
                      />
                    </div>

                    {/* Heures supplémentaires */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="heures_supp">
                          Heures supplémentaires
                        </Label>
                        <Input
                          type="number"
                          id="heures_supp"
                          name="heures_supp"
                          placeholder="0"
                          //   step="0.5"
                          min="0"
                          register={register}
                          validation={{
                            valueAsNumber: true,
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor="taux_heure_supp">
                          Taux horaire (Ar)
                        </Label>
                        <Input
                          type="number"
                          id="taux_heure_supp"
                          name="taux_heure_supp"
                          placeholder="0.00"
                          //   step="0.01"
                          min="0"
                          register={register}
                          validation={{
                            valueAsNumber: true,
                          }}
                        />
                      </div>
                    </div>

                    {/* Déduction */}
                    <div>
                      <Label htmlFor="deduction">Déductions</Label>
                      <Input
                        type="number"
                        id="deduction"
                        name="deduction"
                        placeholder="0.00"
                        // step="0.01"
                        min="0"
                        register={register}
                        validation={{
                          valueAsNumber: true,
                        }}
                      />
                    </div>

                    {/* Salaire net (calculé automatiquement) */}
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <Label htmlFor="salaire_net">Salaire net à payer</Label>
                      <Input
                        type="number"
                        id="salaire_net"
                        name="salaire_net"
                        placeholder="0.00"
                        // step="0.01"
                        min="0"
                        register={register}
                        validation={{
                          required: "Le salaire net est obligatoire",
                          valueAsNumber: true,
                        }}
                        error={errors.salaire_net}
                        disabled
                        className="bg-green-100 font-bold text-green-800"
                      />
                      <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                        <FaCalculator className="w-4 h-4" />
                        <span>Calculé automatiquement</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Récapitulatif du calcul */}
                <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Récapitulatif
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Salaire de base:</span>
                      <span>{formatCurrency(watchedSalaireBase || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prime:</span>
                      <span className="text-green-600">
                        +{formatCurrency(watchedPrime || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        Heures supplémentaires ({watchedHeuresSupp || 0}h):
                      </span>
                      <span className="text-green-600">
                        +
                        {formatCurrency(
                          (watchedHeuresSupp || 0) * (watchedTauxHeureSupp || 0)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Déductions:</span>
                      <span className="text-red-600">
                        -{formatCurrency(watchedDeduction || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200 font-bold">
                      <span>Net à payer:</span>
                      <span className="text-green-600">
                        {formatCurrency(watch("salaire_net") || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate("/personnel/salaires")}
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

export default SalaireForm;
