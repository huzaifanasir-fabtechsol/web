import { Link } from "react-router-dom";
import { Globe, MessageCircle, Camera, Play, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-col">
          <h3 className="footer-logo">
            Megdo<span>Sports</span>
          </h3>
          <p>
            Your one-stop destination for premium sports equipment. We bring quality gear to athletes of all levels.
          </p>
          <div className="social-links">
            <a href="#" aria-label="Facebook"><Globe size={18} /></a>
            <a href="#" aria-label="Twitter"><MessageCircle size={18} /></a>
            <a href="#" aria-label="Instagram"><Camera size={18} /></a>
            <a href="#" aria-label="Youtube"><Play size={18} /></a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><Link to="/privacy-policy">Privacy Policy</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Categories</h4>
          <ul>
            <li><Link to="/products?category=Football">Football</Link></li>
            <li><Link to="/products?category=Basketball">Basketball</Link></li>
            <li><Link to="/products?category=Fitness">Fitness</Link></li>
            <li><Link to="/products?category=Running">Running</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Contact</h4>
          <ul className="contact-list">
            <li><Mail size={16} /> support@megdosports.com</li>
            <li><Phone size={16} /> +1 (555) 123-4567</li>
            <li><MapPin size={16} /> 123 Sports Ave, New York, NY</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} MegdoSports. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
