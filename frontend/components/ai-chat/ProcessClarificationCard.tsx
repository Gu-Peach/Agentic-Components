'use client';

import { useState } from 'react';
import { ArrowRight, Send, X } from 'lucide-react';
import type { ProcessClarificationQuestion, ProcessCompositionResult } from '@/types/process';

type ProcessClarificationCardProps = {
  clarification: ProcessCompositionResult;
  onCancel: () => void;
  onSubmit: (answer: string) => void;
};

type Answers = Record<string, string>;

export function ProcessClarificationCard({
  clarification,
  onCancel,
  onSubmit,
}: ProcessClarificationCardProps) {
  const [answers, setAnswers] = useState<Answers>({});
  const questions = clarification.questions ?? [];
  const canSubmit = questions.every((question) => answers[question.id]);
  const answerText = buildAnswerText(clarification, questions, answers);

  return (
    <div className='border border-[var(--border-strong)] bg-[#202020] px-3 py-2'>
      <div className='mb-2 flex items-center justify-between gap-2'>
        <div>
          <p className='text-sm text-[var(--text-primary)]'>Process clarification</p>
          <p className='text-[11px] text-[var(--text-muted)]'>需要补充信息后继续编排</p>
        </div>
        <span className='text-[11px] text-[var(--text-accent)]'>clarification_required</span>
      </div>
      <div className='space-y-3'>
        {questions.map((question) => (
          <QuestionBlock
            key={question.id}
            answer={answers[question.id] ?? ''}
            onSelect={(value) => setAnswers((current) => ({ ...current, [question.id]: value }))}
            question={question}
          />
        ))}
      </div>
      <div className='mt-3 flex gap-2'>
        <button
          className='flex h-8 items-center gap-1 bg-[var(--bg-accent)] px-2 text-xs text-white hover:bg-[var(--bg-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50'
          disabled={!canSubmit}
          onClick={() => onSubmit(answerText)}
          type='button'
        >
          <Send size={13} />
          Submit
        </button>
        <button
          className='flex h-8 items-center gap-1 border border-[var(--border-strong)] px-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          onClick={onCancel}
          type='button'
        >
          <X size={13} />
          Cancel
        </button>
      </div>
    </div>
  );
}

function QuestionBlock({
  question,
  answer,
  onSelect,
}: {
  question: ProcessClarificationQuestion;
  answer: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className='space-y-2'>
      <p className='text-xs text-[var(--text-secondary)]'>{question.question}</p>
      <div className='flex flex-wrap gap-2'>
        {(question.options ?? []).map((option) => {
          const active = answer === option.value;
          return (
            <button
              key={`${question.id}-${option.value}`}
              className={`flex h-8 items-center gap-1 border px-2 text-xs transition ${
                active
                  ? 'border-[var(--bg-accent)] bg-[rgba(59,130,246,0.18)] text-[var(--text-primary)]'
                  : 'border-[var(--border-strong)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              onClick={() => onSelect(option.value)}
              type='button'
            >
              <ArrowRight size={12} />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function buildAnswerText(
  clarification: ProcessCompositionResult,
  questions: ProcessClarificationQuestion[],
  answers: Answers,
) {
  const start = answers.start_device || clarification.context?.startDeviceId;
  const direction = answers.flow_direction;
  const parts: string[] = [];

  if (start) {
    parts.push(`请从设备 ${start} 开始编排。`);
  }
  if (direction) {
    parts.push(`物料流转方向为 ${directionLabel(direction)}。`);
  }
  if (!parts.length) {
    return questions.map((question) => `${question.id}: ${answers[question.id] ?? ''}`).join('\n');
  }
  return parts.join('\n');
}

function directionLabel(value: string) {
  if (value === 'left_to_right') return '从左到右';
  if (value === 'right_to_left') return '从右到左';
  if (value === 'front_to_back') return '从前到后';
  if (value === 'back_to_front') return '从后到前';
  return value;
}
