import { useEffect, useState } from "react";
import ProfileView from "./ProfileView";
import api, { readError } from "../../lib/api";

export default function ProfilePage() {
  const [employee, setEmployee] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    api
      .get("/auth/me")
      .then(({ data }) => active && setEmployee(data.user))
      .catch((err) => active && setError(readError(err)));

    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <p className="rounded-field border border-clay/40 bg-clay/10 px-3 py-2 text-xs text-clay">
        {error}
      </p>
    );
  }

  if (!employee) {
    return <div className="h-64 animate-pulse rounded-panel border border-line bg-surface" />;
  }

  return <ProfileView employee={employee} isSelf onSaved={setEmployee} />;
}
