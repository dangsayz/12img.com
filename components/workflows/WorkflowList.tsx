'use client';

// =============================================================================
// WORKFLOW LIST
// World-class workflow display with perfect touch ergonomics
// Centered design, 48px+ touch targets, elegant animations
// =============================================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Mail,
  ChevronDown,
  Trash2,
  Eye,
  Calendar,
  Send,
} from 'lucide-react';
import { ScheduledWorkflow, WORKFLOW_STATUS_CONFIG, formatDaysOffset } from '@/lib/workflows/types';
import { cancelWorkflow } from '@/server/actions/workflow.actions';

// -----------------------------------------------------------------------------
// Date Helpers
// -----------------------------------------------------------------------------

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0) return `In ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
}

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface WorkflowListProps {
  workflows: ScheduledWorkflow[];
  onRefresh: () => void;
  onPreview?: (workflow: ScheduledWorkflow) => void;
}

// -----------------------------------------------------------------------------
// Status Icons
// -----------------------------------------------------------------------------

const STATUS_ICONS = {
  pending: Clock,
  sent: CheckCircle2,
  skipped: AlertCircle,
  failed: XCircle,
  cancelled: XCircle,
} as const;

// -----------------------------------------------------------------------------
// Animation Variants
// -----------------------------------------------------------------------------

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function WorkflowList({ workflows, onRefresh, onPreview }: WorkflowListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleCancel = async (e: React.MouseEvent, workflowId: string) => {
    e.stopPropagation();
    if (!confirm('Cancel this scheduled email?')) return;

    setCancellingId(workflowId);
    const result = await cancelWorkflow(workflowId);
    setCancellingId(null);

    if (result.success) {
      onRefresh();
    } else {
      alert(result.error || 'Failed to cancel');
    }
  };

  const handlePreview = (e: React.MouseEvent, workflow: ScheduledWorkflow) => {
    e.stopPropagation();
    onPreview?.(workflow);
  };

  // ---------------------------------------------------------------------------
  // Empty State - Centered, elegant
  // ---------------------------------------------------------------------------

  if (workflows.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
          <Send className="w-7 h-7 text-stone-400" />
        </div>
        <p className="text-sm font-medium text-stone-900">No automations scheduled</p>
        <p className="text-xs text-stone-500 mt-1 max-w-[200px] mx-auto">
          Add an automation to send emails automatically based on event date
        </p>
      </motion.div>
    );
  }

  // ---------------------------------------------------------------------------
  // Group workflows by status
  // ---------------------------------------------------------------------------

  const pendingWorkflows = workflows.filter((w) => w.status === 'pending');
  const completedWorkflows = workflows.filter((w) => w.status !== 'pending');

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-8">
      {/* Pending Workflows */}
      {pendingWorkflows.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-stone-400 uppercase tracking-[0.2em] text-center mb-4">
            Scheduled · {pendingWorkflows.length}
          </p>
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {pendingWorkflows.map((workflow) => (
              <WorkflowItem
                key={workflow.id}
                workflow={workflow}
                isExpanded={expandedId === workflow.id}
                isCancelling={cancellingId === workflow.id}
                onToggle={() => setExpandedId(expandedId === workflow.id ? null : workflow.id)}
                onCancel={(e) => handleCancel(e, workflow.id)}
                onPreview={(e) => handlePreview(e, workflow)}
              />
            ))}
          </motion.div>
        </div>
      )}

      {/* Completed Workflows */}
      {completedWorkflows.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-stone-400 uppercase tracking-[0.2em] text-center mb-4">
            History · {completedWorkflows.length}
          </p>
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {completedWorkflows.map((workflow) => (
              <WorkflowItem
                key={workflow.id}
                workflow={workflow}
                isExpanded={expandedId === workflow.id}
                isCancelling={false}
                onToggle={() => setExpandedId(expandedId === workflow.id ? null : workflow.id)}
                onPreview={(e) => handlePreview(e, workflow)}
              />
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Workflow Item Component
// -----------------------------------------------------------------------------

interface WorkflowItemProps {
  workflow: ScheduledWorkflow;
  isExpanded: boolean;
  isCancelling: boolean;
  onToggle: () => void;
  onCancel?: (e: React.MouseEvent) => void;
  onPreview?: (e: React.MouseEvent) => void;
}

function WorkflowItem({
  workflow,
  isExpanded,
  isCancelling,
  onToggle,
  onCancel,
  onPreview,
}: WorkflowItemProps) {
  const config = WORKFLOW_STATUS_CONFIG[workflow.status];
  const StatusIcon = STATUS_ICONS[workflow.status];
  const isPending = workflow.status === 'pending';
  const isSent = workflow.status === 'sent';
  const scheduledDate = new Date(workflow.scheduledFor);

  return (
    <motion.div
      variants={itemVariants}
      layout
      className="bg-white rounded-xl border border-stone-100 overflow-hidden"
    >
      {/* Header Row - Touch optimized */}
      <motion.button
        onClick={onToggle}
        whileTap={{ scale: 0.995 }}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-stone-50/50 transition-colors min-h-[72px]"
      >
        {/* Status Icon */}
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
          ${isPending ? 'bg-stone-900 text-white' : isSent ? 'bg-stone-100 text-stone-500' : 'bg-stone-100 text-stone-400'}
        `}>
          <StatusIcon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-900 truncate">
            {workflow.emailSubject}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {isPending ? (
              <>
                <span className="text-xs font-medium text-stone-900">
                  {formatDistanceToNow(scheduledDate)}
                </span>
                <span className="text-xs text-stone-400">
                  · {formatShortDate(scheduledDate)}
                </span>
              </>
            ) : (
              <span className="text-xs text-stone-500">
                {workflow.sentAt
                  ? `Sent ${formatShortDate(new Date(workflow.sentAt))}`
                  : config.label}
              </span>
            )}
          </div>
        </div>

        {/* Actions - Large touch targets */}
        <div className="flex items-center gap-1">
          {onPreview && (
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onPreview}
              className="w-10 h-10 flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
            </motion.div>
          )}
          {isPending && onCancel && (
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onCancel}
              className={`w-10 h-10 flex items-center justify-center text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer ${isCancelling ? 'opacity-50' : ''}`}
            >
              <Trash2 className="w-4 h-4" />
            </motion.div>
          )}
          <div className="w-10 h-10 flex items-center justify-center">
            <ChevronDown
              className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>
      </motion.button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-stone-100">
              {/* Schedule Info */}
              <div className="flex items-center justify-center gap-2 text-xs text-stone-500 py-3">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {isPending ? 'Scheduled for ' : 'Was scheduled for '}
                  {formatDate(scheduledDate)} at {formatTime(scheduledDate)}
                </span>
              </div>

              {/* Status Reason (if skipped/failed) */}
              {workflow.statusReason && (
                <div className="text-xs text-stone-500 bg-stone-50 rounded-lg p-3 mb-3 text-center">
                  {workflow.statusReason}
                </div>
              )}

              {/* Email Preview */}
              <div className="bg-stone-50 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-stone-100">
                  <p className="text-[10px] font-medium text-stone-400 uppercase tracking-[0.15em]">
                    Email Preview
                  </p>
                </div>
                <div
                  className="p-4 text-xs text-stone-600 prose prose-sm max-w-none bg-white"
                  style={{ maxHeight: '200px', overflow: 'auto' }}
                  dangerouslySetInnerHTML={{ __html: workflow.emailBodyHtml }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default WorkflowList;
