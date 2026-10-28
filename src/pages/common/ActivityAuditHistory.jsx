import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockAuditHistory } from '../../data/mockData';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import {
  FileText,
  Search,
  Filter,
  Download,
  ShieldCheck,
  Info,
  Calendar,
} from 'lucide-react';

export default function ActivityAuditHistory() {
  const { user, role } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('All');

  const filteredLogs = mockAuditHistory.filter((log) => {
    const matchesSearch =
      log.userRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction =
      actionFilter === 'All' ||
      log.action.toLowerCase().includes(actionFilter.toLowerCase());
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <PageHeader
        badge="Audit Compliance"
        badgeStatus="Immutable Log Standard"
        title="Activity & Medical Record Access History"
        subtitle="Chronological audit trail documenting healthcare professional views, document downloads, and clinical entries"
        action={
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={() => alert('Prototype action: Download Audit Log CSV')}
          >
            Export Audit Trail (CSV)
          </Button>
        }
      />

      {/* Mandatory Prototype / Architecture Notice */}
      <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl flex items-start gap-3 text-xs text-slate-700">
        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-slate-900 block mb-0.5">
            Audit Trail Demonstration Notice
          </span>
          This log displays sample access events for user verification. In the production deployment, every interaction is written to a tamper-evident audit store powered by the FastAPI backend event engine.
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-xl text-xs">
        <div className="w-full sm:w-72 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by action, user, or record..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white text-xs focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Filter Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
          >
            <option value="All">All Actions</option>
            <option value="Viewed">Viewed Records</option>
            <option value="prescription">Prescription Events</option>
            <option value="Uploaded">Uploaded Reports</option>
            <option value="vitals">Telemetry Logs</option>
          </select>
        </div>
      </div>

      {/* Audit History Table */}
      <Card title="Clinical Record Access Trail" icon={FileText}>
        <div className="overflow-x-auto -mx-4 md:-mx-5">
          <div className="inline-block min-w-full align-middle px-4 md:px-5">
            <table className="min-w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">User / Clinical Role</th>
                  <th className="py-3 px-3">Action Performed</th>
                  <th className="py-3 px-3">Resource / Record</th>
                  <th className="py-3 px-3">Access Terminal / IP</th>
                  <th className="py-3 px-3">Authorization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-medium">
                      {log.dateTime}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-bold text-slate-900">
                      {log.userRole}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {log.resource}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-slate-500">
                      {log.ipAddress}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={log.status} size="xs" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
