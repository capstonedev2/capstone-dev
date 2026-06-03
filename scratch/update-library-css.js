const fs = require('fs');
const path = 'c:/Users/kylec/Desktop/capstone dev 1/src/styles/library-portal.css';

const newCss = `
/* ═══════════════════════════════════════════════════════════════════
   DIGITAL VAULT - MODERNIZATION UPGRADE
   ═══════════════════════════════════════════════════════════════════ */

/* ─── PHASE 1: HERO SEARCH ─── */
.library-hero-search {
  position: relative;
  margin-bottom: 2rem;
  border-radius: 1.5rem;
  background: 
    radial-gradient(circle at top right, rgba(0, 58, 143, 0.08), transparent 40%),
    radial-gradient(circle at bottom left, rgba(246, 190, 0, 0.06), transparent 50%),
    linear-gradient(135deg, #ffffff, #f8fafc);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255, 255, 255, 1);
  overflow: hidden;
}

.library-hero-search-glass {
  padding: 3.5rem 2rem;
  text-align: center;
  backdrop-filter: blur(12px);
}

.library-hero-search h2 {
  font-size: 2.25rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--library-primary-dark);
  margin: 0 0 1.5rem;
}

.library-search-input-group {
  position: relative;
  display: flex;
  max-width: 720px;
  margin: 0 auto 1.5rem;
  background: #fff;
  border-radius: 999px;
  padding: 0.5rem;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  border: 1px solid rgba(226, 232, 240, 0.8);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.library-search-input-group:focus-within {
  box-shadow: 0 12px 32px rgba(0, 58, 143, 0.12);
  transform: translateY(-2px);
  border-color: rgba(0, 58, 143, 0.2);
}

.library-search-icon {
  position: absolute;
  left: 1.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--library-muted);
  font-size: 1.25rem;
}

.library-search-input-group input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0.5rem 1rem 0.5rem 3.5rem;
  font-size: 1.1rem;
  outline: none;
  color: var(--library-text);
}

.library-search-submit {
  border-radius: 999px;
  padding: 0 2rem;
  font-size: 1.05rem;
  min-height: 3.2rem;
  box-shadow: 0 4px 12px rgba(0, 58, 143, 0.2);
}

.library-quick-filters {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.library-quick-filter-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--library-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-right: 0.5rem;
}

.library-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 1rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(226, 232, 240, 0.8);
  color: var(--library-text);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.library-pill-btn i {
  color: var(--library-primary);
}

.library-pill-btn:hover {
  background: #fff;
  border-color: var(--library-primary);
  color: var(--library-primary);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}

/* ─── PHASE 2: BENTO BOX GRID ─── */
.library-bento-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.library-bento-item {
  display: flex;
}

.library-bento-item.is-large {
  grid-column: span 2;
}

.library-bento-item .library-stat-card {
  width: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 1.75rem;
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 1.25rem;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.library-bento-item .library-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
}

.library-bento-item.is-large .library-stat-card {
  background: linear-gradient(135deg, var(--library-primary-dark), var(--library-primary));
  color: #fff;
  border: none;
}

.library-bento-item.is-large h3 {
  color: rgba(255, 255, 255, 0.7);
}

.library-bento-item.is-large h2 {
  color: #fff;
  font-size: 2.75rem;
}

.library-bento-highlight {
  display: inline-flex;
  background: rgba(255, 255, 255, 0.15);
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #fff !important;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.library-trend-up {
  color: var(--library-success) !important;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

/* ─── PHASE 3: FEATURED SHOWCASE ─── */
.library-section-card.is-transparent {
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
}

.library-section-head.is-floating {
  padding: 0 0 1.25rem;
  border: none;
}

.library-section-head.is-floating h3 {
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.library-showcase-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.library-showcase-card {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 280px;
  border-radius: 1.25rem;
  overflow: hidden;
  text-decoration: none;
  background: #fff;
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
}

.library-showcase-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
}

.library-showcase-bg-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 120px;
  background: linear-gradient(135deg, rgba(0, 58, 143, 0.05), rgba(0, 58, 143, 0.15));
  transition: height 0.3s ease, transform 0.3s ease;
  z-index: 0;
}

.library-showcase-card:hover .library-showcase-bg-pattern {
  height: 140px;
  transform: scale(1.05);
}

.library-showcase-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1.5rem;
}

.library-showcase-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: auto;
}

.library-showcase-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 1rem;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: var(--library-primary);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
}

.library-showcase-bottom h4 {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--library-text);
  margin: 0 0 0.5rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.library-showcase-bottom p {
  font-size: 0.9rem;
  color: var(--library-muted);
  margin: 0 0 1rem;
}

.library-showcase-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--library-muted);
}

.library-hover-action {
  color: var(--library-primary);
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
}

.library-showcase-card:hover .library-hover-action {
  opacity: 1;
  transform: translateX(0);
}

/* Department Specific Gradients for Showcase */
.library-showcase-card.dept-it .library-showcase-bg-pattern {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.2));
}
.library-showcase-card.dept-cs .library-showcase-bg-pattern {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.2));
}
.library-showcase-card.dept-ba .library-showcase-bg-pattern {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.2));
}

/* ─── PHASE 4: MODERN DATA LIST ─── */
.p-0 { padding: 0 !important; }

.library-modern-list {
  display: flex;
  flex-direction: column;
}

.library-list-header {
  display: grid;
  grid-template-columns: 2.5fr 1.5fr 2fr 1fr 100px;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid var(--library-border);
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--library-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.library-list-body {
  display: flex;
  flex-direction: column;
}

.library-list-row {
  display: grid;
  grid-template-columns: 2.5fr 1.5fr 2fr 1fr 100px;
  gap: 1rem;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--library-border);
  text-decoration: none;
  color: var(--library-text);
  transition: background 0.2s ease;
}

.library-list-row:last-child {
  border-bottom: none;
}

.library-list-row:hover {
  background: #f1f5f9;
}

.library-list-row strong {
  color: var(--library-primary-dark);
  font-size: 1rem;
}

.library-list-row span {
  font-size: 0.9rem;
  color: var(--library-muted);
}

.col-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5rem;
}

.library-action-reveal {
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.2s ease;
  width: 2.25rem;
  height: 2.25rem;
}

.library-list-row:hover .library-action-reveal {
  opacity: 1;
  transform: scale(1);
}

.library-row-arrow {
  color: var(--library-muted);
  font-size: 0.9rem;
  margin-left: 0.5rem;
  transition: transform 0.2s ease;
}

.library-list-row:hover .library-row-arrow {
  transform: translateX(4px);
  color: var(--library-primary);
}
`;

fs.appendFileSync(path, newCss);
console.log('Appended new digital vault styles to library-portal.css');
