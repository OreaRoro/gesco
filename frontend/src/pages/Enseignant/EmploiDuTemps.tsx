import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { enseignantService } from "../../services/enseignantService";
import { anneeScolaireService } from "../../services/anneeScolaireService";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Spinner from "../../components/common/Spinner";
import {
  FaChalkboardTeacher,
  FaClock,
  FaSearch,
  FaPrint,
} from "react-icons/fa";

interface FilterFormData {
  enseignant_id: string;
  annee_scolaire_id: string;
}

interface Cours {
  id: number;
  matiere_nom: string;
  classe_nom: string;
  jour_semaine: string;
  heure_debut: string;
  heure_fin: string;
  salle: string;
}

const EmploiDuTemps: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [enseignants, setEnseignants] = useState<any[]>([]);
  const [anneesScolaires, setAnneesScolaires] = useState<any[]>([]);
  const [emploiDuTemps, setEmploiDuTemps] = useState<Cours[]>([]);
  const [selectedEnseignant, setSelectedEnseignant] = useState<any>(null);

  const { register, watch, setValue } = useForm<FilterFormData>({
    defaultValues: {
      enseignant_id: "",
      annee_scolaire_id: "",
    },
  });

  const watchedEnseignant = watch("enseignant_id");
  const watchedAnneeScolaire = watch("annee_scolaire_id");

  useEffect(() => {
    loadSelectData();
  }, []);

  useEffect(() => {
    if (watchedEnseignant && watchedAnneeScolaire) {
      loadEmploiDuTemps(
        parseInt(watchedEnseignant),
        parseInt(watchedAnneeScolaire)
      );
    } else {
      setEmploiDuTemps([]);
      setSelectedEnseignant(null);
    }
  }, [watchedEnseignant, watchedAnneeScolaire]);

  const loadSelectData = async () => {
    try {
      const [enseignantsList, anneesList] = await Promise.all([
        enseignantService.getAll(),
        anneeScolaireService.getAll(),
      ]);

      setEnseignants(enseignantsList.data.personnel || []);
      setAnneesScolaires(anneesList.data.annees_scolaires || []);

      // Sélectionner l'année scolaire courante par défaut
      const anneeCourante = anneesList.data.annees_scolaires.find(
        (a: any) => a.is_active
      );
      if (anneeCourante) {
        setValue("annee_scolaire_id", anneeCourante.id.toString());
      }
    } catch (error: any) {
      console.error("Erreur chargement données:", error);
      toast.error("Erreur lors du chargement des données");
    }
  };

  const loadEmploiDuTemps = async (
    enseignantId: number,
    anneeScolaireId: number
  ) => {
    setLoading(true);
    try {
      const response = await enseignantService.getEmploiDuTemps(
        enseignantId,
        anneeScolaireId
      );
      setEmploiDuTemps(response.data.emploi_du_temps || []);
      setSelectedEnseignant(response.data.enseignant);
    } catch (error: any) {
      console.error("Erreur chargement emploi du temps:", error);
      toast.error("Erreur lors du chargement de l'emploi du temps");
      setEmploiDuTemps([]);
      setSelectedEnseignant(null);
    } finally {
      setLoading(false);
    }
  };

  const joursSemaine = [
    { value: "lundi", label: "Lundi" },
    { value: "mardi", label: "Mardi" },
    { value: "mercredi", label: "Mercredi" },
    { value: "jeudi", label: "Jeudi" },
    { value: "vendredi", label: "Vendredi" },
    { value: "samedi", label: "Samedi" },
  ];

  const creneauxHoraires = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ];

  const getCoursPourJourEtHeure = (jour: string, heure: string) => {
    return emploiDuTemps.filter(
      (cours) =>
        cours.jour_semaine === jour &&
        cours.heure_debut <= heure &&
        cours.heure_fin > heure
    );
  };

  const formatHeure = (heure: string) => {
    return heure.substring(0, 5); // Retourne HH:MM
  };

  const getCouleurMatiere = (matiere: string) => {
    // Génère une couleur basée sur le nom de la matière
    const colors = [
      "bg-blue-100 text-blue-800 border-blue-200",
      "bg-green-100 text-green-800 border-green-200",
      "bg-purple-100 text-purple-800 border-purple-200",
      "bg-orange-100 text-orange-800 border-orange-200",
      "bg-red-100 text-red-800 border-red-200",
      "bg-indigo-100 text-indigo-800 border-indigo-200",
      "bg-pink-100 text-pink-800 border-pink-200",
      "bg-yellow-100 text-yellow-800 border-yellow-200",
      "bg-teal-100 text-teal-800 border-teal-200",
    ];

    const index = matiere.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <PageMeta
        title="Emploi du Temps | Système de Gestion Scolaire"
        description="Consulter l'emploi du temps des enseignants"
      />

      <PageBreadcrumb
        pageTitle="Emploi du Temps"
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Enseignants", path: "/enseignants" },
          { label: "Emploi du Temps", path: "/enseignants/emploi-du-temps" },
        ]}
      />

      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Emploi du Temps
            </h1>
            <p className="text-gray-600">
              Consulter les emplois du temps des enseignants
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 print:hidden"
          >
            <FaPrint className="w-4 h-4" />
            Imprimer
          </button>
        </div>

        {/* Filtres */}
        <ComponentCard title="Filtres" className="print:hidden">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Enseignant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enseignant *
              </label>
              <select
                {...register("enseignant_id", { required: true })}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20"
              >
                <option value="">Sélectionner un enseignant</option>
                {enseignants.map((enseignant) => (
                  <option key={enseignant.id} value={enseignant.id}>
                    {enseignant.nom} {enseignant.prenom}
                  </option>
                ))}
              </select>
            </div>

            {/* Année scolaire */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Année scolaire *
              </label>
              <select
                {...register("annee_scolaire_id", { required: true })}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20"
              >
                <option value="">Sélectionner une année</option>
                {anneesScolaires.map((annee) => (
                  <option key={annee.id} value={annee.id}>
                    {annee.annee}
                  </option>
                ))}
              </select>
            </div>

            {/* Informations */}
            <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
              {selectedEnseignant ? (
                <div className="text-center">
                  <p className="text-lg font-semibold text-blue-900">
                    {selectedEnseignant.nom} {selectedEnseignant.prenom}
                  </p>
                  <p className="text-sm text-blue-700">
                    {emploiDuTemps.length} cours
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <FaSearch className="w-8 h-8 mx-auto text-blue-400 mb-2" />
                  <p className="text-sm text-blue-600">
                    Sélectionnez un enseignant
                  </p>
                </div>
              )}
            </div>
          </div>
        </ComponentCard>

        {/* Emploi du temps */}
        <ComponentCard
          title={
            selectedEnseignant
              ? `Emploi du temps - ${selectedEnseignant.nom} ${selectedEnseignant.prenom}`
              : "Emploi du temps"
          }
          desc={
            selectedEnseignant &&
            `Année scolaire: ${
              anneesScolaires.find(
                (a) => a.id === parseInt(watchedAnneeScolaire)
              )?.annee
            }`
          }
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
              <span className="ml-2">Chargement de l'emploi du temps...</span>
            </div>
          ) : !watchedEnseignant || !watchedAnneeScolaire ? (
            <div className="text-center py-12">
              <FaChalkboardTeacher className="w-16 h-16 mx-auto text-gray-400" />
              <p className="mt-4 text-lg font-medium text-gray-900">
                Sélectionnez un enseignant et une année scolaire
              </p>
              <p className="text-gray-500">
                Veuillez choisir un enseignant et une année scolaire pour
                afficher l'emploi du temps.
              </p>
            </div>
          ) : emploiDuTemps.length === 0 ? (
            <div className="text-center py-12">
              <FaClock className="w-16 h-16 mx-auto text-gray-400" />
              <p className="mt-4 text-lg font-medium text-gray-900">
                Aucun cours programmé
              </p>
              <p className="text-gray-500">
                Aucun cours n'est programmé pour cet enseignant pour l'année
                scolaire sélectionnée.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-4 text-sm font-medium text-gray-500 text-center bg-gray-50 border border-gray-200">
                      Heure/Jour
                    </th>
                    {joursSemaine.map((jour) => (
                      <th
                        key={jour.value}
                        className="p-4 text-sm font-medium text-gray-500 text-center bg-gray-50 border border-gray-200"
                      >
                        {jour.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {creneauxHoraires.map((heure, index) => (
                    <tr key={heure}>
                      <td className="p-3 text-sm font-medium text-gray-900 text-center bg-gray-50 border border-gray-200">
                        {formatHeure(heure)} -{" "}
                        {formatHeure(creneauxHoraires[index + 1] || "18:00")}
                      </td>
                      {joursSemaine.map((jour) => {
                        const cours = getCoursPourJourEtHeure(
                          jour.value,
                          heure
                        );
                        return (
                          <td
                            key={`${jour.value}-${heure}`}
                            className="p-2 border border-gray-200 align-top min-w-[150px]"
                          >
                            {cours.map((c, idx) => (
                              <div
                                key={idx}
                                className={`p-2 mb-1 rounded-lg border-2 ${getCouleurMatiere(
                                  c.matiere_nom
                                )}`}
                              >
                                <div className="font-medium text-sm">
                                  {c.matiere_nom}
                                </div>
                                <div className="text-xs opacity-75">
                                  {c.classe_nom}
                                </div>
                                {c.salle && (
                                  <div className="text-xs opacity-75">
                                    Salle {c.salle}
                                  </div>
                                )}
                                <div className="text-xs opacity-75">
                                  {formatHeure(c.heure_debut)}-
                                  {formatHeure(c.heure_fin)}
                                </div>
                              </div>
                            ))}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Légende */}
          {emploiDuTemps.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg print:hidden">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Légende
              </h4>
              <div className="flex flex-wrap gap-2">
                {Array.from(
                  new Set(emploiDuTemps.map((c) => c.matiere_nom))
                ).map((matiere, index) => (
                  <div key={matiere} className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded ${
                        getCouleurMatiere(matiere).split(" ")[0]
                      }`}
                    ></div>
                    <span className="text-xs text-gray-600">{matiere}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ComponentCard>

        {/* Liste détaillée des cours */}
        {emploiDuTemps.length > 0 && (
          <ComponentCard
            title="Liste Détailée des Cours"
            className="print:hidden"
          >
            <div className="space-y-3">
              {emploiDuTemps.map((cours, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-3 h-12 rounded ${
                        getCouleurMatiere(cours.matiere_nom).split(" ")[0]
                      }`}
                    ></div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {cours.matiere_nom}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {cours.classe_nom} •{" "}
                        {
                          joursSemaine.find(
                            (j) => j.value === cours.jour_semaine
                          )?.label
                        }{" "}
                        •{formatHeure(cours.heure_debut)}-
                        {formatHeure(cours.heure_fin)}
                        {cours.salle && ` • Salle ${cours.salle}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">
                      {formatHeure(cours.heure_debut)}-
                      {formatHeure(cours.heure_fin)}
                    </span>
                    <p className="text-xs text-gray-500">
                      {
                        joursSemaine.find((j) => j.value === cours.jour_semaine)
                          ?.label
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ComponentCard>
        )}
      </div>

      {/* Styles pour l'impression */}
      <style>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          body {
            font-size: 12px;
          }
          table {
            font-size: 10px;
          }
        }
      `}</style>
    </>
  );
};

export default EmploiDuTemps;
