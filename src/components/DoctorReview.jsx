import React, { useState } from 'react';
import { Stethoscope, CheckCircle2, Clock, Send, MessageSquare, AlertCircle } from 'lucide-react';
import Button from './Button';

/**
 * DoctorReview
 * Section in the report reader showing the attending doctor's clinical review,
 * date, and notes; or an "Awaiting Doctor Review" state with [Request Doctor Review].
 */
export default function DoctorReview({
  doctorReview,
  defaultDoctor = 'Dr. Arun Kumar',
  reportName = 'Diagnostic Report',
  className = '',
}) {
  const [requested, setRequested] = useState(false);
  const [requestNotice, setRequestNotice] = useState(false);

  const review = doctorReview || {
    isReviewed: false,
    reviewedBy: null,
    reviewedDate: null,
    note: null,
  };

  const handleRequestReview = () => {
    setRequested(true);
    setRequestNotice(true);
    setTimeout(() => setRequestNotice(false), 4500);
  };

  return (
    <div className={`p-4 bg-white border border-slate-200 rounded-xl space-y-3 text-xs ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-teal-50 text-teal-700 rounded-lg border border-teal-100">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Doctor Review & Clinical Impression</h4>
            <p className="text-[11px] text-slate-500">Official clinician oversight and consultation directives</p>
          </div>
        </div>

        <div>
          {review.isReviewed ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Doctor Reviewed</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Awaiting Doctor Review</span>
            </span>
          )}
        </div>
      </div>

      {/* Reviewed State */}
      {review.isReviewed ? (
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <span className="text-[11px] text-slate-400 block">Reviewed by:</span>
              <strong className="text-slate-900 font-bold text-xs">{review.reviewedBy || defaultDoctor}</strong>
              {review.department && (
                <span className="text-[11px] text-teal-700 block mt-0.5">{review.department}</span>
              )}
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Review Date:</span>
              <strong className="text-slate-900 font-bold text-xs">{review.reviewedDate || '25 Sep 2026'}</strong>
              <span className="text-[11px] text-slate-400 block mt-0.5">Verified Electronic Signature</span>
            </div>
          </div>

          {/* Doctor Note */}
          <div className="p-3 bg-teal-50/60 border border-teal-200/80 rounded-xl space-y-1">
            <span className="font-bold text-teal-950 block text-[11px] uppercase tracking-wider flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-teal-700" />
              <span>Doctor's Clinical Note:</span>
            </span>
            <p className="text-slate-800 leading-relaxed font-medium">
              "{review.note || 'Please discuss the highlighted results during the next consultation.'}"
            </p>
          </div>
        </div>
      ) : (
        /* Awaiting Review State */
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <p className="text-slate-600 leading-relaxed">
            This report has been uploaded to your health vault and is queued for clinical review by your assigned physician ({defaultDoctor}).
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-slate-500">
              Assigned Clinician: <strong className="text-slate-800">{defaultDoctor}</strong>
            </span>

            <Button
              variant="outline"
              size="sm"
              icon={Send}
              onClick={handleRequestReview}
              disabled={requested}
              className="text-xs"
            >
              {requested ? 'Review Requested ✓' : 'Request Doctor Review'}
            </Button>
          </div>

          {requestNotice && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Doctor review request sent to {defaultDoctor}. You will be notified when review is signed off.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
