import StatisticsChart from "./StatisticsChart";
import MonthlyTarget from "./MonthlyTarget";
import PageMeta from "../../components/common/PageMeta";
import SchoolMetrics from "./SchoolMetrics";
import FinancialChart from "./FinancialChart";
import ClassesDistribution from "./ClassesDistribution.tsx";
import RecentInscriptions from "./RecentInscriptions.tsx";

export default function Home() {
  return (
    <>
      <PageMeta
        title="React.js Ecommerce Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Ecommerce Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <SchoolMetrics />

          <FinancialChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget />
        </div>

        <div className="col-span-12">
          <RecentInscriptions />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <ClassesDistribution />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <StatisticsChart />
        </div>
      </div>
    </>
  );
}
