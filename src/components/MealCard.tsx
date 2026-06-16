import { useState } from 'react';
import type { Meal, MealLog } from '../data/types';
import { itemsTotals, mealConsumed, mealTotals, round } from '../data/nutrition';

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
  log?: MealLog | null;
  onSet?: (s: MealLog['status'], portions?: number[]) => void;
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

export default function MealCard({ meal, log, onSet, onClear }: Props) {
  const status = log?.status ?? null;
  const portions = log?.portions;
  const full = mealTotals(meal);
  const alts = meal.alternatives ?? [];
  const [showAlts, setShowAlts] = useState(false);
  const [editing, setEditing] = useState(false);
  const [qtys, setQtys] = useState<string[]>([]);

  const cls = ['card', 'meal', status ?? ''].join(' ').trim();

  // kcal shown in the header: actual consumed when partial, else the full meal.
  const headerKcal =
    status === 'partial' && log ? round(mealConsumed(meal, log).calories) : round(full.calories);

  function openEditor() {
    setQtys(
      meal.items.map((it, i) => {
        const eaten = portions?.[i] != null ? portions[i] * it.quantity : it.quantity;
        return String(+eaten.toFixed(2));
      }),
    );
    setEditing(true);
  }

  function fractions(): number[] {
    return meal.items.map((it, i) => {
      const eaten = parseFloat((qtys[i] ?? '').replace(',', '.'));
      if (!Number.isFinite(eaten) || eaten < 0) return 0;
      return eaten / it.quantity;
    });
  }

  const previewKcal = round(
    meal.items.reduce((s, it, i) => {
      const eaten = parseFloat((qtys[i] ?? '').replace(',', '.'));
      const f = Number.isFinite(eaten) && eaten >= 0 ? eaten / it.quantity : 0;
      return s + (it.calories ?? 0) * f;
    }, 0),
  );

  function savePartial() {
    onSet?.('partial', fractions());
    setEditing(false);
  }

  return (
    <article className={cls}>
      <div className="meal-head">
        <span className="meal-time">{meal.time}</span>
        <span className="meal-name">{meal.name}</span>
        {full.calories > 0 && (
          <span className="meal-kcal">
            {headerKcal}
            {status === 'partial' && <span className="muted"> / {round(full.calories)}</span>} kcal
          </span>
        )}
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

      {editing && (
        <div className="partial-editor">
          <p className="sub" style={{ margin: '2px 0 10px' }}>
            Ajuste o quanto você comeu de cada item:
          </p>
          {meal.items.map((it, i) => (
            <label className="portion-row" key={i}>
              <span className="portion-name">{it.food}</span>
              <span className="portion-input">
                <input
                  type="number"
                  inputMode="decimal"
                  value={qtys[i] ?? ''}
                  min={0}
                  onChange={(e) => {
                    const next = [...qtys];
                    next[i] = e.target.value;
                    setQtys(next);
                  }}
                />
                <span className="muted">/ {it.quantity} {UNIT_LABEL[it.unit] ?? it.unit}</span>
              </span>
            </label>
          ))}
          <p className="sub" style={{ margin: '6px 0 10px' }}>
            ≈ <strong>{previewKcal} kcal</strong> de {round(full.calories)}
          </p>
          <div className="status-row">
            <button className="sm on-partial" onClick={savePartial}>Salvar parcial</button>
            <button className="sm ghost" onClick={() => setEditing(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {onSet && !editing && (
        <div className="status-row">
          <button
            className={'sm ' + (status === 'eaten' ? 'on-eaten' : '')}
            onClick={() => (status === 'eaten' ? onClear?.() : onSet('eaten'))}
          >
            ✓ Comi
          </button>
          <button
            className={'sm ' + (status === 'partial' ? 'on-partial' : '')}
            onClick={openEditor}
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
