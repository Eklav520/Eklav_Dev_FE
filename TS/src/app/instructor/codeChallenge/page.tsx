// src/pages/admin/create-challenge.tsx
import React, { useState } from "react";
import PageMetaData from "@/components/PageMetaData"; // ✅ FIXED
import AdminManageChallenges from "./components/AdminManageChallenges";
import AdminCreateProblem from "./components/CreateCodeChallenge";

type ViewMode = "create" | "manage";

export default function AdminCreateProblemPage(): JSX.Element {
  const [view, setView] = useState<ViewMode>("manage");

  const baseURL =
    (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:5000/api";

  const eventId = "demoEventId"; // replace with real id later

  return (
    <>
      <PageMetaData title="Code-Challenge" />

      <div style={{ margin: "1rem", display: "flex", gap: 8 }}>
        <button
          onClick={() => setView("manage")}
          className={view === "manage" ? "btn btn-primary" : "btn btn-outline-primary"}
          type="button"
        >
          Manage Challenges
        </button>

        <button
          onClick={() => setView("create")}
          className={view === "create" ? "btn btn-success" : "btn btn-outline-success"}
          type="button"
        >
          Create Challenge
        </button>
      </div>

      {view === "create" ? (
        <AdminCreateProblem eventId={eventId} />   
      ) : (
        <AdminManageChallenges eventId={eventId} baseURL={baseURL} />
      )}
    </>
  );
}
