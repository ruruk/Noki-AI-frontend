"use client";

import { BookOpen, Lightbulb } from "lucide-react";
import { MarkdownText } from "./markdown-text";

interface AssignmentExplanationProps {
  title?: string;
  description?: string;
  footer?: string;
}

export function AssignmentExplanation({
  title = "Assignment Explanation",
  description,
  footer,
}: AssignmentExplanationProps) {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 backdrop-blur-xl border border-gray-700/80 rounded-2xl shadow-2xl overflow-hidden mt-4">
      <div className="p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5 text-noki-primary" />
          <div className="font-poppins font-bold text-gray-100 text-lg pt-[50px]">
            {title}
          </div>
        </div>

        {description && (
          <div className="space-y-3">
            <div className="text-gray-200 font-roboto leading-relaxed">
              <MarkdownText text={description} />
            </div>
          </div>
        )}

        {footer && (
          <div className="pt-4 border-t border-gray-700/50">
            <div className="flex items-start space-x-2">
              <Lightbulb className="h-4 w-4 text-noki-tertiary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-400 font-roboto">{footer}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
