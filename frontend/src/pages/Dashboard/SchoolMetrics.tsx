import { ArrowDownIcon, ArrowUpIcon, GroupIcon } from "../../icons";
import { FaBook } from "react-icons/fa";
import Badge from "../../components/ui/badge/Badge";

interface SchoolMetricsProps {}

export default function SchoolMetrics(props: SchoolMetricsProps) {
  const totalEleves = 7;
  const totalClasses = 3;
  const elevesInscrits = 4;
  const tauxInscription = Math.round((elevesInscrits / totalEleves) * 100);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* Métrique Élèves */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Élèves Totaux
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {totalEleves}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {elevesInscrits} inscrits
            </p>
          </div>
          <Badge color={tauxInscription > 50 ? "success" : "warning"}>
            {tauxInscription > 50 ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {tauxInscription}%
          </Badge>
        </div>
      </div>

      {/* Métrique Classes */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <FaBook className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Classes Actives
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {totalClasses}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              2 classes occupées
            </p>
          </div>

          <Badge color="success">
            <ArrowUpIcon />
            33%
          </Badge>
        </div>
      </div>
    </div>
  );
}
