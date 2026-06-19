"use client";

import type { MailTemplate, MailTemplateId } from "@/types/mail";

interface TemplateSelectorProps {
  templates: MailTemplate[];
  selectedId: MailTemplateId;
  onSelect: (templateId: MailTemplateId) => void;
}

export default function TemplateSelector({
  templates,
  selectedId,
  onSelect,
}: TemplateSelectorProps) {
  const selectedTemplate =
    templates.find((template) => template.id === selectedId) ?? templates[0];

  return (
    <div className="grid gap-3">
      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">비즈니스 메일 폼</span>
        <select
          value={selectedId}
          onChange={(event) => onSelect(event.target.value as MailTemplateId)}
          className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        >
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-2 sm:grid-cols-2">
        {templates.slice(0, 8).map((template) => {
          const isSelected = template.id === selectedId;

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template.id)}
              className={`rounded-md border px-3 py-3 text-left transition ${
                isSelected
                  ? "border-blue-500 bg-blue-50 text-blue-950 shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"
              }`}
            >
              <span className="block text-sm font-semibold">{template.label}</span>
              <span
                className={`mt-1 line-clamp-2 block text-xs leading-5 ${
                  isSelected ? "text-blue-800" : "text-slate-500"
                }`}
              >
                {template.description}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-blue-950">
            {selectedTemplate.label}
          </span>
          <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-blue-700">
            {selectedTemplate.recommendedTone}
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-blue-900">
          {selectedTemplate.description}
        </p>
        <p className="mt-2 text-xs font-medium leading-5 text-blue-700">
          {selectedTemplate.structure.join(" -> ")}
        </p>
      </div>
    </div>
  );
}
