import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  calcBreakeven,
  calcOfferStack,
  calcPricing,
  calcProfit,
  calcRevenueGoal,
  calcRunway,
  getCalculator,
  money,
  type CalcId,
} from "../../data/calculators";
import { CalcField, CalcShell, ResultStat } from "../../components/calc/CalcShell";
import { useAuth } from "../../lib/auth";
import { isMember } from "../../lib/access";
import { demoStore } from "../../lib/demo";

function num(v: string | number, fallback = 0) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function CalculatorPage() {
  const { calcId } = useParams();
  const { user } = useAuth();
  if (!user) return <Navigate to="/sign-in" replace />;

  const meta = getCalculator(calcId || "");
  if (!meta) return <Navigate to="/portal/calculators" replace />;

  if (meta.membersOnly && !isMember(user.plan)) {
    return <Navigate to="/pricing" replace />;
  }

  return <CalculatorBody id={meta.id} title={meta.title} blurb={meta.blurb} />;
}

function useCalcInputs(id: CalcId, defaults: Record<string, number>) {
  const saved = demoStore.getCalcState()[id] || {};
  const initial: Record<string, string> = {};
  for (const [key, value] of Object.entries(defaults)) {
    initial[key] = String(saved[key] ?? value);
  }
  const [values, setValues] = useState(initial);

  useEffect(() => {
    const payload: Record<string, number> = {};
    for (const [key, value] of Object.entries(values)) {
      payload[key] = num(value);
    }
    demoStore.saveCalcState(id, payload);
  }, [id, values]);

  function set(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  return { values, set };
}

function CalculatorBody({
  id,
  title,
  blurb,
}: {
  id: CalcId;
  title: string;
  blurb: string;
}) {
  if (id === "pricing") return <PricingCalc title={title} blurb={blurb} />;
  if (id === "breakeven") return <BreakevenCalc title={title} blurb={blurb} />;
  if (id === "revenue-goal") return <RevenueCalc title={title} blurb={blurb} />;
  if (id === "runway") return <RunwayCalc title={title} blurb={blurb} />;
  if (id === "profit") return <ProfitCalc title={title} blurb={blurb} />;
  return <OfferStackCalc title={title} blurb={blurb} />;
}

function PricingCalc({ title, blurb }: { title: string; blurb: string }) {
  const { values, set } = useCalcInputs("pricing", {
    cost: 40,
    hours: 4,
    hourlyWorth: 75,
    marginPct: 55,
  });
  const result = useMemo(
    () =>
      calcPricing({
        cost: num(values.cost),
        hours: num(values.hours),
        hourlyWorth: num(values.hourlyWorth),
        marginPct: num(values.marginPct),
      }),
    [values],
  );

  return (
    <CalcShell title={title} blurb={blurb} results={
      <>
        <ResultStat label="Recommended price" value={money(result.price)} note="Say this number out loud" />
        <ResultStat label="Profit per sale" value={money(result.profit)} />
        <ResultStat label="Base cost" value={money(result.base)} note="Materials + labor" />
        <ResultStat label="Effective hourly" value={money(result.effectiveHourly)} />
        <Link className="btn btn--ghost-ink" to="/portal/tools/offer-builder">
          Drop this into Offer builder →
        </Link>
      </>
    }>
      <CalcField label="Direct cost / materials ($)" hint="Supplies, software, contractors per delivery">
        <input type="number" min={0} value={values.cost} onChange={(e) => set("cost", e.target.value)} />
      </CalcField>
      <CalcField label="Hours to deliver">
        <input type="number" min={0} step={0.5} value={values.hours} onChange={(e) => set("hours", e.target.value)} />
      </CalcField>
      <CalcField label="Your hourly worth ($)" hint="What your time should earn">
        <input type="number" min={0} value={values.hourlyWorth} onChange={(e) => set("hourlyWorth", e.target.value)} />
      </CalcField>
      <CalcField label="Target margin (%)">
        <input type="number" min={0} max={95} value={values.marginPct} onChange={(e) => set("marginPct", e.target.value)} />
      </CalcField>
    </CalcShell>
  );
}

function BreakevenCalc({ title, blurb }: { title: string; blurb: string }) {
  const { values, set } = useCalcInputs("breakeven", {
    fixedCosts: 2500,
    price: 1500,
    variableCost: 200,
  });
  const result = useMemo(
    () =>
      calcBreakeven({
        fixedCosts: num(values.fixedCosts),
        price: num(values.price),
        variableCost: num(values.variableCost),
      }),
    [values],
  );

  return (
    <CalcShell title={title} blurb={blurb} results={
      <>
        <ResultStat
          label="Sales to break even"
          value={Number.isFinite(result.units) ? String(result.units) : "—"}
          note={Number.isFinite(result.units) ? "units / clients this month" : "Price must exceed variable cost"}
        />
        <ResultStat label="Contribution / sale" value={money(result.contribution)} />
        <ResultStat label="Revenue at break-even" value={money(result.revenueAtBreakeven)} />
      </>
    }>
      <CalcField label="Fixed monthly costs ($)">
        <input type="number" min={0} value={values.fixedCosts} onChange={(e) => set("fixedCosts", e.target.value)} />
      </CalcField>
      <CalcField label="Price per sale ($)">
        <input type="number" min={0} value={values.price} onChange={(e) => set("price", e.target.value)} />
      </CalcField>
      <CalcField label="Variable cost per sale ($)">
        <input type="number" min={0} value={values.variableCost} onChange={(e) => set("variableCost", e.target.value)} />
      </CalcField>
    </CalcShell>
  );
}

function RevenueCalc({ title, blurb }: { title: string; blurb: string }) {
  const { values, set } = useCalcInputs("revenue-goal", {
    monthlyGoal: 8000,
    price: 2000,
    closeRatePct: 20,
  });
  const result = useMemo(
    () =>
      calcRevenueGoal({
        monthlyGoal: num(values.monthlyGoal),
        price: num(values.price),
        closeRatePct: num(values.closeRatePct),
      }),
    [values],
  );

  return (
    <CalcShell title={title} blurb={blurb} results={
      <>
        <ResultStat label="Sales needed" value={String(result.salesNeeded)} note="this month" />
        <ResultStat label="Conversations needed" value={String(result.conversations)} />
        <ResultStat label="Weekly conversations" value={String(result.weeklyConversations)} note="Your outreach target" />
      </>
    }>
      <CalcField label="Monthly revenue goal ($)">
        <input type="number" min={0} value={values.monthlyGoal} onChange={(e) => set("monthlyGoal", e.target.value)} />
      </CalcField>
      <CalcField label="Average price ($)">
        <input type="number" min={0} value={values.price} onChange={(e) => set("price", e.target.value)} />
      </CalcField>
      <CalcField label="Close rate (%)" hint="e.g. 20 means 1 in 5 chats become clients">
        <input type="number" min={1} max={100} value={values.closeRatePct} onChange={(e) => set("closeRatePct", e.target.value)} />
      </CalcField>
    </CalcShell>
  );
}

function RunwayCalc({ title, blurb }: { title: string; blurb: string }) {
  const { values, set } = useCalcInputs("runway", {
    cash: 12000,
    monthlyBurn: 3000,
  });
  const result = useMemo(
    () =>
      calcRunway({
        cash: num(values.cash),
        monthlyBurn: num(values.monthlyBurn),
      }),
    [values],
  );

  return (
    <CalcShell title={title} blurb={blurb} results={
      <>
        <ResultStat
          label="Runway"
          value={Number.isFinite(result.months) ? `${result.months} mo` : "∞"}
        />
        <ResultStat label="Status" value={result.status} />
      </>
    }>
      <CalcField label="Cash on hand ($)">
        <input type="number" min={0} value={values.cash} onChange={(e) => set("cash", e.target.value)} />
      </CalcField>
      <CalcField label="Monthly burn ($)" hint="Average expenses leaving the account">
        <input type="number" min={0} value={values.monthlyBurn} onChange={(e) => set("monthlyBurn", e.target.value)} />
      </CalcField>
    </CalcShell>
  );
}

function ProfitCalc({ title, blurb }: { title: string; blurb: string }) {
  const { values, set } = useCalcInputs("profit", {
    revenue: 10000,
    cogs: 1500,
    expenses: 3500,
  });
  const result = useMemo(
    () =>
      calcProfit({
        revenue: num(values.revenue),
        cogs: num(values.cogs),
        expenses: num(values.expenses),
      }),
    [values],
  );

  return (
    <CalcShell title={title} blurb={blurb} results={
      <>
        <ResultStat label="Profit" value={money(result.profit)} />
        <ResultStat label="Margin" value={`${result.marginPct}%`} />
      </>
    }>
      <CalcField label="Revenue ($)">
        <input type="number" min={0} value={values.revenue} onChange={(e) => set("revenue", e.target.value)} />
      </CalcField>
      <CalcField label="COGS / delivery costs ($)">
        <input type="number" min={0} value={values.cogs} onChange={(e) => set("cogs", e.target.value)} />
      </CalcField>
      <CalcField label="Operating expenses ($)">
        <input type="number" min={0} value={values.expenses} onChange={(e) => set("expenses", e.target.value)} />
      </CalcField>
    </CalcShell>
  );
}

function OfferStackCalc({ title, blurb }: { title: string; blurb: string }) {
  const { values, set } = useCalcInputs("offer-stack", {
    entryPrice: 47,
    entryQty: 20,
    corePrice: 1500,
    coreQty: 4,
    premiumPrice: 4000,
    premiumQty: 1,
  });
  const result = useMemo(
    () =>
      calcOfferStack({
        entryPrice: num(values.entryPrice),
        entryQty: num(values.entryQty),
        corePrice: num(values.corePrice),
        coreQty: num(values.coreQty),
        premiumPrice: num(values.premiumPrice),
        premiumQty: num(values.premiumQty),
      }),
    [values],
  );

  return (
    <CalcShell title={title} blurb={blurb} results={
      <>
        <ResultStat label="Projected monthly revenue" value={money(result.total)} />
        <ResultStat label="Entry tier" value={money(result.entry)} />
        <ResultStat label="Core tier" value={money(result.core)} />
        <ResultStat label="Premium tier" value={money(result.premium)} />
      </>
    }>
      <CalcField label="Entry price ($)">
        <input type="number" min={0} value={values.entryPrice} onChange={(e) => set("entryPrice", e.target.value)} />
      </CalcField>
      <CalcField label="Entry sales / month">
        <input type="number" min={0} value={values.entryQty} onChange={(e) => set("entryQty", e.target.value)} />
      </CalcField>
      <CalcField label="Core price ($)">
        <input type="number" min={0} value={values.corePrice} onChange={(e) => set("corePrice", e.target.value)} />
      </CalcField>
      <CalcField label="Core sales / month">
        <input type="number" min={0} value={values.coreQty} onChange={(e) => set("coreQty", e.target.value)} />
      </CalcField>
      <CalcField label="Premium price ($)">
        <input type="number" min={0} value={values.premiumPrice} onChange={(e) => set("premiumPrice", e.target.value)} />
      </CalcField>
      <CalcField label="Premium sales / month">
        <input type="number" min={0} value={values.premiumQty} onChange={(e) => set("premiumQty", e.target.value)} />
      </CalcField>
    </CalcShell>
  );
}
