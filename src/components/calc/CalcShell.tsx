import { Link } from "react-router-dom";
import type { ReactNode } from "react";

export function CalcShell({
  title,
  blurb,
  children,
  results,
}: {
  title: string;
  blurb: string;
  children: ReactNode;
  results: ReactNode;
}) {
  return (
    <div className="portal-page">
      <Link className="back-link" to="/portal/calculators">
        ← All calculators
      </Link>
      <p className="eyebrow">Calculator</p>
      <h1>{title}</h1>
      <p className="portal-lede">{blurb}</p>
      <div className="calc-layout">
        <div className="calc-inputs">{children}</div>
        <div className="calc-results">{results}</div>
      </div>
    </div>
  );
}

export function CalcField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="calc-field">
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

export function ResultStat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="result-stat">
      <p className="stat__label">{label}</p>
      <p className="stat__value stat__value--sm">{value}</p>
      {note ? <p className="stat__meta">{note}</p> : null}
    </div>
  );
}
