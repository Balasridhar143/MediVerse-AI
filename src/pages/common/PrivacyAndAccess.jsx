import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockAccessGrants } from '../../data/mockData';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import {
  ShieldCheck,
  Building2,
  Stethoscope,
  FlaskConical,
  Lock,
  Info,
  CheckCircle2,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyAndAccess() {
  const { user, role } = useAuth();
  const [grants, setGrants] = useState(mockAccessGrants);
  const [message, setMessage] = useState('');

  const handleRevoke = (id, name) => {
    setGrants(
      grants.map((g) =>
        g.id === id ? { ...g, status: 'Revoked by Patient' } : g
      )
    );
    setMessage(`Access authorization for ${name} has been revoked.`);
    setTimeout(() => setMessage(''), 4000);
  };

  const getRolePrefix = () => {
    if (role === 'doctor') return '/doctor';
    if (role === 'hospital_admin' || role === 'hospital') return '/hospital';
    return '/patient';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <PageHeader
        badge="Consent & Privacy Governance"
        badgeStatus="ABHA & FHIR Compliant"
        title="Privacy & Medical Record Access Governance"
        subtitle="Manage which licensed healthcare providers, hospitals, and diagnostic units are authorized to access clinical records"
        action={
          <Link to={`${getRolePrefix()}/activity`}>
            <Button variant="outline" size="sm" icon={Eye}>
              View Audit Access Log
            </Button>
          </Link>
        }
      />

      {/* Transparency & Governance Notice */}
      <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl flex items-start gap-3 text-xs text-slate-700">
        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-slate-900 block mb-0.5">
            Patient Data Sovereignty & Consent Policy
          </span>
          Under health data protection standards, medical records, diagnostic investigations, and telemetry history can only be accessed by explicitly authorized clinical entities. You may review or modify consent parameters at any time.
        </div>
      </div>

      {message && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Authorized Entities List */}
      <div className="space-y-4">
        <Card
          title="Active Medical Record Access Authorizations"
          subtitle="Clinicians and healthcare organizations currently holding authorized clinical data access"
          icon={ShieldCheck}
        >
          <div className="space-y-3.5">
            {grants.map((grant) => {
              const isRevoked = grant.status === 'Revoked by Patient';
              return (
                <div
                  key={grant.id}
                  className={`p-4 rounded-xl border transition-colors ${
                    isRevoked
                      ? 'bg-slate-50/70 border-slate-200 opacity-60'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                        {grant.entityType === 'Doctor' ? (
                          <Stethoscope className="w-5 h-5" />
                        ) : grant.entityType === 'Hospital' ? (
                          <Building2 className="w-5 h-5" />
                        ) : (
                          <FlaskConical className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{grant.entityName}</h4>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {grant.entityType}
                          </span>
                        </div>
                        <p className="text-slate-500 text-xs">
                          {grant.organization} • {grant.specialty}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <StatusBadge status={grant.status} size="xs" />
                    </div>
                  </div>

                  <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                        Authorized Scope
                      </span>
                      <strong className="text-teal-900 text-xs mt-0.5 block">
                        {grant.accessScope}
                      </strong>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                        Consent Type
                      </span>
                      <span className="text-slate-700 text-xs font-medium mt-0.5 block">
                        {grant.consentType}
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                        Validity Period
                      </span>
                      <span className="text-slate-700 text-xs font-medium mt-0.5 block">
                        Valid until {grant.expiryDate}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">
                      Authorization ID: {grant.id} • Granted: {grant.grantedDate}
                    </span>

                    {!isRevoked ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => alert(`Modify consent parameters for ${grant.entityName}`)}
                          className="px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 font-semibold cursor-pointer text-xs"
                        >
                          Modify Scope
                        </button>
                        <button
                          onClick={() => handleRevoke(grant.id, grant.entityName)}
                          className="px-2.5 py-1 text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 font-semibold cursor-pointer text-xs"
                        >
                          Revoke Access
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-rose-600 font-semibold">Consent Revoked</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Privacy Policy Guarantee Card */}
      <Card title="PulseCare Privacy Framework" icon={Lock}>
        <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
          <p>
            • <strong>Zero Third-Party Advertising:</strong> Patient clinical information is never monetized, brokered, or shared with commercial advertising entities.
          </p>
          <p>
            • <strong>Encryption at Rest & in Transit:</strong> End-to-end TLS 1.3 encryption is enforced across tele-consultation rooms and medical document vaults.
          </p>
          <p>
            • <strong>Audit-Trail Immutability:</strong> Every view, download, or edit of diagnostic reports or prescription data produces a permanent audit record.
          </p>
        </div>
      </Card>
    </div>
  );
}
