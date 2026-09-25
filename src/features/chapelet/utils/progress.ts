/** Position dans le chapelet guidé : mystère, grain, ou chapelet achevé. Réducteur pur. */
export type Progress = { mystery: number; step: number; done: boolean };

export type ProgressAction =
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'jump'; mystery: number }
  | { type: 'restart' };

export const START: Progress = { mystery: 0, step: 0, done: false };

/** `lengths[i]` : nombre de grains du mystère i. */
export const progressReducer =
  (lengths: number[]) =>
  (state: Progress, action: ProgressAction): Progress => {
    const last = lengths.length - 1;
    switch (action.type) {
      case 'next':
        if (state.done) return state;
        if (state.step < (lengths[state.mystery] ?? 0) - 1) return { ...state, step: state.step + 1 };
        if (state.mystery < last) return { mystery: state.mystery + 1, step: 0, done: false };
        return { ...state, done: true };
      case 'prev':
        if (state.done) return { ...state, done: false };
        if (state.step > 0) return { ...state, step: state.step - 1 };
        if (state.mystery > 0) return { mystery: state.mystery - 1, step: Math.max(0, (lengths[state.mystery - 1] ?? 1) - 1), done: false };
        return state;
      case 'jump':
        return { mystery: Math.min(Math.max(action.mystery, 0), last), step: 0, done: false };
      case 'restart':
        return START;
    }
  };

export const isAtStart = (p: Progress) => p.mystery === 0 && p.step === 0 && !p.done;
