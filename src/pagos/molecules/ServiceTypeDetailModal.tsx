import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { ServiceType, UtilityBill } from '../types';
import { buildServiceTypeDetailRows } from '../utils/dashboardHelpers';
import { formatCurrency, translateServiceType, translateStatus } from '../utils/formatters';

interface ServiceTypeDetailModalProps {
  serviceType: ServiceType;
  bills: UtilityBill[];
  onClose: () => void;
}

export const ServiceTypeDetailModal: React.FC<ServiceTypeDetailModalProps> = ({
  serviceType,
  bills,
  onClose,
}) => {
  const rows = useMemo(
    () => buildServiceTypeDetailRows(bills, serviceType),
    [bills, serviceType]
  );

  const totalAmount = useMemo(
    () => rows.reduce((sum, row) => sum + row.amount, 0),
    [rows]
  );

  const title = translateServiceType(serviceType);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-type-detail-title"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 id="service-type-detail-title" className="text-xl font-bold text-gray-900">
              Detalle: {title}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {rows.length} factura(s) · Total {formatCurrency(totalAmount)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          {rows.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No hay facturas para este tipo de servicio con los filtros actuales.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="py-2 pr-3 font-semibold">Factura</th>
                    <th className="py-2 pr-3 font-semibold">Periodo</th>
                    <th className="py-2 pr-3 font-semibold">Sede</th>
                    <th className="py-2 pr-3 font-semibold">Ciudad</th>
                    <th className="py-2 pr-3 font-semibold">Proveedor</th>
                    <th className="py-2 pr-3 font-semibold">Estado</th>
                    <th className="py-2 pl-3 font-semibold text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={`${row.billId}-${row.provider}`} className="border-b border-gray-100">
                      <td className="py-2 pr-3 text-gray-900 font-medium">{row.invoiceNumber}</td>
                      <td className="py-2 pr-3 text-gray-700">{row.period}</td>
                      <td className="py-2 pr-3 text-gray-700">{row.siteName}</td>
                      <td className="py-2 pr-3 text-gray-700">{row.city}</td>
                      <td className="py-2 pr-3 text-gray-700">{row.provider}</td>
                      <td className="py-2 pr-3 text-gray-700">{translateStatus(row.status)}</td>
                      <td className="py-2 pl-3 text-right font-semibold text-gray-900">
                        {formatCurrency(row.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200">
                    <td colSpan={6} className="py-3 pr-3 text-right font-semibold text-gray-700">
                      Total {title}
                    </td>
                    <td className="py-3 pl-3 text-right font-bold text-[#cf1b22]">
                      {formatCurrency(totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
