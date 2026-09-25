export type CalcId =
  | "pricing"
  | "breakeven"
  | "revenue-goal"
  | "runway"
  | "profit"
  | "offer-stack";

export type CalculatorMeta = {
  id: CalcId;
  title: string;
  blurb: string;
  membersOnly: boolean;
  badge: string;
};

export const CALCULATORS: CalculatorMeta[] = [
  {
    id: "pricing",
    title: "Pricing power",
    blurb: "Cost, hours, and margin → a price you can say out loud.",
    membersOnly: true,
    badge: "Members",
  },
  {
    id: "breakeven",
    title: "Break-even",
    blurb: "Fixed costs and margin → how many sales cover the bills.",
    membersOnly: true,
    badge: "Members",
  },
  {
    id: "revenue-goal",
    title: "Revenue goal",
    blurb: "Income target → clients and conversations needed.",
    membersOnly: true,
    badge: "Members",
  },
  {
    id: "runway",
    title: "Runway",
    blurb: "Cash and burn → months of calm (or urgency).",
    membersOnly: true,
    badge: "Members",
  },
  {
    id: "profit",
    title: "Profit snapshot",
    blurb: "Revenue − costs → profit and margin %.",
    membersOnly: true,
    badge: "Members",
  },
  {
    id: "offer-stack",
    title: "Offer stack",
    blurb: "Entry / core / premium mix → projected monthly revenue.",
    membersOnly: true,
    badge: "Members",
  },
];

export function getCalculator(id: string) {
  return CALCULATORS.find((c) => c.id === id);
}

export function calcPricing(input: {
  cost: number;
  hours: number;
  hourlyWorth: number;
  marginPct: number;
}) {
  const labor = input.hours * input.hourlyWorth;
  const base = input.cost + labor;
  const price = input.marginPct >= 100 ? base * 2 : base / (1 - input.marginPct / 100);
  const profit = price - base;
  return {
    base: round2(base),
    price: round2(price),
    profit: round2(profit),
    effectiveHourly: input.hours > 0 ? round2(profit / input.hours + input.hourlyWorth) : 0,
  };
}

export function calcBreakeven(input: {
  fixedCosts: number;
  price: number;
  variableCost: number;
}) {
  const contribution = input.price - input.variableCost;
  const units =
    contribution <= 0 ? Infinity : Math.ceil(input.fixedCosts / contribution);
  return {
    contribution: round2(contribution),
    units,
    revenueAtBreakeven: Number.isFinite(units) ? round2(units * input.price) : 0,
  };
}

export function calcRevenueGoal(input: {
  monthlyGoal: number;
  price: number;
  closeRatePct: number;
}) {
  const salesNeeded =
    input.price <= 0 ? 0 : Math.ceil(input.monthlyGoal / input.price);
  const rate = Math.max(input.closeRatePct, 1) / 100;
  const conversations = Math.ceil(salesNeeded / rate);
  const weeklyConversations = Math.ceil(conversations / 4);
  return { salesNeeded, conversations, weeklyConversations };
}

export function calcRunway(input: { cash: number; monthlyBurn: number }) {
  const months =
    input.monthlyBurn <= 0 ? Infinity : input.cash / input.monthlyBurn;
  return {
    months: Number.isFinite(months) ? round2(months) : Infinity,
    status:
      !Number.isFinite(months) || months >= 6
        ? "Healthy buffer"
        : months >= 3
          ? "Watch closely"
          : "Urgent focus",
  };
}

export function calcProfit(input: {
  revenue: number;
  cogs: number;
  expenses: number;
}) {
  const profit = input.revenue - input.cogs - input.expenses;
  const marginPct = input.revenue > 0 ? (profit / input.revenue) * 100 : 0;
  return { profit: round2(profit), marginPct: round2(marginPct) };
}

export function calcOfferStack(input: {
  entryPrice: number;
  entryQty: number;
  corePrice: number;
  coreQty: number;
  premiumPrice: number;
  premiumQty: number;
}) {
  const entry = input.entryPrice * input.entryQty;
  const core = input.corePrice * input.coreQty;
  const premium = input.premiumPrice * input.premiumQty;
  const total = entry + core + premium;
  return {
    entry: round2(entry),
    core: round2(core),
    premium: round2(premium),
    total: round2(total),
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function money(n: number) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}
