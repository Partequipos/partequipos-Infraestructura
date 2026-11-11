import React, { useEffect, useMemo, useState } from 'react';
import { FilterX } from 'lucide-react';
import { Button } from '../../atoms/Button';
import { Input } from '../../atoms/Input';
import { Select } from '../../atoms/Select';
import { useBills } from '../hooks/useBills';
import { useDashboardComparison } from '../hooks/useDashboardComparison';
import { useDashboardFilterOptions } from '../hooks/useDashboardFilterOptions';
import { DashboardMultiSelect } from '../molecules/DashboardMultiSelect';
import { KPICard } from '../molecules/KPICard';
import { PeriodSelector } from '../molecules/PeriodSelector';
import { RangeKeySelector } from '../molecules/RangeKeySelector';
import { ServiceTypeDetailModal } from '../molecules/ServiceTypeDetailModal';
import { LocationChart, ServiceTypeChart, TrendChart } from '../organisms/DashboardCharts';
import { DashboardRangeMode, ServiceType } from '../types';
import {
  BIMESTER_MONTHS,
  filterDashboardBills,
  getDashboardServiceTypesSorted,
  isApprovedOrPaid,
  periodsFromRangeKeys,
  QUARTER_MONTHS,
  SEMESTER_MONTHS,
} from '../utils/dashboardHelpers';
import { formatCurrency, translateServiceType } from '../utils/formatters';

const RANGE_MODE_OPTIONS: Array<{ value: DashboardRangeMode; label: string }> = [
  { value: 'global', label: 'Global (todos)' },
  { value: 'month', label: 'Mes' },
  { value: 'bimester', label: 'Bimestre' },
  { value: 'quarter', label: 'Trimestre' },
  { value: 'semester', label: 'Semestre' },
];

const SERVICE_TYPE_MULTI_OPTIONS = getDashboardServiceTypesSorted().map((type) => ({
  value: type,
  label: translateServiceType(type),
}));

const getTotalTitle = (selectedPeriods: string[]): string =>
  selectedPeriods.length === 1 ? 'Total Mensual' : 'Total Periodos';

const hasActiveDashboardFilters = ({
  rangeMode,
  selectedPeriods,
  selectedRangeKeys,
  siteFilters,
  serviceTypeFilters,
  cityFilter,
  startDate,
  endDate,
  compareActive,
  comparePeriods,
}: {
  rangeMode: DashboardRangeMode;
  selectedPeriods: string[];
  selectedRangeKeys: string[];
  siteFilters: string[];
  serviceTypeFilters: ServiceType[];
  cityFilter: string;
  startDate: string;
  endDate: string;
  compareActive: boolean;
  comparePeriods: string[];
}): boolean => {
  if (rangeMode !== 'global') return true;
  if (selectedPeriods.length > 0) return true;
  if (selectedRangeKeys.length > 0) return true;
  if (siteFilters.length > 0) return true;
  if (serviceTypeFilters.length > 0) return true;
  if (cityFilter !== 'all') return true;
  if (startDate) return true;
  if (endDate) return true;
  if (compareActive) return true;
  return comparePeriods.length > 0;
};

