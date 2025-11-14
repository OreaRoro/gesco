import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useState } from "react";
import { Dropdown } from "../../components/ui/dropdown/Dropdown.tsx";
import { DropdownItem } from "../../components/ui/dropdown/DropdownItem.tsx";
import { MoreDotIcon } from "../../icons";

interface MonthlyTargetProps {}

export default function MonthlyTarget(props: MonthlyTargetProps) {
  const recettesTotales = 170000;
  const objectifMensuel = 500000;
  const progression = Math.round((recettesTotales / objectifMensuel) * 100);

  const series = [progression];
  const options: ApexOptions = {
    colors: ["#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: 330,
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -85,
        endAngle: 85,
        hollow: {
          size: "80%",
        },
        track: {
          background: "#E4E7EC",
          strokeWidth: "100%",
          margin: 5,
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            fontSize: "36px",
            fontWeight: "600",
            offsetY: -40,
            color: "#1D2939",
            formatter: function (val: number) {
              return val + "%";
            },
          },
        },
      },
    },
    fill: {
      type: "solid",
      colors: ["#465FFF"],
    },
    stroke: {
      lineCap: "round",
    },
    labels: ["Progression"],
  };

  const [isOpen, setIsOpen] = useState<boolean>(false);

  function toggleDropdown(): void {
    setIsOpen(!isOpen);
  }

  function closeDropdown(): void {
    setIsOpen(false);
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
        <div className="flex justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Objectif Mensuel
            </h3>
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
              Objectif de recettes pour le mois
            </p>
          </div>
          <div className="relative inline-block">
            <button className="dropdown-toggle" onClick={toggleDropdown}>
              <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
            </button>
            <Dropdown
              isOpen={isOpen}
              onClose={closeDropdown}
              className="w-40 p-2"
            >
              <DropdownItem onItemClick={closeDropdown}>
                Modifier l'objectif
              </DropdownItem>
              <DropdownItem onItemClick={closeDropdown}>
                Voir détails
              </DropdownItem>
            </Dropdown>
          </div>
        </div>
        <div className="relative">
          <div className="max-h-[330px]" id="chartDarkStyle">
            <Chart
              options={options}
              series={series}
              type="radialBar"
              height={330}
            />
          </div>
        </div>
        <p className="mx-auto mt-10 w-full max-w-[380px] text-center text-sm text-gray-500 sm:text-base">
          Vous avez encaissé {recettesTotales.toLocaleString()} AR ce mois-ci.
        </p>
      </div>

      <div className="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Objectif
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {objectifMensuel.toLocaleString()} AR
          </p>
        </div>

        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Recettes
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {recettesTotales.toLocaleString()} AR
          </p>
        </div>
      </div>
    </div>
  );
}
