import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { paiementService } from "../../services/paiementService";
import ComponentCard from "../../components/common/ComponentCard";
import NouveauPaiementForm from "./NouveauPaiementForm.tsx";
import ListePaiements from "./ListePaiements.tsx";
import { FaMoneyBillWave } from "react-icons/fa";

interface GestionPaiementsProps {
  inscriptionId: number;
  eleveId: number;
  anneeScolaireId: number;
  montantTotal: number;
  eleve?: {
    id: number;
    nom: string;
    prenom: string;
    matricule: string;
  };
  inscription?: {
    id: number;
    classe: {
      nom: string;
    };
    annee_scolaire: {
      annee: string;
    };
  };
  paiementsPrecharges?: any[];
  hasPaiements?: boolean;
}

const GestionPaiements: React.FC<GestionPaiementsProps> = ({
  inscriptionId,
  eleveId,
  anneeScolaireId,
  montantTotal,
  eleve = { id: 0, nom: "", prenom: "", matricule: "" },
  inscription = { id: 0, classe: { nom: "" }, annee_scolaire: { annee: "" } },
  paiementsPrecharges = [],
  hasPaiements = false,
}) => {
  const [paiements, setPaiements] = useState<any[]>(paiementsPrecharges);
  const [loading, setLoading] = useState(false);
  const [soldeRestant, setSoldeRestant] = useState(montantTotal);
  const [totalDejaPaye, setTotalDejaPaye] = useState(0);

  useEffect(() => {
    // Si des paiements sont préchargés, utiliser ceux-là
    if (paiementsPrecharges.length > 0) {
      calculerTotals(paiementsPrecharges);
    } else {
      // Sinon charger les paiements
      loadPaiements();
    }
  }, [inscriptionId, paiementsPrecharges]);

  const calculerTotals = (paiementsData: any[]) => {
    // Calculer le total déjà payé à partir des paiements
    const totalPaye = paiementsData.reduce((sum: number, paiement: any) => {
      const montant = Number(paiement.montant) || 0;
      return sum + montant;
    }, 0);

    setTotalDejaPaye(totalPaye);

    // Calculer le solde restant (reste à payer)
    const total = Number(montantTotal) || 0;
    const nouveauSoldeRestant = Math.max(0, total - totalPaye);
    setSoldeRestant(nouveauSoldeRestant);
  };

  const loadPaiements = async () => {
    try {
      const response = await paiementService.getByInscription(inscriptionId);
      const paiementsData = response.data.paiements || response.data || [];
      setPaiements(paiementsData);
      calculerTotals(paiementsData);
    } catch (error) {
      console.error("Erreur chargement paiements:", error);
      toast.error("Erreur lors du chargement des paiements");
    }
  };

  const handleNouveauPaiement = async (paiementData: any) => {
    setLoading(true);
    try {
      const completePaiementData = {
        ...paiementData,
        inscription_id: inscriptionId,
        eleve_id: eleveId,
        annee_scolaire_id: anneeScolaireId,
      };

      await paiementService.create(completePaiementData);
      toast.success("Paiement enregistré avec succès");
      await loadPaiements(); // Recharger les paiements après ajout
    } catch (error: any) {
      console.error("Erreur enregistrement paiement:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Erreur lors de l'enregistrement du paiement";

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePaiementDelete = async (paiementId: number) => {
    try {
      await paiementService.delete(paiementId);
      toast.success("Paiement supprimé avec succès");
      await loadPaiements(); // Recharger les paiements après suppression
    } catch (error: any) {
      console.error("Erreur suppression paiement:", error);
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de la suppression du paiement"
      );
    }
  };

  const calculerPourcentage = () => {
    const total = Number(montantTotal) || 0;
    const paye = Number(totalDejaPaye) || 0;

    if (total <= 0) return 0;

    const pourcentage = (paye / total) * 100;
    return Math.min(pourcentage, 100);
  };

  const pourcentagePaye = calculerPourcentage();

  const formatMontant = (montant: number) => {
    const montantNum = Number(montant) || 0;
    return montantNum.toLocaleString("fr-FR");
  };

  // Si aucun paiement n'existe pour cette année scolaire
  if (!hasPaiements && paiements.length === 0) {
    return (
      <ComponentCard title={`Paiements - ${inscription.annee_scolaire.annee}`}>
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <FaMoneyBillWave className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun paiement pour {inscription.annee_scolaire.annee}
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Aucun paiement n'a été enregistré pour {eleve.prenom} {eleve.nom}{" "}
            pour l'année scolaire {inscription.annee_scolaire.annee}.
          </p>

          {/* Résumé financier quand même */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">Total à payer</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatMontant(montantTotal)} Ar
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">Déjà payé</p>
              <p className="text-2xl font-bold text-green-900">
                {formatMontant(totalDejaPaye)} Ar
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-800">Reste à payer</p>
              <p className="text-2xl font-bold text-orange-900">
                {formatMontant(soldeRestant)} Ar
              </p>
            </div>
          </div>

          {/* Seulement le formulaire de nouveau paiement */}
          <NouveauPaiementForm
            onSubmit={handleNouveauPaiement}
            loading={loading}
            soldeRestant={soldeRestant}
          />
        </div>
      </ComponentCard>
    );
  }

  // Affichage normal avec historique des paiements
  return (
    <ComponentCard title={`Paiements - ${inscription.annee_scolaire.annee}`}>
      <div className="space-y-6">
        {/* Résumé financier */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">Total à payer</p>
            <p className="text-2xl font-bold text-blue-900">
              {formatMontant(montantTotal)} Ar
            </p>
            <p className="text-xs text-blue-600 mt-1">Frais de scolarité</p>
            <p className="text-xs text-blue-500">
              {inscription.annee_scolaire.annee}
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">Déjà payé</p>
            <p className="text-2xl font-bold text-green-900">
              {formatMontant(totalDejaPaye)} Ar
            </p>
            <div className="mt-2">
              <div className="w-full bg-green-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${pourcentagePaye}%` }}
                ></div>
              </div>
              <p className="text-xs text-green-600 mt-1">
                {pourcentagePaye.toFixed(1)}% payé
              </p>
            </div>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-orange-800">Reste à payer</p>
            <p className="text-2xl font-bold text-orange-900">
              {formatMontant(soldeRestant)} Ar
            </p>
            <p className="text-xs text-orange-600 mt-1">
              {soldeRestant === 0
                ? "Complètement réglé"
                : "En attente de paiement"}
            </p>
          </div>
        </div>

        {/* Barre de progression globale */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progression globale - {inscription.annee_scolaire.annee}
            </span>
            <span className="text-sm font-bold text-blue-600">
              {pourcentagePaye.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${pourcentagePaye}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0 Ar</span>
            <span>
              {formatMontant(totalDejaPaye)} Ar / {formatMontant(montantTotal)}{" "}
              Ar
            </span>
          </div>
        </div>

        {/* Formulaire de nouveau paiement */}
        <NouveauPaiementForm
          onSubmit={handleNouveauPaiement}
          loading={loading}
          soldeRestant={soldeRestant}
        />

        {/* Liste des paiements (seulement si il y en a) */}
        {paiements.length > 0 && (
          <ListePaiements
            paiements={paiements}
            onPaiementDelete={handlePaiementDelete}
            totalDejaPaye={totalDejaPaye}
            montantTotal={montantTotal}
            eleve={eleve}
            inscription={inscription}
          />
        )}
      </div>
    </ComponentCard>
  );
};

export default GestionPaiements;
