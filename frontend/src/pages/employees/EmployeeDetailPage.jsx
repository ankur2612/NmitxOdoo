import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProfileView from "../profile/ProfileView";
import { ArrowLeftIcon } from "../../components/ui/icons";
import { useAuth } from "../../context/authStore";
import api, { readError } from "../../lib/api";

function EmployeeDetail({ id }) {
  const { user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    api
      .get(`/employees/${id}`)
      .then(({ data }) => active && setEmployee(data.employee))
      .catch((err) => active && setError(readError(err)));

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <>
      <Link
        to="/employees"
        className="mb-5 inline-flex items-center gap-1.5 rounded-sm text-ink-dim transition-colors duration-150 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        <ArrowLeftIcon />
        All Employees
      </Link>

      {error ? (
        <p className="rounded-field border border-clay/40 bg-clay/10 px-3 py-2 text-xs text-clay">
          {error}
        </p>
      ) : !employee ? (
        <div className="h-64 animate-pulse rounded-panel border border-line bg-surface" />
      ) : (
        <ProfileView
          employee={employee}
          isSelf={String(employee._id) === String(user?._id)}
          onSaved={setEmployee}
        />
      )}
    </>
  );
}

export default function EmployeeDetailPage() {
  const { id } = useParams();

  return <EmployeeDetail key={id} id={id} />;
}
