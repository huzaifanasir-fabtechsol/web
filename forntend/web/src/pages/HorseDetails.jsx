import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getHorse } from "../api/horseApi";

export default function HorseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [horse, setHorse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDetails() {
      if (!accessToken || !id) return;
      setLoading(true);
      setError("");
      try {
        const data = await getHorse(accessToken, id);
        setHorse(data);
      } catch (err) {
        setError(err.message || "Failed to load horse details.");
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [accessToken, id]);

  function calculateAge(dobString) {
    if (!dobString) return "N/A";
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  if (loading) {
    return (
      <div className="content" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center", color: "var(--text-soft)" }}>
          <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ marginBottom: 12, color: "var(--active)" }}></i>
          <p>Loading horse details…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content">
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          <i className="fa-solid fa-circle-exclamation"></i> {error}
        </div>
        <button className="btn btn-outline" onClick={() => navigate("/horses")}>
          <i className="fa-solid fa-arrow-left"></i> Back to Horses
        </button>
      </div>
    );
  }

  if (!horse) return null;

  return (
    <div className="content">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div className="page-header-left">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="act-btn" onClick={() => navigate("/horses")} title="Back" style={{ background: "#fff", border: "1px solid var(--border)" }}>
              <i className="fa-solid fa-arrow-left" style={{ color: "var(--text-mid)" }}></i>
            </button>
            <div>
              <h2>Horse Profile</h2>
              <p>Detailed health and lineage characteristics of the equine.</p>
            </div>
          </div>
        </div>
        <div>
          <span className="pill pill-orange" style={{ fontSize: 13, padding: "6px 14px" }}>
            HRS-{String(horse.id).padStart(3, "0")}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        {/* Profile Card left */}
        <div className="card" style={{ height: "fit-content" }}>
          <div className="card-body" style={{ textAlign: "center", paddingTop: 32, paddingBottom: 32 }}>
            <div className="card-icon icon-orange" style={{ width: 80, height: 80, fontSize: 32, borderRadius: "50%", margin: "0 auto 20px" }}>
              <i className="fa-solid fa-horse"></i>
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-dark)", marginBottom: 4 }}>{horse.horse_name}</h3>
            <p style={{ fontSize: 13, color: "var(--text-soft)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 24 }}>
              {horse.breed}
            </p>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20, textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: "var(--text-soft)" }}>Gender</span>
                <strong style={{ fontSize: 13, color: "var(--text-dark)" }}>{horse.gender}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: "var(--text-soft)" }}>Age</span>
                <strong style={{ fontSize: 13, color: "var(--text-dark)" }}>{calculateAge(horse.date_of_birth)} Years</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--text-soft)" }}>Color</span>
                <strong style={{ fontSize: 13, color: "var(--text-dark)" }}>{horse.color}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Panels right */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Attributes Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-left">
                <div className="card-icon icon-blue">
                  <i className="fa-solid fa-clipboard-list"></i>
                </div>
                <div>
                  <h4 className="card-title">Equine Information</h4>
                  <span className="card-sub">Core physical attributes and details</span>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>Date of Birth</span>
                  <strong style={{ fontSize: 14, color: "var(--text-dark)" }}>{horse.date_of_birth}</strong>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>Height</span>
                  <strong style={{ fontSize: 14, color: "var(--text-dark)" }}>{horse.height}</strong>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>Arrival Date</span>
                  <strong style={{ fontSize: 14, color: "var(--text-dark)" }}>{horse.arrival_date}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Owner Info Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-left">
                <div className="card-icon icon-green">
                  <i className="fa-solid fa-user-tie"></i>
                </div>
                <div>
                  <h4 className="card-title">Owner Details</h4>
                  <span className="card-sub">Assigned legal horse owner profile</span>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <h5 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-dark)", marginBottom: 4 }}>{horse.owner_name}</h5>
                  <p style={{ fontSize: 13, color: "var(--text-soft)" }}>{horse.owner_email}</p>
                </div>
                <div>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate(`/horse-owners/${horse.owner}`)}
                  >
                    <i className="fa-regular fa-eye"></i> View Owner Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
