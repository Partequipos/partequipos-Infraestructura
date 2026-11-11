import { useMemo } from 'react';
import { normalizeBillCity } from '../constants/billSiteRegistry';
import { UtilityBill } from '../types';
import { collectCanonicalSiteFilterOptions } from '../utils/billSiteResolution';

const sortLabels = (values: string[]): string[] =>
  [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'es', { sensitivity: 'base' })
  );

export const useDashboardFilterOptions = (
  allBills: UtilityBill[],
  cityFilter: string = 'all'
) =>
  useMemo(() => {
    const availablePeriods = [
      ...new Set(allBills.map((bill) => bill.period).filter(Boolean)),
    ].sort((a, b) => b.localeCompare(a));

    const availableCities = sortLabels(
      allBills.map((bill) => normalizeBillCity(bill.city)).filter(Boolean)
    );

    const billsForSites =
      cityFilter && cityFilter !== 'all'
        ? allBills.filter((bill) => normalizeBillCity(bill.city) === cityFilter)
        : allBills;

    const availableSites = collectCanonicalSiteFilterOptions(billsForSites);

    const yearsFromPeriods = availablePeriods
      .map((period) => Number(period.slice(0, 4)))
      .filter((year) => Number.isFinite(year));

    const availableYears = [...new Set(yearsFromPeriods)].sort((a, b) => b - a);
    if (availableYears.length === 0) {
      availableYears.push(new Date().getFullYear());
    }

    return { availablePeriods, availableSites, availableCities, availableYears };
  }, [allBills, cityFilter]);
