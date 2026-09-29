'use client';

import { CheckCircle, ChevronRight, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button/button';
import { Card } from '@/components/ui/card/card';

import { useSaveLectioSession } from '../api/save-lectio-session';

interface LectioDivinaProps {
  passageId: number;
  initial?: {
    lectio?: string;
    meditatio?: string;
    oratio?: string;
    contemplatio?: string;
  };
}

type StepKey = 'lectio' | 'meditatio' | 'oratio' | 'contemplatio';

type FormValues = Record<StepKey, string>;

const STEPS: {
  key: StepKey;
  label: string;
  hint: string;
  durationMinutes: number;
}[] = [
  {
    key: 'lectio',
    label: 'Lectio',
    hint: 'Lisez le texte lentement, plusieurs fois, en laissant les mots entrer dans votre cœur.',
    durationMinutes: 5,
  },
  {
    key: 'meditatio',
    label: 'Meditatio',
    hint: 'Méditez sur ce qui vous touche. Quel mot ou phrase résonne en vous ?',
    durationMinutes: 10,
  },
  {
    key: 'oratio',
    label: 'Oratio',
    hint: 'Priez à partir du texte. Parlez à Dieu de ce que vous avez reçu.',
    durationMinutes: 10,
  },
  {
    key: 'contemplatio',
    label: 'Contemplatio',
    hint: 'Restez en silence devant Dieu. Laissez-Le agir en vous.',
    durationMinutes: 5,
  },
];

function useStepTimer(durationMinutes: number, active: boolean) {
  const totalSeconds = durationMinutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSecondsLeft(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (!active) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active]);

  const reset = () => setSecondsLeft(totalSeconds);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progress = 1 - secondsLeft / totalSeconds;

  return { formatted, progress, secondsLeft, reset };
}

export function LectioDivina({ passageId, initial }: LectioDivinaProps) {
  const { mutate, isPending, isSuccess } = useSaveLectioSession();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const currentStep = STEPS[currentStepIndex];
  const { formatted, progress, secondsLeft, reset } = useStepTimer(
    currentStep.durationMinutes,
    timerActive,
  );

  const {
    register,
    handleSubmit,
    reset: resetForm,
  } = useForm<FormValues>({
    defaultValues: {
      lectio: initial?.lectio ?? '',
      meditatio: initial?.meditatio ?? '',
      oratio: initial?.oratio ?? '',
      contemplatio: initial?.contemplatio ?? '',
    },
  });

  useEffect(() => {
    if (initial) resetForm(initial as FormValues);
    setCurrentStepIndex(0);
    setTimerActive(false);
    setCompletedSteps(new Set());
  }, [passageId, initial, resetForm]);

  const handleNextStep = () => {
    setCompletedSteps((prev) => new Set(prev).add(currentStepIndex));
    setTimerActive(false);
    reset();
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex((i) => i + 1);
    }
  };

  const isLastStep = currentStepIndex === STEPS.length - 1;
  const allStepsCompleted = completedSteps.size === STEPS.length;

  const onSubmit = (data: FormValues) => {
    // passage_id nul = session libre (pas de passage précis).
    mutate({ passage_id: passageId > 0 ? passageId : null, ...data });
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <CheckCircle className="size-12 text-success" />
        <p className="text-base font-medium text-foreground">
          Session sauvegardée
        </p>
        <p className="text-sm text-muted-foreground">
          Que cette Parole porte du fruit en vous.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setCurrentStepIndex(0);
            setCompletedSteps(new Set());
            setTimerActive(false);
            resetForm();
          }}
        >
          Recommencer
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Steps progress indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((step, index) => (
          <div key={step.key} className="flex flex-1 items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setTimerActive(false);
                reset();
                setCurrentStepIndex(index);
              }}
              className="flex flex-1 flex-col items-center gap-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div
                className={`h-1.5 w-full rounded-full transition-colors motion-reduce:transition-none ${
                  completedSteps.has(index)
                    ? 'bg-success'
                    : index === currentStepIndex
                      ? 'bg-primary'
                      : 'bg-muted'
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors motion-reduce:transition-none ${
                  index === currentStepIndex
                    ? 'text-primary'
                    : completedSteps.has(index)
                      ? 'text-success'
                      : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </button>
          </div>
        ))}
      </div>

      {/* Current step */}
      <Card variant="elevated" className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {currentStep.label}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {currentStep.hint}
            </p>
          </div>

          {/* Timer */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="relative flex size-14 items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56">
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-muted/30"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${2 * Math.PI * 24}`}
                  strokeDashoffset={`${2 * Math.PI * 24 * (1 - progress)}`}
                  className={`transition-all duration-1000 motion-reduce:transition-none ${secondsLeft === 0 ? 'text-success' : 'text-primary'}`}
                />
              </svg>
              <span className="text-xs font-mono font-semibold text-foreground">
                {formatted}
              </span>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setTimerActive((v) => !v)}
                className="rounded text-[10px] text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {timerActive ? 'Pause' : 'Démarrer'}
              </button>
              <span className="text-[10px] text-muted-foreground">·</span>
              <button
                type="button"
                onClick={() => {
                  reset();
                  setTimerActive(false);
                }}
                className="rounded text-[10px] text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="Réinitialiser le timer"
              >
                <RotateCcw className="size-3" />
              </button>
            </div>
          </div>
        </div>

        <textarea
          {...register(currentStep.key)}
          rows={5}
          placeholder={`Vos notes pour l'étape ${currentStep.label}…`}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />

        <div className="flex justify-between items-center">
          {currentStepIndex > 0 ? (
            <button
              type="button"
              onClick={() => {
                setTimerActive(false);
                reset();
                setCurrentStepIndex((i) => i - 1);
              }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Précédent
            </button>
          ) : (
            <div />
          )}

          {!isLastStep ? (
            <Button
              type="button"
              size="sm"
              onClick={handleNextStep}
              className="gap-1"
            >
              Étape suivante
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleNextStep}
              disabled={completedSteps.has(currentStepIndex)}
            >
              Terminer l&apos;étape
            </Button>
          )}
        </div>
      </Card>

      {/* Hidden inputs for all steps so react-hook-form has full data */}
      {STEPS.filter((_, i) => i !== currentStepIndex).map((step) => (
        <input key={step.key} type="hidden" {...register(step.key)} />
      ))}

      {allStepsCompleted && (
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Sauvegarde…' : 'Sauvegarder ma session Lectio Divina'}
        </Button>
      )}
    </form>
  );
}
