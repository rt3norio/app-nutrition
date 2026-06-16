import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { goalsAsTotals, history, round } from '../data/nutrition';

const dd = (date: string) => date.slice(8, 10);

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}

interface Point {
  label: string;
  value: number;
}

function BarChart({
  data,
  goal = 0,
  unit,
  color = 'var(--brand)',
}: {
  data: Point[];
  goal?: number;
  unit: string;
  color?: string;
}) {
  const max = Math.max(goal, ...data.map((d) => d.value), 1);
  return (
    <div className="chart">
      <div className="bars">
        {goal > 0 && goal <= max && (
          <div className="goal-line" style={{ bottom: `${(goal / max) * 100}%` }} />
        )}
        {data.map((d, i) => (
          <div className="col" key={i} title={`${d.label}: ${round(d.value)} ${unit}`}>
            <div className="bar-v" style={{ height: `${(d.value / max) * 100}%`, background: color }} />
            <span className="xl">{dd(d.label)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineChart({ data, unit }: { data: Point[]; unit: string }) {
  const vals = data.map((d) => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const n = data.length;
  const pts = data
    .map((d, i) => {
      const x = n === 1 ? 50 : (i / (n - 1)) * 100;
      const y = 100 - ((d.value - min) / span) * 100;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <div className="chart">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="line-svg">
        <polyline
          points={pts}
          fill="none"
          stroke="var(--brand)"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="line-meta sub">
        {min} – {max} {unit} · {dd(data[0].label)} → {dd(data[n - 1].label)}
      </div>
    </div>
  );
}

export default function History() {
  const { doc } = useStore();
  const days = useMemo(() => history(doc), [doc]);
  const goals = goalsAsTotals(doc.plan.goals);
  const waterGoal = doc.plan.goals?.water_ml ?? 0;

  if (days.length === 0) {
    return (
      <div className="empty">
        <div className="big">📊</div>
        <p>Sem histórico ainda.</p>
        <p className="muted">
          Marque refeições, água e registros na aba <Link to="/" className="inline">Hoje</Link> para
          começar a acumular dados.
        </p>
      </div>
    );
  }

  const recent = days.slice(-14);
  const trackedDays = days.length;
  const avgKcal = round(days.reduce((s, d) => s + d.totals.calories, 0) / trackedDays);
  const avgWater = round(days.reduce((s, d) => s + d.water_ml, 0) / trackedDays);

  const withPlan = days.filter((d) => d.planMeals > 0);
  const adherence = withPlan.length
    ? Math.round((withPlan.reduce((s, d) => s + d.mealsAttended / d.planMeals, 0) / withPlan.length) * 100)
    : null;

  const weights = days.filter((d) => d.weight_kg != null) as (typeof days[number] & { weight_kg: number })[];
  const weightNow = weights.length ? weights[weights.length - 1].weight_kg : null;
  const weightDelta =
    weights.length > 1 ? round((weights[weights.length - 1].weight_kg - weights[0].weight_kg) * 10) / 10 : null;

  return (
    <>
      <div className="card">
        <h2>Resumo</h2>
        <div className="totals">
          <Metric label="Dias registrados" value={`${trackedDays}`} />
          <Metric label="Média kcal/dia" value={`${avgKcal}`} />
          {adherence != null && <Metric label="Adesão média" value={`${adherence}%`} />}
          <Metric label="Média água/dia" value={`${avgWater} ml`} />
          {weightNow != null && <Metric label="Peso atual" value={`${weightNow} kg`} />}
          {weightDelta != null && (
            <Metric label="Variação peso" value={`${weightDelta > 0 ? '+' : ''}${weightDelta} kg`} />
          )}
        </div>
        <p className="sub" style={{ marginTop: 12, marginBottom: 0 }}>
          Gráficos mostram os últimos {recent.length} dias registrados.
        </p>
      </div>

      <div className="card">
        <h2>Calorias por dia</h2>
        <BarChart data={recent.map((d) => ({ label: d.date, value: d.totals.calories }))} goal={goals.calories} unit="kcal" />
      </div>

      {(waterGoal > 0 || recent.some((d) => d.water_ml > 0)) && (
        <div className="card">
          <h2>Água por dia</h2>
          <BarChart
            data={recent.map((d) => ({ label: d.date, value: d.water_ml }))}
            goal={waterGoal}
            unit="ml"
            color="#3a8ee6"
          />
        </div>
      )}

      {withPlan.length > 0 && (
        <div className="card">
          <h2>Adesão às refeições</h2>
          <BarChart
            data={recent.filter((d) => d.planMeals > 0).map((d) => ({
              label: d.date,
              value: Math.round((d.mealsAttended / d.planMeals) * 100),
            }))}
            goal={100}
            unit="%"
          />
        </div>
      )}

      {weights.length > 1 && (
        <div className="card">
          <h2>Peso</h2>
          <LineChart data={weights.map((d) => ({ label: d.date, value: d.weight_kg }))} unit="kg" />
        </div>
      )}
    </>
  );
}
