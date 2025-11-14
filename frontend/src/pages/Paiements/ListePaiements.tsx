import React, { useState } from "react";
import { toast } from "sonner";
import {
  FaTrash,
  FaPrint,
  FaFileInvoice,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
} from "react-icons/fa";
import { pdfService, ReçuPaiementData } from "../../services/pdfService";
import { ReçuPaiement } from "./ReçuPaiement";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { useConfirmationModal } from "../../hooks/useConfirmationModal";

interface Paiement {
  id: number;
  mois: string;
  montant: number;
  date_paiement: string;
  mode_paiement: string;
  reference_paiement?: string;
  statut: string;
  created_at: string;
  encaisse_par_nom?: string;
}

interface ListePaiementsProps {
  paiements: Paiement[];
  onPaiementDelete: (paiementId: number) => void;
  totalDejaPaye?: number;
  montantTotal?: number;
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
  isAnneeActive?: boolean;
}

const ListePaiements: React.FC<ListePaiementsProps> = ({
  paiements,
  onPaiementDelete,
  totalDejaPaye = 0,
  montantTotal = 0,
  eleve = { id: 0, nom: "", prenom: "", matricule: "" },
  inscription = { id: 0, classe: { nom: "" }, annee_scolaire: { annee: "" } },
  isAnneeActive = true,
}) => {
  const [showReçu, setShowReçu] = useState(false);
  const [reçuData, setReçuData] = useState<ReçuPaiementData | null>(null);
  const [printing, setPrinting] = useState(false);

  const { isOpen, modalConfig, openModal, closeModal, confirm } =
    useConfirmationModal();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  const formatCurrency = (amount: number) => {
    const montantNum = Number(amount) || 0;
    return new Intl.NumberFormat("fr-MG", {
      style: "currency",
      currency: "MGA",
    }).format(montantNum);
  };

  const getModePaiementLabel = (mode: string) => {
    const modes: { [key: string]: string } = {
      especes: "Espèces",
      cheque: "Chèque",
      virement: "Virement",
      mobile: "Paiement mobile",
    };
    return modes[mode] || mode;
  };

  const getStatusBadge = (statut: string, montant: number) => {
    const config: {
      [key: string]: { class: string; icon: React.ReactNode; label: string };
    } = {
      paye: {
        class: "bg-green-100 text-green-800",
        icon: <FaCheckCircle className="w-3 h-3" />,
        label: "Payé",
      },
      impaye: {
        class: "bg-red-100 text-red-800",
        icon: <FaExclamationTriangle className="w-3 h-3" />,
        label: "Impayé",
      },
      partiel: {
        class: "bg-yellow-100 text-yellow-800",
        icon: <FaClock className="w-3 h-3" />,
        label: "Partiel",
      },
    };

    const { class: className, icon, label } = config[statut] || config.impaye;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${className}`}
        title={`${label} - ${formatCurrency(montant)}`}
      >
        {icon}
        {label}
      </span>
    );
  };

  const handleDelete = async (paiement: Paiement) => {
    if (!isAnneeActive) {
      toast.error("Impossible de supprimer un paiement en mode consultation");
      return;
    }
    try {
      const confirmDelete = await openModal({
        title: "Suppression de paiement",
        message: `Êtes-vous sûr de vouloir supprimer le paiement du ${formatDate(
          paiement.date_paiement
        )} d'un montant de ${formatCurrency(paiement.montant)} ?`,
        type: "danger",
        confirmText: "Supprimer",
        cancelText: "Annuler",
      });
      if (confirmDelete) {
        onPaiementDelete(paiement.id);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Erreur lors de la suppression"
      );
    }
  };

  const handlePrint = async (paiement: Paiement) => {
    setPrinting(true);
    try {
      // Données de l'école (à configurer selon votre application)
      const ecoleData = {
        nom: "École Primaire Publique",
        adresse: "Lot IVC 123 Antananarivo",
        telephone: "+261 34 12 345 67",
        email: "contact@ecole.mg",
      };

      const reçuData: ReçuPaiementData = {
        eleve: {
          nom: eleve.nom,
          prenom: eleve.prenom,
          matricule: eleve.matricule,
        },
        paiement,
        inscription: {
          classe: inscription.classe.nom,
          annee_scolaire: inscription.annee_scolaire.annee,
        },
        ecole: ecoleData,
      };

      setReçuData(reçuData);
      setShowReçu(true);

      // Petite pause pour permettre le rendu du composant
      setTimeout(async () => {
        try {
          // Option 1: Génération PDF programmatique (recommandée)
          const pdf = await pdfService.genererReçuPaiement(reçuData);
          pdf.save(`reçu-paiement-${paiement.id}-${Date.now()}.pdf`);

          toast.success("Reçu généré avec succès");
        } catch (error) {
          console.error("Erreur génération PDF:", error);
          toast.error("Erreur lors de la génération du reçu");
        } finally {
          setPrinting(false);
          setShowReçu(false);
        }
      }, 500);
    } catch (error) {
      console.error("Erreur préparation impression:", error);
      toast.error("Erreur lors de la préparation de l'impression");
      setPrinting(false);
      setShowReçu(false);
    }
  };

  // Calcul sécurisé du pourcentage
  const calculerPourcentage = () => {
    const total = Number(montantTotal) || 0;
    const paye = Number(totalDejaPaye) || 0;

    if (total <= 0) return 0;

    const pourcentage = (paye / total) * 100;
    return Math.min(pourcentage, 100);
  };

  const pourcentageProgression = calculerPourcentage();

  if (paiements.length === 0) {
    return (
      <div className="text-center py-8">
        <FaFileInvoice className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucun paiement enregistré
        </h3>
        <p className="text-gray-500">
          Les paiements apparaîtront ici une fois enregistrés.
        </p>
        {inscription && (
          <p className="text-sm text-gray-400 mt-2">
            Année scolaire: {inscription.annee_scolaire.annee} -{" "}
            {inscription.classe.nom}
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      {modalConfig && (
        <ConfirmationModal
          isOpen={isOpen}
          onClose={closeModal}
          onConfirm={confirm}
          {...modalConfig}
        />
      )}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Historique des Paiements ({paiements.length})
          </h3>
          {inscription && (
            <div className="text-sm text-gray-500">
              {inscription.annee_scolaire.annee} - {inscription.classe.nom}
            </div>
          )}
        </div>

        <div className="overflow-hidden border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mois
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mode
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Référence
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paiements.map((paiement) => (
                <tr key={paiement.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(paiement.date_paiement)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {paiement.mois === "inscription" ? (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        Inscription
                      </span>
                    ) : (
                      new Date(paiement.mois + "-01").toLocaleDateString(
                        "fr-FR",
                        {
                          month: "long",
                          year: "numeric",
                        }
                      )
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(paiement.montant)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {getModePaiementLabel(paiement.mode_paiement)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getStatusBadge(paiement.statut, paiement.montant)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {paiement.reference_paiement || "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePrint(paiement)}
                        disabled={printing}
                        className={`p-1 rounded transition-colors ${
                          printing
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-blue-600 hover:text-blue-900"
                        }`}
                        title="Imprimer le reçu"
                      >
                        <FaPrint className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(paiement)}
                        disabled={!isAnneeActive}
                        className={`p-1 rounded transition-colors ${
                          !isAnneeActive
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-red-600 hover:text-red-900"
                        }`}
                        title={
                          !isAnneeActive
                            ? "Action désactivée en mode consultation"
                            : "Supprimer le paiement"
                        }
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Résumé détaillé */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="font-medium text-gray-900">Total perçu:</span>
              <span className="text-lg font-bold text-gray-900 block">
                {formatCurrency(totalDejaPaye)}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-900">Total attendu:</span>
              <span className="text-lg font-bold text-gray-900 block">
                {formatCurrency(montantTotal)}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-900">Progression:</span>
              <span className="text-lg font-bold text-gray-900 block">
                {pourcentageProgression.toFixed(1)}%
              </span>
            </div>
          </div>
          {inscription && (
            <p className="text-sm text-gray-600 mt-2">
              Année scolaire: {inscription.annee_scolaire.annee} - Classe:{" "}
              {inscription.classe.nom}
            </p>
          )}
          {paiements.some((p) => p.encaisse_par_nom) && (
            <p className="text-sm text-gray-600 mt-2">
              Dernier encaissement par: {paiements[0]?.encaisse_par_nom}
            </p>
          )}
        </div>
      </div>

      {/* Modal pour l'aperçu du reçu */}
      {showReçu && reçuData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Aperçu du reçu</h3>
              <button
                onClick={() => setShowReçu(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <ReçuPaiement data={reçuData} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ListePaiements;
