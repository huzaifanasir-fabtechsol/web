import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createWorker, getWorker, updateWorker } from "../../api/workerApi";

const EMPTY_FORM = {
  name: "",
  date_of_birth: "",
  cnic: "",
  gender: "Male",
  email: "",
  job_role: "",
  hire_date: "",
  salary: "",
};

export default function AddWorker() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams(); // present if we are editing
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [fetching, setFetching] = useState(false);

  // Load worker details if editing
  useEffect(() => {
    if (id && accessToken) {
      async function loadWorker() {
        setFetching(true);
        try {
          const data = await getWorker(accessToken, id);
          setForm({
            name: data.name || "",
            date_of_birth: data.date_of_birth || "",
            cnic: data.cnic || "",
            gender: data.gender || "Male",
            email: data.email || "",
            job_role: data.job_role || "",
            hire_date: data.hire_date || "",
            salary: data.salary ? String(data.salary) : "",
          });
          if (data.profile_photo) {
            setPhotoPreview(data.profile_photo);
          }
        } catch (e) {
          setSaveError("Failed to fetch worker details: " + e.message);
        } finally {
          setFetching(false);
        }
      }
      loadWorker();
    }
  }, [id, accessToken]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setFormErrors((fe) => ({ ...fe, [name]: "" }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setFormErrors((fe) => ({ ...fe, profile_photo: "File size exceeds 2MB limit." }));
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setFormErrors((fe) => ({ ...fe, profile_photo: "" }));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const validate = () => {
    const errs = {};
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cnicRe = /^\d{5}-\d{7}-\d{1}$/;

    if (!form.name.trim()) errs.name = "Full name is required.";
    if (!form.date_of_birth) errs.date_of_birth = "Date of birth is required.";
    
    if (!form.cnic.trim()) {
      errs.cnic = "CNIC is required.";
    } else if (!cnicRe.test(form.cnic)) {
      errs.cnic = "CNIC format must be XXXXX-XXXXXXX-X";
    }

    if (!form.gender) errs.gender = "Gender selection is required.";
    
    if (!form.email.trim()) {
      errs.email = "Email is required.";
    } else if (!emailRe.test(form.email)) {
      errs.email = "Please enter a valid email address.";
    }

    if (!form.job_role) errs.job_role = "Job role selection is required.";
    if (!form.hire_date) errs.hire_date = "Hire date is required.";
    
    if (!form.salary || isNaN(form.salary) || Number(form.salary) <= 0) {
      errs.salary = "Enter a valid positive salary.";
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setLoading(true);
    setSaveError("");

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("date_of_birth", form.date_of_birth);
    formData.append("cnic", form.cnic);
    formData.append("gender", form.gender);
    formData.append("email", form.email);
    formData.append("job_role", form.job_role);
    formData.append("hire_date", form.hire_date);
    formData.append("salary", form.salary);

    if (photoFile) {
      formData.append("profile_photo", photoFile);
    }

    try {
      if (id) {
        await updateWorker(accessToken, id, formData);
      } else {
        await createWorker(accessToken, formData);
      }
      navigate("/workers/list");
    } catch (err) {
      setSaveError(err.message || "Failed to save employee record.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="content" style={{ display: "flex", justifyContent: "center", padding: "64px" }}>
        <i className="fa-solid fa-spinner fa-spin fa-2xl" style={{ color: "var(--active)" }}></i>
      </div>
    );
  }

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-left">
          <h2>{id ? "Edit Worker" : "Register Worker"}</h2>
          <p>{id ? "Update employee or staff details in the database." : "Add a new employee or staff member to the system."}</p>
        </div>
        <div>
          <Link to="/workers/list" className="btn btn-outline">
            <i className="fa-solid fa-arrow-left"></i> Back to List
          </Link>
        </div>
      </div>

      <div className="card" style={{ width: "100%" }}>
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-icon icon-blue">
              <i className="fa-solid fa-address-card"></i>
            </div>
            <div>
              <div className="card-title">Employee Details</div>
            </div>
          </div>
        </div>
        
        <div className="card-body">
          {saveError && (
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              <i className="fa-solid fa-circle-exclamation"></i> {saveError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="upload-zone" style={{ marginBottom: 30 }} onClick={triggerFileInput}>
              <div className="upload-preview">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" />
                ) : (
                  <i className="fa-solid fa-camera ph-icon"></i>
                )}
              </div>
              <div className="upload-info">
                <h4>Upload Profile Photo</h4>
                <p>JPG, PNG or WEBP. Max size 2MB.</p>
                <button type="button" className="btn btn-outline btn-sm">Select Image</button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: "none" }}
                />
              </div>
            </div>
            {formErrors.profile_photo && (
              <div className="field-error" style={{ marginBottom: 15 }}>
                {formErrors.profile_photo}
              </div>
            )}

            <div className="form-grid">
              <div className="form-divider"><span>Personal Info</span></div>
              
              <div className="form-group span-2">
                <label className="form-label">Full Name <span>*</span></label>
                <input
                  type="text"
                  name="name"
                  className={`form-control ${formErrors.name ? "is-invalid" : ""}`}
                  placeholder="e.g. John Doe"
                  value={form.name}
                  onChange={handleFormChange}
                />
                {formErrors.name && <div className="field-error">{formErrors.name}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Date of Birth <span>*</span></label>
                <input
                  type="date"
                  name="date_of_birth"
                  className={`form-control ${formErrors.date_of_birth ? "is-invalid" : ""}`}
                  value={form.date_of_birth}
                  onChange={handleFormChange}
                />
                {formErrors.date_of_birth && <div className="field-error">{formErrors.date_of_birth}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">CNIC <span>*</span></label>
                <input
                  type="text"
                  name="cnic"
                  className={`form-control ${formErrors.cnic ? "is-invalid" : ""}`}
                  placeholder="35201-1234567-9"
                  value={form.cnic}
                  onChange={handleFormChange}
                />
                {formErrors.cnic && <div className="field-error">{formErrors.cnic}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Gender <span>*</span></label>
                <select
                  name="gender"
                  className={`form-control ${formErrors.gender ? "is-invalid" : ""}`}
                  value={form.gender}
                  onChange={handleFormChange}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {formErrors.gender && <div className="field-error">{formErrors.gender}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Email Address <span>*</span></label>
                <input
                  type="email"
                  name="email"
                  className={`form-control ${formErrors.email ? "is-invalid" : ""}`}
                  placeholder="worker@example.com"
                  value={form.email}
                  onChange={handleFormChange}
                />
                {formErrors.email && <div className="field-error">{formErrors.email}</div>}
              </div>

              <div className="form-divider" style={{ marginTop: 12 }}><span>Employment Details</span></div>
              
              <div className="form-group span-2">
                <label className="form-label">Job Role / Title <span>*</span></label>
                <select
                  name="job_role"
                  className={`form-control ${formErrors.job_role ? "is-invalid" : ""}`}
                  value={form.job_role}
                  onChange={handleFormChange}
                >
                  <option value="">Select Role</option>
                  <option value="Instructor / Trainer">Instructor / Trainer</option>
                  <option value="Stable Hand">Stable Hand</option>
                  <option value="Veterinarian">Veterinarian</option>
                  <option value="Admin Staff">Admin Staff</option>
                </select>
                {formErrors.job_role && <div className="field-error">{formErrors.job_role}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Hire Date <span>*</span></label>
                <input
                  type="date"
                  name="hire_date"
                  className={`form-control ${formErrors.hire_date ? "is-invalid" : ""}`}
                  value={form.hire_date}
                  onChange={handleFormChange}
                />
                {formErrors.hire_date && <div className="field-error">{formErrors.hire_date}</div>}
              </div>
              
              <div className="form-group">
                <label className="form-label">Salary (Rs.) <span>*</span></label>
                <input
                  type="number"
                  name="salary"
                  className={`form-control ${formErrors.salary ? "is-invalid" : ""}`}
                  placeholder="Monthly Salary"
                  value={form.salary}
                  onChange={handleFormChange}
                />
                {formErrors.salary && <div className="field-error">{formErrors.salary}</div>}
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline" onClick={() => navigate("/workers/list")} disabled={loading}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <><i className="fa-solid fa-spinner fa-spin"></i> Saving…</>
                ) : (
                  <><i className="fa-solid fa-check"></i> {id ? "Update Worker" : "Register Worker"}</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