export const DashboardPage: React.FC = () => {
  const { bills: allBills, loading, error } = useBills({ consolidated: true });

  const [rangeMode, setRangeMode] = useState<DashboardRangeMode>('global');
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [selectedRangeKeys, setSelectedRangeKeys] = useState<string[]>([]);
  const [yearForRanges, setYearForRanges] = useState<number>(new Date().getFullYear());
  const [siteFilters, setSiteFilters] = useState<string[]>([]);
  const [serviceTypeFilters, setServiceTypeFilters] = useState<ServiceType[]>([]);
  const [cityFilter, setCityFilter] = useState('all');
  const [compareActive, setCompareActive] = useState(false);
  const [comparePeriods, setComparePeriods] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [detailServiceType, setDetailServiceType] = useState<ServiceType | null>(null);

  const { availablePeriods, availableSites, availableCities, availableYears } =
    useDashboardFilterOptions(allBills, cityFilter);

  const activeYear = availableYears.includes(yearForRanges) ? yearForRanges : availableYears[0];

  useEffect(() => {
    setSiteFilters((previous) => {
      if (previous.length === 0) return previous;
      const allowed = new Set(availableSites);
      const next = previous.filter((site) => allowed.has(site));
      return next.length === previous.length ? previous : next;
    });
  }, [availableSites]);

  const applyRangeKeys = (keys: string[], mode: DashboardRangeMode, year: number) => {
    setSelectedRangeKeys(keys);
    if (mode === 'bimester') {
      setSelectedPeriods(periodsFromRangeKeys(keys, year, BIMESTER_MONTHS));
      return;
    }
    if (mode === 'quarter') {
      setSelectedPeriods(periodsFromRangeKeys(keys, year, QUARTER_MONTHS));
      return;
    }
    if (mode === 'semester') {
      setSelectedPeriods(periodsFromRangeKeys(keys, year, SEMESTER_MONTHS));
    }
  };

  const handleRangeModeChange = (mode: DashboardRangeMode) => {
    setRangeMode(mode);
    setSelectedRangeKeys([]);
    setSelectedPeriods([]);
  };

  const handleMonthPeriodsChange = (periods: string[]) => {
    setSelectedRangeKeys([]);
    setSelectedPeriods(periods);
  };

  const handleCityChange = (value: string) => {
    setCityFilter(value);
    setSiteFilters([]);
  };

  const handleServiceTypeFiltersChange = (values: string[]) => {
    setServiceTypeFilters(values as ServiceType[]);
  };

  const handleClearFilters = () => {
    setRangeMode('global');
    setSelectedPeriods([]);
    setSelectedRangeKeys([]);
    setYearForRanges(availableYears[0] ?? new Date().getFullYear());
    setSiteFilters([]);
    setServiceTypeFilters([]);
    setCityFilter('all');
    setCompareActive(false);
    setComparePeriods([]);
    setStartDate('');
    setEndDate('');
    setDetailServiceType(null);
  };

  const filtersActive = hasActiveDashboardFilters({
    rangeMode,
    selectedPeriods,
    selectedRangeKeys,
    siteFilters,
    serviceTypeFilters,
    cityFilter,
    startDate,
    endDate,
    compareActive,
    comparePeriods,
  });

  const dateRangeFilters = useMemo(
    () => ({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    [startDate, endDate]
  );

  const sharedFilters = useMemo(
    () => ({
      siteFilters,
      serviceTypes: serviceTypeFilters,
      cityFilter,
      ...dateRangeFilters,
    }),
    [siteFilters, serviceTypeFilters, cityFilter, dateRangeFilters]
  );

  /** Misma sede/tipo/ciudad, todos los periodos → base del % de variación. */
  const baselineBills = useMemo(
    () =>
      filterDashboardBills(allBills, {
        periods: [],
        ...sharedFilters,
      }),
    [allBills, sharedFilters]
  );

  const periodBills = useMemo(
    () =>
      filterDashboardBills(allBills, {
        periods: selectedPeriods,
        ...sharedFilters,
      }),
    [allBills, selectedPeriods, sharedFilters]
  );

  const periodBillsCompare = useMemo(() => {
    if (!compareActive || comparePeriods.length === 0) return [];
    return filterDashboardBills(allBills, {
      periods: comparePeriods,
      ...sharedFilters,
    });
  }, [allBills, compareActive, comparePeriods, sharedFilters]);

  const { mainData, compareData, compareTrendData, locationCompareDataAligned } =
    useDashboardComparison(
      periodBills,
      selectedPeriods,
      periodBillsCompare,
      comparePeriods,
      baselineBills,
      compareActive
    );

  const approvedCount = periodBills.filter((bill) => isApprovedOrPaid(bill.status)).length;
  const compareApprovedCount = compareData
    ? periodBillsCompare.filter((bill) => isApprovedOrPaid(bill.status)).length
    : null;

  const cityOptions = useMemo(
    () => [
      { value: 'all', label: 'Todas las ciudades' },
      ...availableCities.map((city) => ({ value: city, label: city })),
    ],
    [availableCities]
  );

  const siteMultiOptions = useMemo(
    () => availableSites.map((siteName) => ({ value: siteName, label: siteName })),
    [availableSites]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#cf1b22]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-gradient-to-r from-[#cf1b22] via-[#a11217] to-[#50504f] rounded-2xl shadow-xl p-6 sm:p-8 text-white">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard de Pagos</h1>
        <p className="text-white/85 mt-2">
          Indicadores de facturas agregados en cliente desde el listado autorizado.
        </p>
      </div>

      <div className="sticky top-16 z-40 bg-white rounded-lg border border-gray-200 shadow-sm px-3 py-2.5 sm:px-4 sm:py-3 space-y-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[#50504f]">
              Filtros
            </h2>
            <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={compareActive}
                onChange={(e) => setCompareActive(e.target.checked)}
                className="rounded border-gray-300 text-[#cf1b22] focus:ring-[#cf1b22] h-3.5 w-3.5"
              />
              <span>Comparativo</span>
            </label>
          </div>
          {filtersActive && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 shrink-0 h-7 px-2 text-xs"
            >
              <FilterX className="w-3.5 h-3.5" aria-hidden />
              <span>Borrar</span>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 [&_label]:text-xs [&_label]:mb-0.5">
          <Select
            label="Vista temporal"
            value={rangeMode}
            options={RANGE_MODE_OPTIONS}
            onChange={(e) => handleRangeModeChange(e.target.value as DashboardRangeMode)}
            className="py-1.5 text-sm min-h-0"
          />
          <DashboardMultiSelect
            label="Tipo de servicio"
            options={SERVICE_TYPE_MULTI_OPTIONS}
            selectedValues={serviceTypeFilters}
            onChange={handleServiceTypeFiltersChange}
            allLabel="Todos los servicios"
          />
          <Select
            label="Ciudad"
            value={cityFilter}
            options={cityOptions}
            onChange={(e) => handleCityChange(e.target.value)}
            className="py-1.5 text-sm min-h-0"
          />
          <DashboardMultiSelect
            label="Sede"
            options={siteMultiOptions}
            selectedValues={siteFilters}
            onChange={setSiteFilters}
            allLabel="Todas las sedes"
          />
          <Input
            label="Fecha inicio"
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(e) => setStartDate(e.target.value)}
            fullWidth
            className="py-1.5 text-sm min-h-0"
          />
          <Input
            label="Fecha fin"
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
            fullWidth
            className="py-1.5 text-sm min-h-0"
          />
        </div>

        {(rangeMode !== 'global' || compareActive) && (
          <div className="border-t border-gray-100 pt-2 space-y-2">
            {rangeMode === 'month' && (
              <PeriodSelector
                availablePeriods={availablePeriods}
                selectedPeriods={selectedPeriods}
                onChange={handleMonthPeriodsChange}
              />
            )}

            {rangeMode === 'bimester' && (
              <RangeKeySelector
                title="Bimestres"
                keys={Object.keys(BIMESTER_MONTHS)}
                selectedKeys={selectedRangeKeys}
                onChange={(keys) => applyRangeKeys(keys, 'bimester', activeYear)}
                year={activeYear}
                availableYears={availableYears}
                onYearChange={(year) => {
                  setYearForRanges(year);
                  applyRangeKeys(selectedRangeKeys, 'bimester', year);
                }}
              />
            )}

            {rangeMode === 'quarter' && (
              <RangeKeySelector
                title="Trimestres"
                keys={Object.keys(QUARTER_MONTHS)}
                selectedKeys={selectedRangeKeys}
                onChange={(keys) => applyRangeKeys(keys, 'quarter', activeYear)}
                year={activeYear}
                availableYears={availableYears}
                onYearChange={(year) => {
                  setYearForRanges(year);
                  applyRangeKeys(selectedRangeKeys, 'quarter', year);
                }}
              />
            )}

            {rangeMode === 'semester' && (
              <RangeKeySelector
                title="Semestres"
                keys={Object.keys(SEMESTER_MONTHS)}
                selectedKeys={selectedRangeKeys}
                onChange={(keys) => applyRangeKeys(keys, 'semester', activeYear)}
                year={activeYear}
                availableYears={availableYears}
                onYearChange={(year) => {
                  setYearForRanges(year);
                  applyRangeKeys(selectedRangeKeys, 'semester', year);
                }}
              />
            )}

            {compareActive && (
              <PeriodSelector
                availablePeriods={availablePeriods}
                selectedPeriods={comparePeriods}
                onChange={setComparePeriods}
                label="Periodos comparativos"
              />
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPICard
          title={getTotalTitle(selectedPeriods)}
          value={formatCurrency(mainData.kpis.monthlyTotal)}
          change={selectedPeriods.length > 0 ? mainData.kpis.monthlyChange : undefined}
          compareValue={
            compareData ? formatCurrency(compareData.kpis.monthlyTotal) : null
          }
        />
        <KPICard
          title="Facturas aprobadas"
          value={approvedCount}
          compareValue={compareApprovedCount}
          accentClassName="bg-emerald-600"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <TrendChart trendData={mainData.trendData} compareData={compareTrendData} />
        <ServiceTypeChart
          serviceTypeData={mainData.serviceTypeData}
          onBarClick={setDetailServiceType}
        />
      </div>

      <LocationChart
        locationData={mainData.locationData}
        compareData={locationCompareDataAligned}
      />

      {detailServiceType && (
        <ServiceTypeDetailModal
          serviceType={detailServiceType}
          bills={periodBills}
          onClose={() => setDetailServiceType(null)}
        />
      )}
    </div>
  );
};
