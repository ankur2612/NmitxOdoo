import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "../ui/Avatar";
import { useAuth } from "../../context/authStore";
import { fullName } from "../../lib/format";

export default function AvatarMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event) {
      if (!wrapRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${fullName(user)}`}
        className="block rounded-full ring-offset-2 ring-offset-surface transition-shadow duration-150 hover:ring-2 hover:ring-line-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Avatar employee={user} size="sm" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-panel border border-line bg-raised shadow-xl shadow-black/40"
        >
          <div className="border-b border-line px-3 py-2.5">
            <p className="truncate font-medium text-ink">{fullName(user)}</p>
            <p className="truncate font-mono text-xs text-ink-faint tnum">{user?.loginId}</p>
          </div>

          <Link
            to="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-ink-dim transition-colors duration-150 hover:bg-surface hover:text-ink focus:outline-none focus-visible:bg-surface"
          >
            My Profile
          </Link>

          {user?.role === "admin" && (
            <Link
              to="/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-ink-dim transition-colors duration-150 hover:bg-surface hover:text-ink focus:outline-none focus-visible:bg-surface"
            >
              Settings
            </Link>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            className="block w-full px-3 py-2 text-left text-ink-dim transition-colors duration-150 hover:bg-surface hover:text-ink focus:outline-none focus-visible:bg-surface"
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
