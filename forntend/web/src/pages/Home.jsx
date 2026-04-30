import { Link } from "react-router-dom";
import { products, reviews, partners } from "../data/products";
import { Star, ArrowRight, ChevronRight } from "lucide-react";

export default function Home() {
  const topProducts = products.slice(0, 10);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-content">
          <div className="hero-text">
            <h1>Elevate Your Game with Premium Sports Gear</h1>
            <p>
              Discover top-quality equipment for every sport. From football to fitness, we have everything you need to perform at your best.
            </p>
            <Link to="/products" className="btn btn-primary">
              Shop Now <ArrowRight size={18} />
            </Link>
          </div>
          <div className="hero-image">
            <img
              src="https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=600&fit=crop"
              alt="Sports equipment"
            />
          </div>
        </div>
      </section>

      {/* Top 10 Products */}
      <section className="section top-products">
        <div className="container">
          <div className="section-header">
            <h2>Top 10 Products</h2>
            <p>Our best-selling gear loved by athletes worldwide</p>
          </div>
          <div className="product-grid small">
            {topProducts.map((product) => (
              <div className="product-card" key={product.id}>
                <div className="product-image">
                  <img src={product.image} alt={product.name} loading="lazy" />
                </div>
                <div className="product-info">
                  <span className="product-category">{product.category}</span>
                  <h3>{product.name}</h3>
                  <div className="product-meta">
                    <span className="product-price">${product.price.toFixed(2)}</span>
                    <span className={`stock-badge ${product.stock === "In Stock" ? "in" : product.stock === "Low Stock" ? "low" : "out"}`}>
                      {product.stock}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="section-cta">
            <Link to="/products" className="btn btn-outline">
              View All Products <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="section reviews-section">
        <div className="container">
          <div className="section-header">
            <h2>What Our Customers Say</h2>
            <p>Trusted by thousands of athletes around the world</p>
          </div>
          <div className="reviews-grid">
            {reviews.map((review) => (
              <div className="review-card" key={review.id}>
                <div className="stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      fill={i < review.rating ? "#fbbf24" : "none"}
                      color={i < review.rating ? "#fbbf24" : "#d1d5db"}
                    />
                  ))}
                </div>
                <p className="review-text">"{review.text}"</p>
                <p className="reviewer-name">— {review.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="section partners-section">
        <div className="container">
          <div className="section-header">
            <h2>Our Partners</h2>
            <p>We collaborate with the world's leading sports brands</p>
          </div>
          <div className="partners-grid">
            {partners.map((partner) => (
              <div className="partner-logo" key={partner}>
                {partner}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
