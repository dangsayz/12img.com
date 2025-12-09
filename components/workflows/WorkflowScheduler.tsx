'use client';

// =============================================================================
// WORKFLOW SCHEDULER
// World-class modal for scheduling workflow automations
// Perfect touch ergonomics with 48px+ touch targets
// =============================================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, AlertCircle, Loader2, ArrowLeft, ArrowRight, Send, Mail } from 'lucide-react';
import {
  WorkflowTemplate,
  WorkflowFormData,
  WorkflowPreview,
  WorkflowLimitsResponse,
  formatDaysOffset,
} from '@/lib/workflows/types';
import {
  getWorkflowTemplates,
  previewWorkflow,
  scheduleWorkflow,
  getWorkflowLimits,
} from '@/server/actions/workflow.actions';
import { TemplateSelector } from './TemplateSelector';

// -----------------------------------------------------------------------------
// Animation Variants
// -----------------------------------------------------------------------------

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 10 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { type: 'spring' as const, damping: 30, stiffness: 400 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.96, 
    y: 10,
    transition: { duration: 0.15 }
  },
};

const contentVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface WorkflowSchedulerProps {
  clientId: string;
  clientName: string;
  eventDate: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'select' | 'configure' | 'preview';

const STEP_TITLES: Record<Step, string> = {
  select: 'Add Automation',
  configure: 'Configure Timing',
  preview: 'Review & Schedule',
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function WorkflowScheduler({
  clientId,
  clientName,
  eventDate,
  isOpen,
  onClose,
  onSuccess,
}: WorkflowSchedulerProps) {
  // State
  const [step, setStep] = useState<Step>('select');
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [limits, setLimits] = useState<WorkflowLimitsResponse | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [daysOffset, setDaysOffset] = useState<number>(-14);
  const [preview, setPreview] = useState<WorkflowPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Load templates and limits on open
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [templatesData, limitsData] = await Promise.all([
        getWorkflowTemplates(),
        getWorkflowLimits(),
      ]);
      setTemplates(templatesData);
      setLimits(limitsData);
    } catch (e) {
      setError('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Reset on close
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('select');
        setSelectedTemplate(null);
        setDaysOffset(-14);
        setPreview(null);
        setError(null);
      }, 300);
    }
  }, [isOpen]);

  // ---------------------------------------------------------------------------
  // Handle template selection
  // ---------------------------------------------------------------------------
  const handleSelectTemplate = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setDaysOffset(template.defaultDaysOffset);
    setError(null);
  };

  // ---------------------------------------------------------------------------
  // Handle next step
  // ---------------------------------------------------------------------------
  const handleNext = async () => {
    if (step === 'select' && selectedTemplate) {
      setStep('configure');
    } else if (step === 'configure') {
      // Load preview
      setIsLoading(true);
      setError(null);
      try {
        const result = await previewWorkflow(clientId, {
          templateId: selectedTemplate!.id,
          daysOffset,
        });
        if ('error' in result) {
          setError(result.error);
        } else {
          setPreview(result);
          setStep('preview');
        }
      } catch (e) {
        setError('Failed to generate preview');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Handle schedule
  // ---------------------------------------------------------------------------
  const handleSchedule = async () => {
    if (!selectedTemplate) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await scheduleWorkflow(clientId, {
        templateId: selectedTemplate.id,
        daysOffset,
      });

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Failed to schedule');
      }
    } catch (e) {
      setError('Failed to schedule workflow');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Calculate scheduled date
  // ---------------------------------------------------------------------------
  const getScheduledDate = (): Date | null => {
    if (!eventDate) return null;
    const date = new Date(eventDate);
    date.setDate(date.getDate() + daysOffset);
    date.setHours(9, 0, 0, 0);
    return date;
  };

  const scheduledDate = getScheduledDate();
  const isPastDate = scheduledDate && scheduledDate < new Date();

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal - Centered on all devices */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          >
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
              {/* Header - Clean, centered design */}
              <div className="relative px-6 pt-6 pb-4">
                {/* Close button - Large touch target */}
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>

                {/* Back button - Large touch target */}
                {step !== 'select' && (
                  <motion.button
                    onClick={() => setStep(step === 'preview' ? 'configure' : 'select')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </motion.button>
                )}

                {/* Centered Title */}
                <div className="text-center pt-2">
                  <h2 className="text-lg font-medium text-stone-900 tracking-tight">
                    {STEP_TITLES[step]}
                  </h2>
                  <p className="text-sm text-stone-500 mt-1">
                    for {clientName}
                  </p>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  {(['select', 'configure', 'preview'] as Step[]).map((s, i) => (
                    <div
                      key={s}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        s === step 
                          ? 'w-8 bg-stone-900' 
                          : i < ['select', 'configure', 'preview'].indexOf(step)
                            ? 'w-4 bg-stone-400'
                            : 'w-4 bg-stone-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Content - Centered with breathing room */}
              <div className="flex-1 overflow-y-auto px-6 pb-4">
                <AnimatePresence mode="wait">
                  {/* Loading State */}
                  {isLoading && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-16"
                    >
                      <Loader2 className="w-8 h-8 text-stone-300 animate-spin" />
                      <p className="text-sm text-stone-400 mt-3">Loading templates...</p>
                    </motion.div>
                  )}

                  {/* Limit Warning */}
                  {!isLoading && limits && !limits.canCreateWorkflow && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 bg-stone-50 border border-stone-200 rounded-xl text-center"
                    >
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-stone-100 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-stone-500" />
                      </div>
                      <p className="text-sm font-medium text-stone-900">
                        Automation limit reached
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        {limits.activeWorkflows} of {limits.maxActiveWorkflows} active
                      </p>
                    </motion.div>
                  )}

                  {/* No Event Date Warning */}
                  {!isLoading && !eventDate && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 bg-stone-50 border border-stone-200 rounded-xl text-center"
                    >
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-stone-100 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-stone-500" />
                      </div>
                      <p className="text-sm font-medium text-stone-900">
                        No event date set
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        Set an event date to schedule automations
                      </p>
                    </motion.div>
                  )}

                  {/* Step: Select Template */}
                  {!isLoading && step === 'select' && (
                    <motion.div
                      key="select"
                      variants={contentVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.2 }}
                    >
                      <TemplateSelector
                        templates={templates}
                        selectedId={selectedTemplate?.id || null}
                        onSelect={handleSelectTemplate}
                      />
                    </motion.div>
                  )}

                  {/* Step: Configure Timing */}
                  {!isLoading && step === 'configure' && selectedTemplate && (
                    <motion.div
                      key="configure"
                      variants={contentVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      {/* Selected Template Card */}
                      <div className="p-4 bg-stone-50 rounded-xl text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-stone-900 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-sm font-medium text-stone-900">
                          {selectedTemplate.name}
                        </p>
                        <p className="text-xs text-stone-500 mt-1">
                          {selectedTemplate.description}
                        </p>
                      </div>

                      {/* Timing Selector - Touch optimized */}
                      <div className="text-center">
                        <label className="block text-sm font-medium text-stone-700 mb-4">
                          When should this email be sent?
                        </label>
                        <div className="flex items-center justify-center gap-3">
                          <input
                            type="number"
                            value={Math.abs(daysOffset)}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setDaysOffset(daysOffset < 0 ? -val : val);
                            }}
                            className="w-20 h-12 px-3 border border-stone-200 rounded-xl text-center text-lg font-medium focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
                            min={0}
                            max={365}
                          />
                          <span className="text-sm text-stone-500">days</span>
                          <select
                            value={daysOffset < 0 ? 'before' : 'after'}
                            onChange={(e) => {
                              const abs = Math.abs(daysOffset);
                              setDaysOffset(e.target.value === 'before' ? -abs : abs);
                            }}
                            className="h-12 px-4 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm"
                          >
                            <option value="before">before event</option>
                            <option value="after">after event</option>
                          </select>
                        </div>
                      </div>

                      {/* Scheduled Date Preview */}
                      {scheduledDate && (
                        <div className={`p-4 rounded-xl text-center ${isPastDate ? 'bg-red-50' : 'bg-stone-50'}`}>
                          <div className="flex items-center justify-center gap-2">
                            <Calendar className={`w-4 h-4 ${isPastDate ? 'text-red-500' : 'text-stone-500'}`} />
                            <span className={`text-sm ${isPastDate ? 'text-red-700' : 'text-stone-700'}`}>
                              {isPastDate ? 'Date is in the past' : 'Will send on'}
                            </span>
                          </div>
                          <p className={`text-base font-medium mt-1 ${isPastDate ? 'text-red-900' : 'text-stone-900'}`}>
                            {scheduledDate.toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="text-xs text-stone-500 mt-0.5">at 9:00 AM</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Step: Preview */}
                  {!isLoading && step === 'preview' && preview && (
                    <motion.div
                      key="preview"
                      variants={contentVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.2 }}
                      className="space-y-5"
                    >
                      {/* Summary Card */}
                      <div className="p-4 bg-stone-50 rounded-xl space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-stone-500">To</span>
                          <span className="text-stone-900 font-medium">{preview.recipientEmail}</span>
                        </div>
                        <div className="h-px bg-stone-200" />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-stone-500">Send date</span>
                          <span className="text-stone-900 font-medium">
                            {new Date(preview.scheduledFor).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Email Preview */}
                      <div>
                        <p className="text-[10px] font-medium text-stone-400 uppercase tracking-[0.2em] text-center mb-3">
                          Email Preview
                        </p>
                        <div className="border border-stone-200 rounded-xl overflow-hidden">
                          <div className="bg-stone-50 px-4 py-3 border-b border-stone-200">
                            <p className="text-sm font-medium text-stone-900 truncate">
                              {preview.subject}
                            </p>
                          </div>
                          <div
                            className="p-4 text-sm prose prose-sm max-w-none bg-white"
                            style={{ maxHeight: '200px', overflow: 'auto' }}
                            dangerouslySetInnerHTML={{ __html: preview.bodyHtml }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-center"
                  >
                    <p className="text-sm text-red-700">{error}</p>
                  </motion.div>
                )}
              </div>

              {/* Footer - Large touch targets */}
              <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/50">
                <div className="flex items-center gap-3">
                  {/* Cancel - Full width on mobile when alone */}
                  <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 h-12 px-6 text-sm font-medium text-stone-600 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors"
                  >
                    Cancel
                  </motion.button>

                  {/* Primary Action */}
                  {step === 'select' && (
                    <motion.button
                      onClick={handleNext}
                      disabled={!selectedTemplate || !eventDate || !!(limits && !limits.canCreateWorkflow)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 h-12 px-6 text-sm font-medium text-white bg-stone-900 rounded-xl hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  )}
                  {step === 'configure' && (
                    <motion.button
                      onClick={handleNext}
                      disabled={!!isPastDate || isLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 h-12 px-6 text-sm font-medium text-white bg-stone-900 rounded-xl hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Preview
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  )}
                  {step === 'preview' && (
                    <motion.button
                      onClick={handleSchedule}
                      disabled={isSubmitting}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 h-12 px-6 text-sm font-medium text-white bg-stone-900 rounded-xl hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Schedule
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default WorkflowScheduler;
