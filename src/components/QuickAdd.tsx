import { useState } from 'react';
import { useStore } from '../store';
import { extrasForDate, round, todayKey } from '../data/nutrition';

/** Log ad-hoc foods eaten outside the plan (candy, coffee, …), timestamped now. */
export default function QuickAdd() {
  const { doc, addExtra, removeExtra } = useStore();
  const [food, setFood] = useState('');
  const [kcal, setKcal] = useState('');
  const [showMacros, setShowMacros] = useState(false);
  const [prot, setProt] = useState('');
  const [carb, setCarb] = useState('');
  const [fat, setFat] = useState('');

  const date = todayKey();
  const extras = extrasForDate(doc, date);

  const num = (s: string) => {
    const n = parseFloat(s.replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };

  function submit() {
    const name = food.trim();
    if (!name) return;
    addExtra({
      food: name,
      calories: num(kcal),
      protein_g: num(prot),
      carbs_g: num(carb),
      fat_g: num(fat),
    });
    setFood('');
    setKcal('');
    setProt('');
    setCarb('');
    setFat('');
    setShowMacros(false);
  }

  return (
    <div className="card">
      <h2>➕ Registro avulso</h2>
      <p className="sub">
        Comeu algo fora do plano? Registre aqui — entra com a hora de agora e soma
        no total do dia.
      </p>

      <label className="field" style={{ marginBottom: 10 }}>
        <input
          type="text"
          value={food}
          placeholder="Ex.: Café com leite, bala, doce…"
          onChange={(e) => setFood(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </label>

      <div className="btn-row">
        <input
          type="number"
          inputMode="numeric"
          value={kcal}
          placeholder="kcal"
          onChange={(e) => setKcal(e.target.value)}
          style={{ flex: 1, minWidth: 90 }}
        />
        <button className="primary" onClick={submit} disabled={!food.trim()} style={{ flex: 2 }}>
          Registrar agora
        </button>
      </div>

      <button className="ghost sm" style={{ marginTop: 8 }} onClick={() => setShowMacros((v) => !v)}>
        {showMacros ? 'Ocultar macros' : '+ macros (opcional)'}
      </button>
      {showMacros && (
        <div className="btn-row" style={{ marginTop: 8 }}>
          <input type="number" value={prot} placeholder="prot g" onChange={(e) => setProt(e.target.value)} style={{ flex: 1, minWidth: 80 }} />
          <input type="number" value={carb} placeholder="carb g" onChange={(e) => setCarb(e.target.value)} style={{ flex: 1, minWidth: 80 }} />
          <input type="number" value={fat} placeholder="gord g" onChange={(e) => setFat(e.target.value)} style={{ flex: 1, minWidth: 80 }} />
        </div>
      )}

      {extras.length > 0 && (
        <ul className="food-list" style={{ marginTop: 12 }}>
          {extras.map((e) => (
            <li key={e.id}>
              <span className="food-qty">
                {new Date(e.loggedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="food-name">{e.food}</span>
              <span className="food-qty">{e.calories != null ? `${round(e.calories)} kcal` : '—'}</span>
              <button className="ghost sm" onClick={() => removeExtra(e.id)} aria-label="Remover">✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
