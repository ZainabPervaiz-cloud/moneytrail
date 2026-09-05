/**
 * Shared shell for every logged-in page: constrains content to a
 * phone-width column (this is a mobile-first app, even on desktop),
 * leaves room at the bottom for the fixed NavBar, and renders whichever
 * page the router matched via <Outlet />.
 */

import { Outlet } from "react-router-dom";
import { NavBar } from "./NavBar";

export function AppLayout() {
  return (
    <div className="max-w-md mx-auto min-h-screen pb-20 px-4 pt-6">
      <Outlet />
      <NavBar />
    </div>
  );
}
