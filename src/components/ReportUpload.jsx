import React, { useState, useRef } from 'react';
import {
  Upload,
  FileCheck2,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  Calendar,
  Building2,
  Stethoscope,
  Info,
  Clock,
  ArrowRight,
} from 'lucide-react';
import Button from './Button';
import { reportService } from '../services/reportService';

/**
 * ReportUpload
 * Professional upload interface featuring:
 * - Drag & drop area: "Drop your medical report here" or [Choose File]
 * - Supported formats: PDF, JPG, PNG
 * - Displays: File Name, File Size, File Type
 * - Stages simulation: Uploading → Processing → Ready
 * - Safety notice: "Sample processing for frontend demonstration."
 */
export default function ReportUpload({
  isOpen,
  onClose,
  onUploadSuccess,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [reportName, setReportName] = useState('');
  const [reportType, setReportType] = useState('Blood Tests');
  const [hospital, setHospital] = useState('City Diagnostic Center');
  const [doctor, setDoctor] = useState('Dr. Arun Kumar');
  const [validationError, setValidationError] = useState('');
  
  // Pipeline simulation stages: 'idle' | 'uploading' | 'processing' | 'ready'
  const [stage, setStage] = useState('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const validateAndSetFile = (file) => {
    setValidationError('');
    setStage('idle');

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();

    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      setValidationError('Please select a PDF, JPG, or PNG file.');
      setSelectedFile(null);
      return;
    }

    const maxSizeBytes = 15 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setValidationError('File size exceeds the 15MB limit. Please choose a smaller file.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    if (!reportName) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      setReportName(cleanName);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleStartUpload = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!selectedFile) {
      setValidationError('Please select a PDF, JPG, or PNG file to upload.');
      return;
    }

    // Step 1: Uploading simulation
    setStage('uploading');
    setUploadProgress(20);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 85) {
          clearInterval(interval);
          return 90;
        }
        return prev + 25;
      });
    }, 150);

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      clearInterval(interval);
      setUploadProgress(100);

      // Step 2: Processing simulation (document parsing & table extraction)
      setStage('processing');
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Step 3: Ready state
      const createdReport = await reportService.uploadReport({
        file: selectedFile,
        reportName,
        reportType,
        hospital,
        doctor,
      });

      setStage('ready');

      if (onUploadSuccess) {
        onUploadSuccess(createdReport);
      }
    } catch (err) {
      clearInterval(interval);
      setStage('idle');
      setValidationError('Upload failed. Please try again.');
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setReportName('');
    setValidationError('');
    setUploadProgress(0);
    setStage('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileType = (name) => {
    const ext = name.split('.').pop()?.toUpperCase();
    return ext ? `${ext} Document` : 'Document';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-lg border border-teal-100">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Upload Medical Report</h3>
              <p className="text-[11px] text-slate-500">Supported formats: PDF, JPG, PNG (Max 15MB)</p>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {stage === 'ready' ? (
            /* Ready Success State */
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Report Ready & Structured</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  "{reportName}" has been parsed into your Digital Records.
                </p>
              </div>

              {/* Status progression indicator */}
              <div className="flex items-center justify-center gap-2 text-[11px] font-bold py-1">
                <span className="text-slate-400">Uploading ✓</span>
                <ArrowRight className="w-3 h-3 text-slate-300" />
                <span className="text-slate-400">Processing ✓</span>
                <ArrowRight className="w-3 h-3 text-slate-300" />
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Ready
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs max-w-sm mx-auto space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">File Name:</span>
                  <span className="font-medium text-slate-800 truncate max-w-[200px]">{selectedFile?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">File Size:</span>
                  <span className="font-medium text-slate-800">{formatFileSize(selectedFile?.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Category:</span>
                  <span className="font-medium text-slate-800">{reportType}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                >
                  Upload Another
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    resetForm();
                    onClose();
                  }}
                  className="bg-teal-700 hover:bg-teal-800"
                >
                  View in Dashboard
                </Button>
              </div>
            </div>
          ) : (
            /* Upload Form */
            <form onSubmit={handleStartUpload} className="space-y-4 text-xs">
              {/* Drag & Drop Area (Requirement 17) */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                  isDragOver
                    ? 'border-teal-500 bg-teal-50/40'
                    : selectedFile
                    ? 'border-teal-400 bg-teal-50/20'
                    : 'border-slate-300 hover:border-teal-400 bg-slate-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3 text-left">
                    <div className="p-2.5 bg-white border border-teal-200 rounded-lg text-teal-700 shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-slate-900 truncate">{selectedFile.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {formatFileSize(selectedFile.size)} • {getFileType(selectedFile.name)}
                      </p>
                      <span className="text-[10px] text-teal-700 font-semibold mt-0.5 inline-block">
                        Click or drag new file to replace
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 py-3">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                    <div>
                      <p className="font-bold text-slate-800 text-sm">Drop your medical report here</p>
                      <p className="text-slate-500 text-xs mt-0.5">or click to browse from device</p>
                    </div>
                    <span className="inline-block px-3 py-1 bg-white border border-slate-300 rounded-md font-semibold text-slate-700 text-xs shadow-2xs hover:bg-slate-50">
                      Choose File
                    </span>
                    <p className="text-[11px] text-slate-400 pt-1">
                      Supported: PDF, JPG, PNG up to 15MB
                    </p>
                  </div>
                )}
              </div>

              {/* Selected File Details Cards (Requirement 17) */}
              {selectedFile && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs animate-in fade-in">
                  <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                    Selected File Details:
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">File Name</span>
                      <strong className="truncate block font-semibold" title={selectedFile.name}>
                        {selectedFile.name}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">File Size</span>
                      <strong className="font-semibold">{formatFileSize(selectedFile.size)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">File Type</span>
                      <strong className="font-semibold">{getFileType(selectedFile.name)}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Validation error */}
              {validationError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Stages Simulation Indicator (Requirement 17: Uploading → Processing → Ready) */}
              {(stage === 'uploading' || stage === 'processing') && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 text-teal-600 animate-spin" />
                      {stage === 'uploading' ? 'Uploading document...' : 'Simulating document parsing & table extraction...'}
                    </span>
                    <span className="font-bold text-teal-700">
                      {stage === 'uploading' ? `${uploadProgress}%` : 'Processing'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 pt-1">
                    <span className={stage === 'uploading' ? 'text-teal-700 font-bold' : 'text-emerald-700'}>
                      1. Uploading
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className={stage === 'processing' ? 'text-teal-700 font-bold' : 'text-slate-400'}>
                      2. Processing
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-400">
                      3. Ready
                    </span>
                  </div>
                </div>
              )}

              {/* Metadata Inputs */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Report Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="e.g. Complete Blood Count (CBC)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:border-teal-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Report Category:
                    </label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white focus:border-teal-500 focus:outline-hidden"
                    >
                      <option value="Blood Tests">Blood Tests</option>
                      <option value="Urine Tests">Urine Tests</option>
                      <option value="Imaging">Imaging</option>
                      <option value="X-Ray">X-Ray</option>
                      <option value="CT">CT</option>
                      <option value="MRI">MRI</option>
                      <option value="Ultrasound">Ultrasound</option>
                      <option value="ECG">ECG</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Hospital / Laboratory:
                    </label>
                    <input
                      type="text"
                      value={hospital}
                      onChange={(e) => setHospital(e.target.value)}
                      placeholder="e.g. City Diagnostic Center"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:border-teal-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Requirement 17 Notice */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  Sample processing for frontend demonstration. Files are processed locally in mock state without external OCR or database transmission.
                </span>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetForm();
                    onClose();
                  }}
                  disabled={stage === 'uploading' || stage === 'processing'}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  icon={Upload}
                  disabled={stage === 'uploading' || stage === 'processing' || !selectedFile}
                  className="bg-teal-700 hover:bg-teal-800"
                >
                  {stage === 'uploading' ? 'Uploading...' : stage === 'processing' ? 'Processing...' : 'Upload'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
