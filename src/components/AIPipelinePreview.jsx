import React from 'react';
import {
  FileText,
  FileSearch,
  BookOpen,
  Hash,
  Database,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';

/**
 * AIPipelinePreview
 * Natural visual architecture diagram illustrating the future AI/RAG processing pipeline.
 * Labeled clearly: "AI/RAG processing will be connected in the backend phase."
 */
export default function AIPipelinePreview({ className = '' }) {
  const pipelineSteps = [
    {
      title: 'Report Document',
      desc: 'PDF, JPG, or PNG upload',
      icon: FileText,
    },
    {
      title: 'Document Extraction',
      desc: 'Structural parsing & tables',
      icon: FileSearch,
    },
    {
      title: 'Medical Terms',
      desc: 'Ontology & glossary mapping',
      icon: BookOpen,
    },
    {
      title: 'Important Values',
      desc: 'Reference range detection',
      icon: Hash,
    },
    {
      title: 'Verified Medical Knowledge',
      desc: 'Clinical database grounding',
      icon: Database,
    },
    {
      title: 'Easy Explanation',
      desc: 'Patient-friendly clarity & voice',
      icon: Sparkles,
    },
  ];

  return (
    <div className={`p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Diagnostic Clarity Architecture</span>
        </div>
        <span className="text-[10px] bg-teal-50 text-teal-800 font-semibold px-2 py-0.5 rounded border border-teal-200">
          AI/RAG processing will be connected in the backend phase
        </span>
      </div>

      {/* Horizontal Steps on desktop, responsive stack */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 pt-1">
        {pipelineSteps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="p-2.5 bg-white border border-slate-200 rounded-lg text-center space-y-1 relative group hover:border-teal-400 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 mx-auto flex items-center justify-center">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <h5 className="font-bold text-slate-900 text-[11px] leading-tight">
                {step.title}
              </h5>
              <p className="text-[10px] text-slate-400 leading-tight">
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>

      <div className="text-[11px] text-slate-500 pt-1 flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>
          Current prototype employs verified frontend models. Future Phase will connect server-side document extraction and clinical knowledge retrieval.
        </span>
      </div>
    </div>
  );
}
