import React from 'react';
import { mockFollowUps } from '../../data/mockData';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import { Clock, Bell } from 'lucide-react';

export default function FollowUps() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        badge="Continuity of Care"
        badgeStatus="Automated Follow-ups"
        title="Clinical Follow-up Schedule"
        subtitle="Scheduled physician re-evaluations and post-consultation chronic reviews"
      />

      {/* Follow-ups List */}
      <div className="space-y-4">
        {mockFollowUps.map((fu) => (
          <Card key={fu.id}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0 border border-teal-200">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-sm">{fu.doctorName}</h3>
                    <StatusBadge status={fu.status} size="xs" />
                    {fu.reminderSent && (
                      <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 flex items-center gap-1 font-medium">
                        <Bell className="w-3 h-3" /> Reminder Set
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700">
                    <strong>Clinical Purpose:</strong> {fu.reason}
                  </p>
                  <p className="text-xs text-slate-500">
                    Target Review Date: <strong className="text-slate-900">{fu.followUpDate}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  icon={Bell}
                  onClick={() => alert(`Prototype action: Reminder notification sent for ${fu.followUpDate}.`)}
                >
                  Resend Reminder
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {mockFollowUps.length === 0 && (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-xs sm:text-sm">
            No clinical follow-ups scheduled at this time.
          </div>
        )}
      </div>
    </div>
  );
}
