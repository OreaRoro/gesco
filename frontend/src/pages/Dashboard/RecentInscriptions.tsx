import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table/index";
import Badge from "../../components/ui/badge/Badge";

interface Inscription {
  id: number;
  eleve: string;
  classe: string;
  date: string;
  montant: string;
  statutPaiement: "paye" | "partiel" | "impaye";
}

interface RecentInscriptionsProps {}

const inscriptionsData: Inscription[] = [
  {
    id: 8,
    eleve: "Pierre Bernard",
    classe: "Salle I - Maternelle",
    date: "08/11/2025",
    montant: "125,000 AR",
    statutPaiement: "paye",
  },
  {
    id: 13,
    eleve: "Alphonse Randrianambinina",
    classe: "Salle II - Grande section",
    date: "09/11/2025",
    montant: "45,000 AR",
    statutPaiement: "partiel",
  },
  {
    id: 9,
    eleve: "Oréa Roros",
    classe: "Salle I - Maternelle",
    date: "08/11/2025",
    montant: "125,000 AR",
    statutPaiement: "impaye",
  },
  {
    id: 11,
    eleve: "Marc Antoine",
    classe: "Salle II - Grande section",
    date: "09/11/2025",
    montant: "180,000 AR",
    statutPaiement: "impaye",
  },
];

export default function RecentInscriptions(props: RecentInscriptionsProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Inscriptions Récentes
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
            Filtrer
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
            Voir tout
          </button>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Élève
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Classe
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Date
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Montant
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Statut
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {inscriptionsData.map((inscription) => (
              <TableRow key={inscription.id}>
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full dark:bg-gray-800">
                      <span className="font-semibold text-gray-600 dark:text-gray-300">
                        {inscription.eleve
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {inscription.eleve}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {inscription.classe}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {inscription.date}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {inscription.montant}
                </TableCell>
                <TableCell className="py-3">
                  <Badge
                    size="sm"
                    color={
                      inscription.statutPaiement === "paye"
                        ? "success"
                        : inscription.statutPaiement === "partiel"
                        ? "warning"
                        : "error"
                    }
                  >
                    {inscription.statutPaiement === "paye"
                      ? "Payé"
                      : inscription.statutPaiement === "partiel"
                      ? "Partiel"
                      : "Impayé"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
