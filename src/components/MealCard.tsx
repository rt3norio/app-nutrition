import { useState } from 'react';
import type { Meal, MealLog } from '../data/types';
import { itemsTotals, mealTotals, round } from '../data/nutrition';

const UNIT_LABEL: Record<string, string> = {
  g: 'g',
  ml: 'ml',
  kcal: 'kcal',
  unidade: 'un',
  fatia: 'fatia(s)',
  colher_sopa: 'col. sopa',
  colher_cha: 'col. chá',
  xicara: 'xícara(s)',
  copo: 'copo(s)',
  concha: 'concha(s)',
  porcao: 'porção',
};

interface Props {
  meal: Meal;
  status?: MealLog['status'] | null;
  onSet?: (s: MealLog['status']) => void;
  onClear?: () => void;
}

function FoodLines({ items }: { items: Meal['items'] }) {
  return (
    <ul className="food-list">
      {items.map((it, i) => (
        <li key={i}>
          <span className="food-qty">
            {it.quantity} {UNIT_LABEL[it.unit] ?? it.unit}
          </span>
          <span className="food-name">
            {it.food}
            {it.alternatives && <span className="muted"> · ou {it.alternatives}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function MealCard({ meal, status, onSet, onClear }: Props) {
  const t = mealTotals(meal);
  const alts = meal.alternatives ?? [];
  const [showAlts, setShowAlts] = useState(false);
  const cls = ['card', 'meal', status ?? ''].join(' ').trim();
  return (
    <article className={cls}>
      <div className="meal-head">
        <span className="meal-time">{meal.time}</span>
        <span className="meal-name">{meal.name}</span>
        {t.calories > 0 && <span className="meal-kcal">{round(t.calories)} kcal</span>}
      </div>

      <FoodLines items={meal.items} />

      {meal.notes && <p className="note">{meal.notes}</p>}

      {alts.length > 0 && (
        <div className="alts">
          <button className="ghost sm" onClick={() => setShowAlts((v) => !v)}>
            {showAlts ? 'Ocultar alternativas' : `🔁 Alternativas (${alts.length})`}
          </button>
          {showAlts &&
            alts.map((alt, i) => {
              const at = itemsTotals(alt.items);
              return (
                <div className="alt" key={i}>
                  <div className="meal-head">
                    <span className="meal-name">{alt.name ?? `Opção ${i + 2}`}</span>
                    {at.calories > 0 && <span className="meal-kcal">{round(at.calories)} kcal</span>}
                  </div>
                  <FoodLines items={alt.items} />
                  {alt.notes && <p className="note">{alt.notes}</p>}
                </div>
              );
            })}
        </div>
      )}

      {onSet && (
        <div className="status-row">
          <button
            className={'sm ' + (status === 'eaten' ? 'on-eaten' : '')}
            onClick={() => (status === 'eaten' ? onClear?.() : onSet('eaten'))}
          >
            ✓ Comi
          </button>
          <button
            className={'sm ' + (status === 'partial' ? 'on-partial' : '')}
            onClick={() => (status === 'partial' ? onClear?.() : onSet('partial'))}
          >
            ½ Parcial
          </button>
          <button
            className={'sm ' + (status === 'skipped' ? 'on-skipped' : '')}
            onClick={() => (status === 'skipped' ? onClear?.() : onSet('skipped'))}
          >
            ✕ Pulei
          </button>
        </div>
      )}
    </article>
  );
}
