import { NavLink, Outlet } from "react-router-dom";
import AvatarMenu from "./AvatarMenu";
import CheckInWidget from "./CheckInWidget";
import { useAuth } from "../../context/authStore";

const TABS = [
  { to: "/employees", label: "Employees" },
  { to: "/attendance", label: "Attendance" },
  { to: "/timeoff", label: "Time Off" },
];

function tabClass({ isActive }) {
  return `-mb-px border-b-2 px-1 py-3.5 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
    isActive
      ? "border-accent text-ink"
      : "border-transparent text-ink-dim hover:text-ink"
  }`;
}

export default function AppShell() {
  const { user } = useAuth();
  const company = user?.company;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[86rem] flex-wrap items-center gap-x-5 px-5 sm:flex-nowrap sm:gap-x-6 sm:px-7">
          <NavLink
            to="/employees"
            className="flex shrink-0 items-center gap-2 rounded-sm py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            {company?.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                width={24}
                height={24}
                className="size-6 rounded object-cover"
              />
            ) : (
              <span aria-hidden="true" className="size-1.5 bg-accent" />
            )}
            <span className="max-w-[10rem] truncate font-display text-lg leading-none text-ink">
              {company?.name || "Dayflow"}
            </span>
          </NavLink>

          <nav
            aria-label="Main"
            className="order-last flex w-full items-center gap-6 border-t border-line sm:order-none sm:w-auto sm:flex-1 sm:border-t-0"
          >
            {TABS.map((tab) => (
              <NavLink key={tab.to} to={tab.to} className={tabClass}>
                {tab.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-3 py-2 sm:order-last sm:ml-0 sm:gap-4 sm:py-0">
            <CheckInWidget />
            <AvatarMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[86rem] px-5 py-7 sm:px-7">
        <Outlet />
      </main>
    </div>
  );
}
