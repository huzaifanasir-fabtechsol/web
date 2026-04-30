import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="container page contact-page">
      <div className="page-header">
        <h1>Contact Us</h1>
        <p>We would love to hear from you. Reach out anytime!</p>
      </div>

      <div className="contact-layout">
        <div className="contact-info">
          <div className="info-card">
            <Mail size={22} />
            <div>
              <h4>Email</h4>
              <p>support@megdosports.com</p>
            </div>
          </div>
          <div className="info-card">
            <Phone size={22} />
            <div>
              <h4>Phone</h4>
              <p>+1 (555) 123-4567</p>
            </div>
          </div>
          <div className="info-card">
            <MapPin size={22} />
            <div>
              <h4>Address</h4>
              <p>123 Sports Ave, New York, NY 10001</p>
            </div>
          </div>
          <div className="info-card">
            <Clock size={22} />
            <div>
              <h4>Working Hours</h4>
              <p>Mon - Fri: 9:00 AM - 6:00 PM</p>
            </div>
          </div>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          {submitted && (
            <div className="form-success">Thank you! Your message has been sent.</div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="your@email.com"
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="subject">Subject</label>
            <input
              id="subject"
              name="subject"
              type="text"
              required
              value={form.subject}
              onChange={handleChange}
              placeholder="How can we help?"
            />
          </div>
          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              rows={5}
              required
              value={form.message}
              onChange={handleChange}
              placeholder="Write your message here..."
            />
          </div>
          <button type="submit" className="btn btn-primary">
            <Send size={16} /> Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
