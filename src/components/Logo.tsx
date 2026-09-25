import { Link } from "react-router-dom";

export function Logo({
  variant = "default",
}: {
  variant?: "default" | "light" | "hero";
}) {
  const className =
    variant === "hero"
      ? "logo logo--hero"
      : variant === "light"
        ? "logo logo--light"
        : "logo";

  return (
    <span className={className}>
      <span className="logo__office">The Office</span>
      <span className="logo__business">BusinessByBecca</span>
    </span>
  );
}

export function LogoLink({
  variant = "default",
  to = "/",
}: {
  variant?: "default" | "light" | "hero";
  to?: string;
}) {
  return (
    <Link to={to} aria-label="The Office — BusinessByBecca home">
      <Logo variant={variant} />
    </Link>
  );
}
