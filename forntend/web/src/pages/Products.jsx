import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { products } from "../data/products";
import { ChevronLeft, ChevronRight, Filter, X } from "lucide-react";

const ITEMS_PER_PAGE = 8;

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "";

  const [filterCategory, setFilterCategory] = useState(initialCategory);
  const [filterStock, setFilterStock] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category))].sort(),
    []
  );

  const filtered = useMemo(() => {
    let result = [...products];
    if (filterCategory) {
      result = result.filter((p) => p.category === filterCategory);
    }
    if (filterStock) {
      result = result.filter((p) => p.stock === filterStock);
    }
    if (sortBy === "price-low") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [filterCategory, filterStock, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const pageProducts = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleCategoryChange = (cat) => {
    setFilterCategory(cat);
    setCurrentPage(1);
    if (cat) {
      setSearchParams({ category: cat });
    } else {
      setSearchParams({});
    }
  };

  const clearFilters = () => {
    setFilterCategory("");
    setFilterStock("");
    setSortBy("default");
    setCurrentPage(1);
    setSearchParams({});
  };

  return (
    <div className="container page products-page">
      <div className="page-header">
        <h1>All Products</h1>
        <p>Browse our complete collection of sports equipment</p>
      </div>

      <div className="products-layout">
        {/* Sidebar Filters */}
        <aside className={`filters-sidebar ${mobileFilterOpen ? "open" : ""}`}>
          <div className="filters-header">
            <h3>Filters</h3>
            <button className="close-filters" onClick={() => setMobileFilterOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="filter-group">
            <h4>Category</h4>
            <div className="filter-options">
              <label className={!filterCategory ? "active" : ""}>
                <input
                  type="radio"
                  name="category"
                  checked={!filterCategory}
                  onChange={() => handleCategoryChange("")}
                />
                All Categories
              </label>
              {categories.map((cat) => (
                <label key={cat} className={filterCategory === cat ? "active" : ""}>
                  <input
                    type="radio"
                    name="category"
                    checked={filterCategory === cat}
                    onChange={() => handleCategoryChange(cat)}
                  />
                  {cat}
                </label>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <h4>Stock Status</h4>
            <div className="filter-options">
              <label className={!filterStock ? "active" : ""}>
                <input
                  type="radio"
                  name="stock"
                  checked={!filterStock}
                  onChange={() => { setFilterStock(""); setCurrentPage(1); }}
                />
                All
              </label>
              {["In Stock", "Low Stock", "Out of Stock"].map((s) => (
                <label key={s} className={filterStock === s ? "active" : ""}>
                  <input
                    type="radio"
                    name="stock"
                    checked={filterStock === s}
                    onChange={() => { setFilterStock(s); setCurrentPage(1); }}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <button className="btn btn-outline clear-btn" onClick={clearFilters}>
            Clear Filters
          </button>
        </aside>

        {/* Product Grid */}
        <div className="products-main">
          <div className="products-toolbar">
            <button className="btn btn-outline filter-toggle" onClick={() => setMobileFilterOpen(true)}>
              <Filter size={16} /> Filters
            </button>
            <span className="results-count">{filtered.length} products</span>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="default">Sort by: Default</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A-Z</option>
            </select>
          </div>

          {pageProducts.length === 0 ? (
            <div className="no-results">
              <p>No products found matching your filters.</p>
              <button className="btn btn-primary" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="product-grid">
                {pageProducts.map((product) => (
                  <div className="product-card" key={product.id}>
                    <div className="product-image">
                      <img src={product.image} alt={product.name} loading="lazy" />
                    </div>
                    <div className="product-info">
                      <span className="product-category">{product.category}</span>
                      <h3>{product.name}</h3>
                      <div className="product-details">
                        <span className="product-size">{product.size}</span>
                        <span className={`stock-badge ${product.stock === "In Stock" ? "in" : product.stock === "Low Stock" ? "low" : "out"}`}>
                          {product.stock}
                        </span>
                      </div>
                      <div className="product-meta">
                        <span className="product-price">${product.price.toFixed(2)}</span>
                        <button className="btn btn-sm btn-primary">Add to Cart</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="page-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      className={`page-btn ${page === currentPage ? "active" : ""}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className="page-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
