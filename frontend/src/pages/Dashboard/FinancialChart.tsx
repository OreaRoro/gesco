// components/school/FinancialChart.tsx
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Dropdown } from "../../components/ui/dropdown/Dropdown.tsx";
import { DropdownItem } from "../../components/ui/dropdown/DropdownItem.tsx";
import { MoreDotIcon } from "../../icons";
import { useState } from "react";

interface FinancialChartProps {}

export default function FinancialChart(props: FinancialChartProps) {
  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: [
        "Jan",
        "Fév",
        "Mar",
        "Avr",
        "Mai",
        "Juin",
        "Juil",
        "Aoû",
        "Sep",
        "Oct",
        "Nov",
        "Déc",
      ],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      title: {
        text: undefined,
      },
      labels: {
        formatter: (val: number) => `${(val / 1000).toFixed(0)}k AR`,
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      x: {
        show: false,
      },
      y: {
        formatter: (val: number) => `${val.toLocaleString()} AR`,
      },
    },
  };

  const series = [
    {
      name: "Recettes",
      data: [0, 0, 0, 0, 0, 0, 0, 0, 125000, 170000, 0, 0],
    },
  ];

  const [isOpen, setIsOpen] = useState<boolean>(false);

  function toggleDropdown(): void {
    setIsOpen(!isOpen);
  }

  function closeDropdown(): void {
    setIsOpen(false);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Recettes Mensuelles
        </h3>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem onItemClick={closeDropdown}>Voir plus</DropdownItem>
            <DropdownItem onItemClick={closeDropdown}>Exporter</DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          <Chart options={options} series={series} type="bar" height={180} />
        </div>
      </div>
    </div>
  );
}
