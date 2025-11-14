import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { eleveService } from "../../services/eleveService";
import { inscriptionService } from "../../services/inscriptionService";
import { paiementService } from "../../services/paiementService";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Spinner from "../../components/common/Spinner";
import GestionPaiements from "./GestionPaiements";
import { ArrowLeftIcon } from "../../icons";
import { useImageUrl } from "../../hooks/useImageUrl.ts";
import { useAnneeScolaire } from "../../context/AnneeScolaireContext.tsx";
import { FaPlus, FaMoneyBillWave } from "react-icons/fa";

const GestionPaiementsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { getImageUrl } = useImageUrl();
  const { anneeActive, loading: loadingAnneeScolaire } = useAnneeScolaire();

  const [loading, setLoading] = useState(true);
  const [eleve, setEleve] = useState<any>(null);
  const [inscriptionActive, setInscriptionActive] = useState<any>(null);
  const [paiements, setPaiements] = useState<any[]>([]);
  const [hasPaiements, setHasPaiements] = useState(false);

  // Récupérer les données passées depuis l'inscription
  const { message, totalAPayer } = location.state || {};

  useEffect(() => {
    if (id && anneeActive) {
      loadData(parseInt(id));
    }
  }, [id, anneeActive]);

  useEffect(() => {
    if (message) {
      toast.success(message);
      window.history.replaceState({ ...window.history.state, state: null }, "");
    }
  }, [message]);

  const loadData = async (eleveId: number) => {
    setLoading(true);
    try {
      // Charger les données de l'élève
      const eleveResponse = await eleveService.getById(eleveId);
      setEleve(eleveResponse.data.eleve);

      // Charger les inscriptions de l'élève
      const inscriptionsResponse = await inscriptionService.getByEleve(eleveId);
      const inscriptions = inscriptionsResponse.data.inscriptions || [];

      // Trouver l'inscription pour l'année scolaire active
      const inscriptionPourAnneeActive = inscriptions.find(
        (ins: any) => ins.annee_scolaire_id === Number(anneeActive?.id)
      );

      if (!inscriptionPourAnneeActive) {
        // Aucune inscription pour l'année active
        setInscriptionActive(null);
        setPaiements([]);
        setHasPaiements(false);
        return;
      }

      setInscriptionActive(inscriptionPourAnneeActive);

      // Charger les paiements spécifiques à cette inscription (donc à cette année scolaire)
      try {
        const paiementsResponse = await paiementService.getByInscription(
          inscriptionPourAnneeActive.id
        );
        const paiementsData =
          paiementsResponse.data.paiements || paiementsResponse.data || [];
        setPaiements(paiementsData);
        setHasPaiements(paiementsData.length > 0);
      } catch (error) {
        console.error("Erreur chargement paiements:", error);
        setPaiements([]);
        setHasPaiements(false);
      }
    } catch (error: any) {
      console.error("Erreur chargement données:", error);
      toast.error("Erreur lors du chargement des données");
      navigate(`/eleves/${id}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading || loadingAnneeScolaire) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
        <span className="ml-2">Chargement des données...</span>
      </div>
    );
  }

  if (!anneeActive) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Aucune année scolaire active
          </h2>
          <p className="text-gray-600 mb-4">
            Veuillez sélectionner une année scolaire active pour gérer les
            paiements.
          </p>
          <Link
            to="/parametres"
            className="text-brand-600 hover:text-brand-700"
          >
            Configurer l'année scolaire
          </Link>
        </div>
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
            onClick={() => navigate(-1)}
            className="text-brand-600 hover:text-brand-700"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  if (!inscriptionActive) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <FaMoneyBillWave className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Aucune inscription pour {anneeActive.annee}
          </h2>
          <p className="text-gray-600 mb-6">
            {eleve.prenom} {eleve.nom} n'est pas inscrit pour l'année scolaire{" "}
            {anneeActive.annee}.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to={`/eleves/${id}/inscrire`}
              className="flex items-center justify-center gap-2 px-6 py-3 text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
            >
              <FaPlus className="w-4 h-4" />
              Créer une inscription pour {anneeActive.annee}
            </Link>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  const montantTotal = totalAPayer || inscriptionActive.montant_inscription;

  return (
    <>
      <PageMeta
        title={`Paiements - ${eleve.prenom} ${eleve.nom} | ${anneeActive.annee} | Système de Gestion Scolaire`}
        description={`Gestion des paiements pour ${eleve.prenom} ${eleve.nom} - Année ${anneeActive.annee}`}
      />

      <PageBreadcrumb
        pageTitle={`Paiements - ${eleve.prenom} ${eleve.nom} (${anneeActive.annee})`}
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Élèves", path: "/eleves" },
          { label: `${eleve.prenom} ${eleve.nom}`, path: `/eleves/${id}` },
          {
            label: `Paiements ${anneeActive.annee}`,
            path: `/eleves/${id}/paiements`,
          },
        ]}
      />

      <div className="space-y-6">
        {/* En-tête avec bouton retour */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Retour
          </button>

          {/* Indicateur d'année scolaire */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Année scolaire:</span>
            <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
              {anneeActive.annee}
            </span>
          </div>
        </div>

        {/* Bannière d'information */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 overflow-hidden rounded-full">
                <img
                  width={40}
                  height={40}
                  src={getImageUrl(eleve)}
                  alt={`${eleve.prenom} ${eleve.nom}`}
                  className="object-cover w-full h-full"
                />
              </div>
              <div>
                <h3 className="font-medium text-blue-900">
                  {eleve.prenom} {eleve.nom}
                </h3>
                <p className="text-sm text-blue-700">
                  Matricule: {eleve.matricule} • Niveau:{" "}
                  {inscriptionActive?.classe?.niveau?.nom || "Non définie"}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Année scolaire: {anneeActive.annee}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-700">Inscrit le</p>
              <p className="font-medium text-blue-900">
                {new Date(
                  inscriptionActive.date_inscription
                ).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>
        </div>

        {/* Afficher le composant de gestion des paiements seulement si on a une inscription pour l'année active */}
        <GestionPaiements
          inscriptionId={inscriptionActive.id}
          eleveId={parseInt(id!)}
          anneeScolaireId={inscriptionActive.annee_scolaire_id}
          montantTotal={montantTotal}
          eleve={eleve}
          inscription={inscriptionActive}
          paiementsPrecharges={paiements}
          hasPaiements={hasPaiements}
        />
      </div>
    </>
  );
};

export default GestionPaiementsPage;
