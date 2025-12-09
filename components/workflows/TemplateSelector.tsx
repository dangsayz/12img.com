'use client';

// =============================================================================
// TEMPLATE SELECTOR
// World-class template selection with perfect touch ergonomics
// 48px+ touch targets, elegant animations, centered design
// =============================================================================

import { motion } from 'framer-motion';
import { Check, Clock, Mail, FileEdit } from 'lucide-react';
import {
  WorkflowTemplate,
  WORKFLOW_CATEGORY_CONFIG,
  formatDaysOffset,
} from '@/lib/workflows/types';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface TemplateSelectorProps {
  templates: WorkflowTemplate[];
  selectedId: string | null;
  onSelect: (template: WorkflowTemplate) => void;
}

// -----------------------------------------------------------------------------
// Animation Variants
// -----------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function TemplateSelector({
  templates,
  selectedId,
  onSelect,
}: TemplateSelectorProps) {
  // Group templates by category
  const systemTemplates = templates.filter((t) => t.isSystem);
  const customTemplates = templates.filter((t) => !t.isSystem);

  return (
    <div className="space-y-6">
      {/* System Templates */}
      <div>
        <p className="text-[10px] font-medium text-stone-400 uppercase tracking-[0.2em] text-center mb-4">
          Pre-built Templates
        </p>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {systemTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedId === template.id}
              onSelect={() => onSelect(template)}
            />
          ))}
        </motion.div>
      </div>

      {/* Custom Templates */}
      {customTemplates.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-stone-400 uppercase tracking-[0.2em] text-center mb-4">
            Your Templates
          </p>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            {customTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={selectedId === template.id}
                onSelect={() => onSelect(template)}
              />
            ))}
          </motion.div>
        </div>
      )}

      {/* Empty State */}
      {templates.length === 0 && (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-stone-100 flex items-center justify-center">
            <Mail className="w-5 h-5 text-stone-400" />
          </div>
          <p className="text-sm text-stone-500">No templates available</p>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Template Card Component
// -----------------------------------------------------------------------------

interface TemplateCardProps {
  template: WorkflowTemplate;
  isSelected: boolean;
  onSelect: () => void;
}

function TemplateCard({
  template,
  isSelected,
  onSelect,
}: TemplateCardProps) {
  const categoryConfig = WORKFLOW_CATEGORY_CONFIG[template.category];

  return (
    <motion.button
      variants={itemVariants}
      onClick={onSelect}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`
        relative w-full text-left p-4 rounded-xl border-2 transition-all min-h-[72px]
        ${
          isSelected
            ? 'border-stone-900 bg-stone-50'
            : 'border-stone-100 hover:border-stone-200 hover:bg-stone-50/50'
        }
      `}
    >
      {/* Selection Indicator */}
      <div className={`
        absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
        ${isSelected 
          ? 'bg-stone-900 border-stone-900' 
          : 'border-stone-200 bg-white'
        }
      `}>
        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
      </div>

      {/* Content */}
      <div className="flex items-start gap-3 pr-10">
        {/* Icon */}
        <div
          className={`
            flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors
            ${isSelected ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'}
          `}
        >
          {template.isSystem ? (
            <Mail className="w-4 h-4" />
          ) : (
            <FileEdit className="w-4 h-4" />
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2">
            <h5 className="text-sm font-medium text-stone-900">
              {template.name}
            </h5>
            {template.isSystem && (
              <span className="flex-shrink-0 text-[9px] px-1.5 py-0.5 bg-stone-200 text-stone-500 rounded-full font-medium">
                Built-in
              </span>
            )}
          </div>
          {template.description && (
            <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">
              {template.description}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-2">
            <Clock className="w-3 h-3 text-stone-400" />
            <span className="text-[11px] text-stone-400">
              {formatDaysOffset(template.defaultDaysOffset)}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

export default TemplateSelector;
