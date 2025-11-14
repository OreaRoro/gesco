import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface ReçuPaiementData {
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
}

export const pdfService = {
  async genererReçuPaiement(data: ReçuPaiementData): Promise<jsPDF> {
    const doc = new jsPDF();

    // Configuration
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    // Couleurs
    const primaryColor = "#3B82F6"; // Bleu
    const secondaryColor = "#6B7280"; // Gris
    const textColor = "#1F2937"; // Gris foncé

    // En-tête
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 60, "F");

    // Logo ou nom de l'école
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(data.ecole.nom, pageWidth / 2, 25, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(data.ecole.adresse, pageWidth / 2, 35, { align: "center" });
    doc.text(`Tél: ${data.ecole.telephone}`, pageWidth / 2, 42, {
      align: "center",
    });

    if (data.ecole.email) {
      doc.text(`Email: ${data.ecole.email}`, pageWidth / 2, 49, {
        align: "center",
      });
    }

    // Titre du reçu
    doc.setTextColor(textColor);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("REÇU DE PAIEMENT", pageWidth / 2, 80, { align: "center" });

    // Ligne de séparation
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.5);
    doc.line(margin, 85, pageWidth - margin, 85);

    // Informations de l'élève
    let yPosition = 100;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("INFORMATIONS ÉLÈVE:", margin, yPosition);

    yPosition += 10;
    doc.setFont("helvetica", "normal");
    doc.text(`Nom: ${data.eleve.prenom} ${data.eleve.nom}`, margin, yPosition);
    yPosition += 7;
    doc.text(`Matricule: ${data.eleve.matricule}`, margin, yPosition);
    yPosition += 7;
    doc.text(`Classe: ${data.inscription.classe}`, margin, yPosition);
    yPosition += 7;
    doc.text(
      `Année scolaire: ${data.inscription.annee_scolaire}`,
      margin,
      yPosition
    );

    yPosition += 15;

    // Détails du paiement
    doc.setFont("helvetica", "bold");
    doc.text("DÉTAILS DU PAIEMENT:", margin, yPosition);

    yPosition += 10;
    doc.setFont("helvetica", "normal");
    doc.text(
      `Référence paiement: ${data.paiement.reference_paiement || "N/A"}`,
      margin,
      yPosition
    );
    yPosition += 7;
    doc.text(
      `Date paiement: ${new Date(
        data.paiement.date_paiement
      ).toLocaleDateString("fr-FR")}`,
      margin,
      yPosition
    );
    yPosition += 7;
    doc.text(`Mois: ${this.formatMois(data.paiement.mois)}`, margin, yPosition);
    yPosition += 7;
    doc.text(
      `Mode paiement: ${this.getModePaiementLabel(
        data.paiement.mode_paiement
      )}`,
      margin,
      yPosition
    );
    yPosition += 7;
    doc.text(
      `Statut: ${this.getStatutLabel(data.paiement.statut)}`,
      margin,
      yPosition
    );

    yPosition += 15;

    // Montant en gros
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor);
    doc.text("MONTANT PAYÉ", pageWidth / 2, yPosition, { align: "center" });

    yPosition += 12;
    doc.setFontSize(24);
    doc.text(
      `${data.paiement.montant.toLocaleString("fr-FR")} Ar`,
      pageWidth / 2,
      yPosition,
      { align: "center" }
    );

    yPosition += 25;

    // Signature
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor);
    doc.setFont("helvetica", "normal");
    doc.text("Signature et cachet", pageWidth - margin, yPosition, {
      align: "right",
    });

    yPosition += 15;
    doc.setDrawColor(secondaryColor);
    doc.setLineWidth(0.5);
    doc.line(pageWidth - margin - 80, yPosition, pageWidth - margin, yPosition);

    // Pied de page
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor);
    doc.text(
      `Reçu généré le ${new Date().toLocaleDateString(
        "fr-FR"
      )} à ${new Date().toLocaleTimeString("fr-FR")}`,
      pageWidth / 2,
      footerY,
      { align: "center" }
    );
    doc.text(`ID Paiement: ${data.paiement.id}`, pageWidth / 2, footerY + 6, {
      align: "center",
    });

    return doc;
  },

  async genererReçuFromHTML(
    element: HTMLElement,
    filename: string = "reçu-paiement.pdf"
  ): Promise<void> {
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(
        imgData,
        "PNG",
        imgX,
        imgY,
        imgWidth * ratio,
        imgHeight * ratio
      );
      pdf.save(filename);
    } catch (error) {
      console.error("Erreur génération PDF:", error);
      throw new Error("Erreur lors de la génération du PDF");
    }
  },

  getModePaiementLabel(mode: string): string {
    const modes: { [key: string]: string } = {
      especes: "Espèces",
      cheque: "Chèque",
      virement: "Virement",
      mobile: "Paiement Mobile",
    };
    return modes[mode] || mode;
  },

  getStatutLabel(statut: string): string {
    const statuts: { [key: string]: string } = {
      paye: "Payé",
      partiel: "Partiel",
      impaye: "Impayé",
    };
    return statuts[statut] || statut;
  },

  formatMois(mois: string): string {
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
  },
};
