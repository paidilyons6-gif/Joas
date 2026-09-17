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
      <span className="logo__business">Business</span>
      <span className="logo__by">
        by Becca <span aria-hidden="true">♡</span>
      </span>
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
    <Link to={to} aria-label="Business by Becca home">
      <Logo variant={variant} />
    </Link>
  );
}
