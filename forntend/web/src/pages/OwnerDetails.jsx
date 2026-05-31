import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getHorseOwner, listHorses } from "../api/horseApi";

export default function OwnerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [owner, setOwner] = useState(null);
  const [horses, setHorses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDetails() {
      if (!accessToken || !id) return;
      setLoading(true);
      setError("");
      try {
        const ownerData = await getHorseOwner(accessToken, id);
        setOwner(ownerData);

        // Fetch horses and filter for this owner
        const horseData = await listHorses(accessToken, { page_size: 1000 });
        const ownerHorses = (horseData.results || []).filter(h => h.owner === Number(id));
        setHorses(ownerHorses);
      } catch (err) {
        setError(err.message || "Failed to load owner details.");
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [accessToken, id]);

  if (loading) {
    return (
      <div className="content" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center", color: "var(--text-soft)" }}>
          <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ marginBottom: 12, color: "var(--active)" }}></i>
          <p>Loading owner details…</p>
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
        <button className="btn btn-outline" onClick={() => navigate("/horse-owners")}>
          <i className="fa-solid fa-arrow-left"></i> Back to Owners
        </button>
      </div>
    );
  }

  if (!owner) return null;

  return (
    <div className="content">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div className="page-header-left">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="act-btn" onClick={() => navigate("/horse-owners")} title="Back" style={{ background: "#fff", border: "1px solid var(--border)" }}>
              <i className="fa-solid fa-arrow-left" style={{ color: "var(--text-mid)" }}></i>
            </button>
            <div>
              <h2>Owner Profile</h2>
              <p>Direct ownership portfolio, registered stable animals and contact history.</p>
            </div>
          </div>
        </div>
        <div>
          <span className="pill pill-blue" style={{ fontSize: 13, padding: "6px 14px" }}>
            OWN-{String(owner.id).padStart(3, "0")}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        {/* Core Stats Card left */}
        <div className="card" style={{ height: "fit-content" }}>
          <div className="card-body" style={{ textAlign: "center", paddingTop: 32, paddingBottom: 32 }}>
            <div className="tbl-avatar" style={{ background: "var(--accent1)", width: 80, height: 80, fontSize: 32, borderRadius: "50%", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="fa-solid fa-user-tie" style={{ color: "#fff" }}></i>
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-dark)", marginBottom: 4 }}>{owner.name}</h3>
            <p style={{ fontSize: 13, color: "var(--text-soft)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
              Joined {owner.joined_date}
            </p>
            <div style={{ marginBottom: 24 }}>
              <span className={`pill ${owner.owner_type === 'Horse Care' ? 'pill-blue' : owner.owner_type === 'Company Owned' ? 'pill-green' : 'pill-orange'}`} style={{ fontSize: 12, padding: "4px 12px" }}>
                {owner.owner_type || "Horse Care"}
              </span>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20, textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: "var(--text-soft)" }}>Registered Horses</span>
                <strong style={{ fontSize: 13, color: "var(--text-dark)" }}>{horses.length}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Panels right */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Contact Details Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-left">
                <div className="card-icon icon-blue">
                  <i className="fa-solid fa-address-book"></i>
                </div>
                <div>
                  <h4 className="card-title">Contact & Security Info</h4>
                  <span className="card-sub">Private address and verification records</span>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>Phone Number</span>
                  <strong style={{ fontSize: 14, color: "var(--text-dark)" }}>{owner.phone}</strong>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>Email Address</span>
                  <strong style={{ fontSize: 14, color: "var(--text-dark)" }}>{owner.email}</strong>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>National CNIC</span>
                  <strong style={{ fontSize: 14, color: "var(--text-dark)" }}>{owner.cnic}</strong>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>Residential Address</span>
                  <span style={{ fontSize: 14, color: "var(--text-dark)", lineHeight: 1.5 }}>{owner.address || "No address provided."}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Owned Horses Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-left">
                <div className="card-icon icon-orange">
                  <i className="fa-solid fa-horse"></i>
                </div>
                <div>
                  <h4 className="card-title">Registered Horses ({horses.length})</h4>
                  <span className="card-sub">Animals currently owned by this client</span>
                </div>
              </div>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {horses.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "var(--text-soft)" }}>
                  No horses are currently registered under this owner.
                </div>
              ) : (
                <div className="table-wrap">
                  <table style={{ border: "none" }}>
                    <thead>
                      <tr>
                        <th style={{ background: "transparent" }}>Horse Name</th>
                        <th style={{ background: "transparent" }}>Breed</th>
                        <th style={{ background: "transparent" }}>Gender</th>
                        <th style={{ background: "transparent" }}>Color</th>
                        <th style={{ background: "transparent", textAlign: "center" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {horses.map(horse => (
                        <tr key={horse.id}>
                          <td>
                            <strong style={{ color: "var(--text-dark)" }}>{horse.horse_name}</strong>
                          </td>
                          <td>{horse.breed}</td>
                          <td>{horse.gender}</td>
                          <td>{horse.color}</td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              className="act-btn act-view"
                              title="View Details"
                              style={{ margin: "0 auto" }}
                              onClick={() => navigate(`/horses/${horse.id}`)}
                            >
                              <i className="fa-regular fa-eye"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
