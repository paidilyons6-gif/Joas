import { Navigate } from "react-router-dom";

/** Office membership retired — programs are the paid product. */
export function PricingPage() {
  return <Navigate to="/programs" replace />;
}
