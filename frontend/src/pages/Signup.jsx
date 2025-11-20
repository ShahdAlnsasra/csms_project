// frontend/src/pages/Signup.jsx
import React, { useEffect, useState } from "react";
import { fetchDepartments } from "../api/api";

export default function Signup() {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchDepartments();
        console.log("DEPARTMENTS FROM BACKEND IN COMPONENT:", data);
        setDepartments(data);
      } catch (e) {
        console.error("Error in load:", e);
      }
    }
    load();
  }, []);

  return (
    <div style={{ padding: "40px" }}>
      <h1>Signup DEBUG</h1>

      <h2>Departments from backend:</h2>
      <pre style={{ background: "#222", color: "#0f0", padding: "10px" }}>
        {JSON.stringify(departments, null, 2)}
      </pre>

      <div style={{ marginTop: "20px" }}>
        <label>
          Choose department:
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{ marginLeft: "10px", padding: "5px" }}
          >
            <option value="">-- select --</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </label>
      </div>

      <p style={{ marginTop: "20px" }}>
        Selected department id: {selectedDept || "(none)"}
      </p>
    </div>
  );
}
