/**
 * Bottom tab bar for the app. Fixed to the bottom of the screen (thumb
 * reach on a phone) rather than a top nav — matches how most installed
 * mobile apps are laid out.
 */

import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const tabs = [
  { to: "/", label: "Dashboard", icon: "🏠" },
  { to: "/transactions", label: "Transactions", icon: "📋" },
  { to: "/budgets", label: "Budgets", icon: "🎯" },
];

export function NavBar() {
  const { logout } = useAuth();

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex justify-around items-center h-16 max-w-md mx-auto">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === "/"}
          className={({ isActive }) =>
            `flex flex-col items-center text-xs gap-1 px-3 py-1 rounded-lg transition-colors ${
              isActive
                ? "text-teal-600 dark:text-teal-400"
                : "text-neutral-500 dark:text-neutral-400"
            }`
          }
        >
          <span className="text-xl">{tab.icon}</span>
          {tab.label}
        </NavLink>
      ))}
      <button
        onClick={logout}
        className="flex flex-col items-center text-xs gap-1 px-3 py-1 text-neutral-500 dark:text-neutral-400"
      >
        <span className="text-xl">🚪</span>
        Logout
      </button>
    </nav>
  );
}
