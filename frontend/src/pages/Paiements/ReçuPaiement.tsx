import React from "react";

interface ReçuPaiementProps {
  data: {
    eleve: {
      nom: string;
      prenom: string;
      matricule: string;
    };
    paiement: {
      id: number;
      montant: number;
      date_paiement: string;
      mode_paiement: string;
      reference_paiement?: string;
      mois: string;
      statut: string;
    };
    inscription: {
      classe: string;
      annee_scolaire: string;
    };
    ecole: {
      nom: string;
      adresse: string;
      telephone: string;
      email?: string;
    };
  };
}

export const ReçuPaiement: React.FC<ReçuPaiementProps> = ({ data }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  const formatMois = (mois: string) => {
    if (mois === "inscription") return "Frais d'inscription";
    try {
      const date = new Date(mois + "-01");
      return date.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      });
    } catch {
      return mois;
    }
  };

  const getModePaiementLabel = (mode: string) => {
    const modes: { [key: string]: string } = {
      especes: "Espèces",
      cheque: "Chèque",
      virement: "Virement",
      mobile: "Paiement Mobile",
    };
    return modes[mode] || mode;
  };

  return (
    <div id="reçu-paiement" className="bg-white p-8 max-w-2xl mx-auto">
      {/* En-tête */}
      <div className="text-center mb-8 border-b-2 border-blue-600 pb-4">
        <h1 className="text-2xl font-bold text-blue-600 mb-2">
          {data.ecole.nom}
        </h1>
        <p className="text-gray-600">{data.ecole.adresse}</p>
        <p className="text-gray-600">Tél: {data.ecole.telephone}</p>
        {data.ecole.email && (
          <p className="text-gray-600">Email: {data.ecole.email}</p>
        )}
      </div>

      {/* Titre */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          REÇU DE PAIEMENT
        </h2>
        <div className="w-32 h-1 bg-gray-300 mx-auto"></div>
      </div>

      {/* Informations élève */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          INFORMATIONS ÉLÈVE
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-medium">Nom:</span> {data.eleve.prenom}{" "}
            {data.eleve.nom}
          </div>
          <div>
            <span className="font-medium">Matricule:</span>{" "}
            {data.eleve.matricule}
          </div>
          <div>
            <span className="font-medium">Classe:</span>{" "}
            {data.inscription.classe}
          </div>
          <div>
            <span className="font-medium">Année scolaire:</span>{" "}
            {data.inscription.annee_scolaire}
          </div>
        </div>
      </div>

      {/* Détails paiement */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          DÉTAILS DU PAIEMENT
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-medium">Référence:</span>{" "}
            {data.paiement.reference_paiement || "N/A"}
          </div>
          <div>
            <span className="font-medium">Date:</span>{" "}
            {formatDate(data.paiement.date_paiement)}
          </div>
          <div>
            <span className="font-medium">Mois:</span>{" "}
            {formatMois(data.paiement.mois)}
          </div>
          <div>
            <span className="font-medium">Mode:</span>{" "}
            {getModePaiementLabel(data.paiement.mode_paiement)}
          </div>
          <div>
            <span className="font-medium">Statut:</span>
            <span
              className={`ml-1 px-2 py-1 rounded text-xs ${
                data.paiement.statut === "paye"
                  ? "bg-green-100 text-green-800"
                  : data.paiement.statut === "partiel"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {data.paiement.statut === "paye"
                ? "Payé"
                : data.paiement.statut === "partiel"
                ? "Partiel"
                : "Impayé"}
            </span>
          </div>
        </div>
      </div>

      {/* Montant */}
      <div className="text-center my-8 p-6 bg-blue-50 rounded-lg">
        <div className="text-sm text-blue-600 font-medium mb-2">
          MONTANT PAYÉ
        </div>
        <div className="text-4xl font-bold text-blue-700">
          {data.paiement.montant.toLocaleString("fr-FR")} Ar
        </div>
      </div>

      {/* Signature */}
      <div className="mt-12 text-right">
        <div className="inline-block text-center">
          <div className="border-t-2 border-gray-400 w-48 mt-8 mb-2"></div>
          <div className="text-sm text-gray-600">Signature et cachet</div>
        </div>
      </div>

      {/* Pied de page */}
      <div className="mt-16 text-center text-xs text-gray-500 border-t pt-4">
        <div>
          Reçu généré le {new Date().toLocaleDateString("fr-FR")} à{" "}
          {new Date().toLocaleTimeString("fr-FR")}
        </div>
        <div>ID Paiement: {data.paiement.id}</div>
      </div>
    </div>
  );
};
