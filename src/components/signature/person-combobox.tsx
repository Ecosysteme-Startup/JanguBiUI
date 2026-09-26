'use client';

import * as React from 'react';

import { controlClasses } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { useDebounce } from '@/hooks/use-debounce';
import { PERSON_SEARCH_MIN, type PersonOption, usePersonSearch } from '@/hooks/use-person-search';
import { cn } from '@/utils/cn';
import { plural } from '@/utils/plural';

const DEGRE: Record<string, string> = {
  diacre_transitoire: 'Diacre',
  diacre_permanent: 'Diacre permanent',
  pretre: 'Prêtre',
  eveque: 'Évêque',
};
const ETAT: Record<string, string> = { laic: 'Laïc', clerc: 'Clerc', consacre: 'Consacré' };
const STATUT: Record<PersonOption['statut_verification'], string> = {
  verifie: 'statut vérifié',
  declare: 'statut déclaré, non vérifié',
  complement: 'complément demandé',
  rejete: 'déclaration refusée',
};

export const personName = (p: PersonOption) => p.full_name || p.email_masked;

/** « Prêtre · statut vérifié · Archidiocèse de Dakar · a•••e@gmail.com » */
export const personDetail = (p: PersonOption) => {
  const state = DEGRE[p.degre_ordre] ?? ETAT[p.etat_de_vie] ?? p.etat_de_vie;
  const status = p.etat_de_vie === 'laic' ? null : STATUT[p.statut_verification];
  return [state, status, p.incardination_node?.name, p.email_masked].filter(Boolean).join(' · ');
};

type PersonComboboxProps = {
  value: PersonOption | null;
  onChange: (person: PersonOption | null) => void;
  /** Transmis par `Field`. */
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  placeholder?: string;
};

/**
 * Recherche d'une personne à nommer (combobox ARIA 1.2 à liste) : 2 caractères au moins,
 * flèches pour parcourir, Entrée pour choisir, Échap pour fermer. Le serveur exige
 * `offices.nommer` et ne renvoie qu'un e-mail masqué.
 */
export const PersonCombobox = ({ value, onChange, id, placeholder = 'Nom, prénom ou e-mail', ...aria }: PersonComboboxProps) => {
  const reactId = React.useId();
  const baseId = id ?? `personne-${reactId}`;
  const listId = `${baseId}-liste`;
  const statusId = `${baseId}-etat`;
  const [query, setQuery] = React.useState(value ? personName(value) : '');
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(-1);
  const debounced = useDebounce(query.trim(), 300);
  const search = usePersonSearch(value ? '' : debounced);
  const results = open && !value ? (search.data?.results ?? []) : [];
  const tooShort = query.trim().length < PERSON_SEARCH_MIN;

  const choose = (person: PersonOption) => {
    onChange(person);
    setQuery(personName(person));
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (results.length ? (i + 1) % results.length : -1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (results.length ? (i <= 0 ? results.length - 1 : i - 1) : -1));
    } else if (e.key === 'Enter' && open && active >= 0 && results[active]) {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === 'Escape' && open) {
      e.preventDefault();
      setOpen(false);
      setActive(-1);
    }
  };

  let status = '';
  if (!value && open) {
    if (tooShort) status = `Saisissez au moins ${PERSON_SEARCH_MIN} caractères.`;
    else if (search.isError) status = 'La recherche a échoué. Réessayez.';
    else if (search.isFetching && !search.data) status = 'Recherche…';
    else if (search.data && debounced === query.trim())
      status =
        search.data.count === 0
          ? 'Aucune personne ne correspond.'
          : `${plural(search.data.count, 'personne', 'personnes')}${search.data.count > results.length ? `, ${results.length} affichées : précisez la recherche` : ''}.`;
  }

  const expanded = open && !value && results.length > 0;

  return (
    <div className="relative">
      <div className="relative">
        <Icon name="recherche" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
        <input
          id={baseId}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
          aria-describedby={[aria['aria-describedby'], statusId].filter(Boolean).join(' ')}
          aria-invalid={aria['aria-invalid']}
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(-1);
            if (value) onChange(null);
          }}
          onFocus={() => !value && setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          className={cn(controlClasses(aria['aria-invalid'] === true, Boolean(value)), 'h-12 pl-10')}
        />
      </div>
      <ul
        id={listId}
        role="listbox"
        aria-label="Personnes trouvées"
        hidden={!expanded}
        className="absolute inset-x-0 top-full z-20 m-0 mt-1 max-h-80 list-none overflow-y-auto rounded border border-line-strong bg-surface p-1 shadow-modal"
      >
        {results.map((p, i) => (
          <li
            key={p.id}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === active}
            // mousedown : le choix doit précéder la perte de focus du champ.
            onMouseDown={(e) => {
              e.preventDefault();
              choose(p);
            }}
            onMouseEnter={() => setActive(i)}
            className={cn('cursor-pointer rounded px-3 py-2.5', i === active && 'bg-surface-2')}
          >
            <span className="block font-medium text-ink">{personName(p)}</span>
            <span className="block text-sm text-ink-3">{personDetail(p)}</span>
          </li>
        ))}
      </ul>
      <p id={statusId} role="status" className={cn('m-0 text-sm text-ink-3', status || value ? 'mt-2' : 'sr-only')}>
        {value ? `Personne choisie : ${personName(value)}, ${personDetail(value)}.` : status}
      </p>
    </div>
  );
};
