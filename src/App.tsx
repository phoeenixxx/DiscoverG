import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  ChevronRight,
  Compass,
  Heart,
  Info,
  Instagram,
  MapPin,
  Menu,
  Mountain,
  Navigation,
  Search,
  Sparkles,
  X
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap
} from "react-leaflet";
import L from "leaflet";
import { categories, destinations, Destination } from "./data";

const markerCategories: Record<string, { symbol: string; color: string }> = {
  "მთები": { symbol: "▲", color: "#527c69" },
  "ტბები": { symbol: "≈", color: "#438ca6" },
  "ჩანჩქერები": { symbol: "✦", color: "#55a9bd" },
  "კანიონები": { symbol: "⌁", color: "#b77c52" },
  "ქალაქები": { symbol: "⌂", color: "#bd9255" },
  "კურორტები": { symbol: "❄", color: "#7898b7" },
  "ისტორიული ადგილები": { symbol: "✧", color: "#a47b58" },
  "ბუნება": { symbol: "♣", color: "#638d68" }
};

function getMarkerIcon(category: string, active: boolean) {
  const marker = markerCategories[category] || {
    symbol: "●",
    color: "#638d68"
  };

  return L.divIcon({
    className: "destination-marker-wrapper",
    html: `
      <span
        class="destination-marker ${active ? "active" : ""}"
        style="--marker-color: ${marker.color}"
      >
        ${marker.symbol}
      </span>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19]
  });
}

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="navbar">
      <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
        <span className="brand-symbol">G</span>
        <span>
          <strong>GEORGIA</strong>
          <small>DISCOVER THE UNEXPECTED</small>
        </span>
      </Link>

      <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <X /> : <Menu />}
      </button>

      <nav className={menuOpen ? "nav-links open" : "nav-links"}>
        <Link to="/" onClick={() => setMenuOpen(false)}>მთავარი</Link>
        <Link to="/explore" onClick={() => setMenuOpen(false)}>აღმოაჩინე</Link>
        <Link to="/favorites" onClick={() => setMenuOpen(false)}>რჩეულები</Link>
        <Link to="/about" onClick={() => setMenuOpen(false)}>ჩვენ შესახებ</Link>
        <Link to="/explore" className="nav-cta" onClick={() => setMenuOpen(false)}>
          დაიწყე მოგზაურობა <ArrowUpRight size={16} />
        </Link>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="footer-brand">
          <div className="brand-symbol">G</div>
          <h2>აღმოაჩინე საქართველო</h2>
          <p>ერთი ქვეყანა. ათასი თავგადასავალი.</p>
        </div>
        <div>
          <h4>აღმოაჩინე</h4>
          <Link to="/explore">ყველა მიმართულება</Link>
          <Link to="/explore">მთები და ბუნება</Link>
          <Link to="/explore">ისტორიული ადგილები</Link>
        </div>
        <div>
          <h4>ჩვენ შესახებ</h4>
          <Link to="/about">პროექტის შესახებ</Link>
          <Link to="/favorites">ჩემი რჩეულები</Link>
        </div>
        <div>
          <h4>გამოგვყევი</h4>
          <a href="https://instagram.com" target="_blank" rel="noreferrer">
            Instagram <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 DISCOVER GEORGIA</span>
        <span>შექმნილია საქართველოს სიყვარულით</span>
      </div>
    </footer>
  );
}

function DestinationCard({
  destination,
  favorite,
  onFavorite
}: {
  destination: Destination;
  favorite: boolean;
  onFavorite: (id: string) => void;
}) {
  return (
    <motion.article
      className="destination-card"
      whileHover={{ y: -7 }}
      transition={{ duration: 0.25 }}
    >
      <Link to={`/destination/${destination.id}`} className="card-image">
        <img src={destination.image} alt={destination.name} loading="lazy" />
        <span className="card-category">{destination.category}</span>
        <span className="card-arrow"><ArrowUpRight size={19} /></span>
      </Link>
      <button
        className={favorite ? "favorite-button active" : "favorite-button"}
        onClick={() => onFavorite(destination.id)}
        aria-label="რჩეულებში დამატება"
      >
        <Heart size={18} fill={favorite ? "currentColor" : "none"} />
      </button>
      <div className="card-content">
        <span className="card-region"><MapPin size={13} /> {destination.region}</span>
        <Link to={`/destination/${destination.id}`}>
          <h3>{destination.name}</h3>
        </Link>
        <p>{destination.short}</p>
        <Link to={`/destination/${destination.id}`} className="card-link">
          გაიგე მეტი <ArrowRight size={16} />
        </Link>
      </div>
    </motion.article>
  );
}

function SceneBackground({ scene }: { scene: string }) {
  return (
    <div className={`scene scene-${scene}`}>
      <div className="scene-glow" />
      <div className="scene-orb" />
      <div className="scene-layer scene-layer-one" />
      <div className="scene-layer scene-layer-two" />
      <div className="scene-layer scene-layer-three" />
      {scene === "sea" || scene === "river" || scene === "waterfall" || scene === "lake" ? (
        <div className="water-lines">
          <span />
          <span />
          <span />
          <span />
        </div>
      ) : null}
      {scene === "forest" ? <div className="forest-particles" /> : null}
      {scene === "snow" ? <div className="snow-particles" /> : null}
    </div>
  );
}

function MapController({
  selected
}: {
  selected: Destination | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (selected) {
      map.flyTo(selected.coordinates, 10, { duration: 1.3 });
    } else {
      map.flyTo([42.15, 43.45], 7, { duration: 1.2 });
    }
  }, [selected, map]);

  return null;
}

function MapResize({ expanded }: { expanded: boolean }) {
  const map = useMap();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      map.invalidateSize();
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [expanded, map]);

  return null;
}

function GeorgiaMap({
  selected,
  onSelect,
  expanded
}: {
  selected: Destination | null;
  onSelect: (destination: Destination | null) => void;
  expanded: boolean;
}) {
  return (
    <div className={expanded ? "map-shell expanded" : "map-shell"}>
      <MapContainer
        center={[42.15, 43.45]}
        zoom={7}
        scrollWheelZoom={true}
        className="leaflet-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {destinations.map((destination) => (
          <Marker
            key={destination.id}
            position={destination.coordinates}
            icon={getMarkerIcon(
              destination.category,
              selected?.id === destination.id
            )}
            eventHandlers={{
              click: () => onSelect(destination)
            }}
          >
            <Popup>
              <div className="map-popup">
                <strong>{destination.name}</strong>
                <span>{destination.region}</span>
                <button onClick={() => onSelect(destination)}>
                  დეტალურად
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        <MapController selected={selected} />
        <MapResize expanded={expanded} />
      </MapContainer>

      <div className="map-counter">
        <MapPin size={15} />
        {destinations.length} მიმართულება
      </div>

      {selected && (
        <button className="map-close" onClick={() => onSelect(null)}>
          <X size={20} />
        </button>
      )}
    </div>
  );
}

function Home({
  favorites,
  toggleFavorite
}: {
  favorites: string[];
  toggleFavorite: (id: string) => void;
}) {
  const featured = destinations.slice(0, 6);

  return (
    <>
      <section className="hero">
        <div className="hero-image" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <motion.span
            className="eyebrow"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Sparkles size={15} /> აღმოაჩინე საქართველო
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            იქ, სადაც
            <br />
            <em>ისტორია</em> ხვდება
            <br />
            ბუნების სილამაზეს.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            აღმოაჩინე საქართველოს გამორჩეული ადგილები, დაუვიწყარი ხედები და
            ისტორიები, რომლებიც თითოეულ მოგზაურობას განსაკუთრებულს ხდის.
          </motion.p>
          <motion.div
            className="hero-actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
          >
            <Link to="/explore" className="button-primary">
              დაიწყე აღმოჩენა <ArrowUpRight size={18} />
            </Link>
            <a href="#discover" className="button-outline">
              გაიგე მეტი <ArrowDown size={17} />
            </a>
          </motion.div>
        </div>
        <div className="hero-bottom">
          <span>41°42' N — 44°47' E</span>
          <span>CAUCASUS · GEORGIA</span>
        </div>
        <div className="hero-scroll"><span /> SCROLL TO EXPLORE</div>
      </section>

      <section className="intro-section section-pad" id="discover">
        <div className="intro-heading">
          <span className="section-label">01 / აღმოაჩინე ქვეყანა</span>
          <h2>პატარა ქვეყანა,<br /><em>დიდი აღმოჩენები.</em></h2>
        </div>
        <div className="intro-copy">
          <p>
            კავკასიონის დათოვლილი მწვერვალებიდან შავი ზღვის სანაპირომდე,
            უძველესი ქალაქებიდან ხელუხლებელ ბუნებამდე — საქართველო
            მოგზაურობის უსასრულო შესაძლებლობებს გთავაზობს.
          </p>
          <Link to="/about" className="text-link">
            ჩვენი ისტორია <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>

      <section className="featured-section section-pad">
        <div className="section-heading">
          <div>
            <span className="section-label">02 / შერჩეული მიმართულებები</span>
            <h2>ადგილები, რომლებიც<br /><em>უნდა აღმოაჩინო.</em></h2>
          </div>
          <Link to="/explore" className="text-link">
            ყველა მიმართულება <ArrowRight size={17} />
          </Link>
        </div>
        <div className="destination-grid">
          {featured.map((destination) => (
            <DestinationCard
              key={destination.id}
              destination={destination}
              favorite={favorites.includes(destination.id)}
              onFavorite={toggleFavorite}
            />
          ))}
        </div>
      </section>

      <section className="map-preview-section">
        <div className="map-preview-copy">
          <span className="section-label">03 / საქართველო რუკაზე</span>
          <h2>შენი შემდეგი<br /><em>თავგადასავალი</em><br />აქ იწყება.</h2>
          <p>
            დაათვალიერე საქართველოს რუკა, აირჩიე ადგილი და აღმოაჩინე ყველაფერი,
            რაც მის შესახებ უნდა იცოდე.
          </p>
          <Link to="/explore" className="button-primary">
            გახსენი რუკა <Navigation size={17} />
          </Link>
        </div>
        <div className="map-preview-art">
          <div className="map-preview-glow" />
          <img
            src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1000"
            alt="საქართველოს ბუნება"
          />
          <div className="map-preview-tag"><MapPin size={15} /> საქართველო</div>
        </div>
      </section>

      <section className="quote-section">
        <span className="section-label">GEORGIA · A PLACE TO FEEL</span>
        <h2>„ზოგი ადგილი უბრალოდ უნდა ნახო.<br /><em>საქართველო კი უნდა იგრძნო.“</em></h2>
      </section>
    </>
  );
}

function Explore({
  favorites,
  toggleFavorite
}: {
  favorites: string[];
  toggleFavorite: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ყველა");
  const [selected, setSelected] = useState<Destination | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const handleSelect = (destination: Destination | null) => {
    setSelected(destination);

    if (destination) {
      window.setTimeout(() => {
        detailRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 350);
    }
  };

  const filtered = useMemo(() => {
    return destinations.filter((destination) => {
      const matchesCategory =
        category === "ყველა" || destination.category === category;

      const term = search.toLowerCase();

      const matchesSearch =
        destination.name.toLowerCase().includes(term) ||
        destination.region.toLowerCase().includes(term) ||
        destination.short.toLowerCase().includes(term);

      return matchesCategory && matchesSearch;
    });
  }, [search, category]);

  return (
    <main className="explore-page">
      <section className="page-hero">
        <span className="section-label">EXPLORE GEORGIA / 2026</span>
        <h1>აღმოაჩინე<br /><em>შენი საქართველო.</em></h1>
        <p>აირჩიე მიმართულება და დაიწყე ახალი თავგადასავალი.</p>
      </section>

      <section className="explore-map-section section-pad">
        <div className="section-heading">
          <div>
            <span className="section-label">ინტერაქტიული რუკა</span>
            <h2>საქართველო <em>შენს ხელში.</em></h2>
          </div>
          <span className="map-hint">
            <MapPin size={15} /> აირჩიე მარკერი რუკაზე
          </span>
        </div>

        <GeorgiaMap
          selected={selected}
          onSelect={handleSelect}
          expanded={Boolean(selected)}
        />

        <div ref={detailRef} className="map-detail-anchor">
          <AnimatePresence>
            {selected && (
              <motion.div
                className="map-detail"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.35 }}
              >
                <div className="map-detail-image">
                  <img src={selected.image} alt={selected.name} />
                </div>

                <div className="map-detail-content">
                  <span className="section-label">
                    {selected.region} / {selected.category}
                  </span>
                  <h3>{selected.name}</h3>
                  <p>{selected.description}</p>

                  <div className="detail-mini-info">
                    <span><Mountain size={15} /> {selected.altitude}</span>
                    <span><Compass size={15} /> {selected.duration}</span>
                  </div>

                  <Link
                    to={`/destination/${selected.id}`}
                    className="text-link"
                  >
                    სრული ინფორმაცია <ArrowRight size={16} />
                  </Link>
                </div>

                <div className="map-detail-extra">
                  <div>
                    <h4>მთავარი სანახაობები</h4>
                    <ul>
                      {selected.highlights.slice(0, 4).map((item) => (
                        <li key={item}>
                          <Check size={15} />
                          <span>{item.replace(/^svg/, "")}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4>საინტერესო ფაქტები</h4>
                    <ul>
                      {selected.facts.slice(0, 3).map((item) => (
                        <li key={item}>
                          <Info size={15} />
                          <span>{item.replace(/^svg/, "")}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4>რისი გაკეთება შეგიძლია</h4>
                    <ul>
                      {selected.activities.slice(0, 4).map((item) => (
                        <li key={item}>
                          <Sparkles size={15} />
                          <span>{item.replace(/^svg/, "")}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <section className="all-destinations section-pad">
        <div className="section-heading">
          <div>
            <span className="section-label">მიმართულებების კატალოგი</span>
            <h2>აირჩიე შენი <em>ადგილი.</em></h2>
          </div>
          <span className="results-count">{filtered.length} ადგილი</span>
        </div>

        <div className="explore-controls">
          <div className="search-box">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="მოძებნე ადგილი ან რეგიონი..."
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <X size={16} />
              </button>
            )}
          </div>

          <div className="category-list">
            {categories.map((item) => (
              <button
                key={item}
                className={category === item ? "category-chip active" : "category-chip"}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="destination-grid">
            {filtered.map((destination) => (
              <DestinationCard
                key={destination.id}
                destination={destination}
                favorite={favorites.includes(destination.id)}
                onFavorite={toggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Search size={32} />
            <h3>მიმართულება ვერ მოიძებნა</h3>
            <p>სცადე სხვა საძიებო სიტყვა ან კატეგორია.</p>
            <button
              className="button-primary"
              onClick={() => {
                setSearch("");
                setCategory("ყველა");
              }}
            >
              ფილტრების გასუფთავება
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

function DestinationPage({
  favorites,
  toggleFavorite
}: {
  favorites: string[];
  toggleFavorite: (id: string) => void;
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const destination = destinations.find((item) => item.id === id);

  if (!destination) {
    return (
      <div className="not-found">
        <h1>ადგილი ვერ მოიძებნა</h1>
        <Link to="/explore" className="button-primary">ყველა მიმართულება</Link>
      </div>
    );
  }

  const isFavorite = favorites.includes(destination.id);

  const related = destinations
    .filter((item) => item.id !== destination.id && (
      item.region === destination.region || item.category === destination.category
    ))
    .slice(0, 3);

  return (
    <main className="destination-page">
      <section className="destination-hero">
        <img src={destination.image} alt={destination.name} />
        <div className="destination-hero-overlay" />

        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={17} /> უკან დაბრუნება
        </button>

        <div className="destination-hero-content">
          <span className="eyebrow">
            <MapPin size={15} /> {destination.region} · {destination.category}
          </span>
          <h1>{destination.name}</h1>
          <p>{destination.short}</p>

          <button
            className={isFavorite ? "button-primary saved" : "button-primary"}
            onClick={() => toggleFavorite(destination.id)}
          >
            <Heart size={17} fill={isFavorite ? "currentColor" : "none"} />
            {isFavorite ? "რჩეულებშია" : "დაამატე რჩეულებში"}
          </button>
        </div>

        <div className="destination-scene">
          <SceneBackground scene={destination.scene} />
        </div>
      </section>

      <section className="destination-overview section-pad">
        <div className="destination-main-copy">
          <span className="section-label">01 / ადგილის შესახებ</span>
          <h2>აღმოაჩინე <em>{destination.name}.</em></h2>
          <p>{destination.description}</p>

          <div className="overview-stats">
            <div><span>სიმაღლე</span><strong>{destination.altitude}</strong></div>
            <div><span>რეკომენდებული დრო</span><strong>{destination.duration}</strong></div>
            <div><span>საუკეთესო სეზონი</span><strong>{destination.season}</strong></div>
            <div><span>სირთულე</span><strong>{destination.difficulty}</strong></div>
          </div>
        </div>

        <div className="destination-side-note">
          <span className="note-icon"><Info size={20} /></span>
          <h3>როგორ მივიდეთ?</h3>
          <p>{destination.access}</p>
          <div className="coordinates">
            <MapPin size={15} />
            {destination.coordinates[0].toFixed(4)}° N, {destination.coordinates[1].toFixed(4)}° E
          </div>
        </div>
      </section>

      <section className="destination-gallery section-pad">
        <div className="section-heading">
          <div>
            <span className="section-label">02 / ვიზუალური მოგზაურობა</span>
            <h2>შეხედე <em>გარშემო.</em></h2>
          </div>
        </div>

        <div className="gallery-grid">
          <div className="gallery-main">
            <img src={destination.image} alt={destination.name} />
            <span>{destination.name} · საქართველო</span>
          </div>

          <div className="gallery-secondary">
            <img
              src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800"
              alt="საქართველოს ბუნება"
            />
            <img
              src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800"
              alt="საქართველოს მთები"
            />
          </div>
        </div>
      </section>

      <section className="destination-info-grid section-pad">
        <div className="info-block">
          <span className="section-label">03 / მთავარი სანახაობები</span>
          <h2>რა უნდა <em>ნახო.</em></h2>
          <ul className="feature-list">
            {destination.highlights.map((item, index) => (
              <li key={item}>
                <span>0{index + 1}</span>
                {item.replace(/^svg/, "")}
                <Check size={17} />
              </li>
            ))}
          </ul>
        </div>

        <div className="info-block facts-block">
          <span className="section-label">04 / საინტერესო ფაქტები</span>
          <h2>იცოდი, რომ...</h2>
          {destination.facts.map((fact, index) => (
            <div className="fact-item" key={fact}>
              <span>0{index + 1}</span>
              <p>{fact.replace(/^svg/, "")}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="activities-section section-pad">
        <span className="section-label">05 / გამოცდილებები</span>
        <h2>რას შეძლებ <em>აქ?</em></h2>
        <div className="tag-list">
          {destination.activities.map((activity) => (
            <span key={activity}>
              <Sparkles size={15} /> {activity.replace(/^svg/, "")}
            </span>
          ))}
        </div>
      </section>

      <section className="food-nearby section-pad">
        <div className="food-panel">
          <span className="section-label">06 / ადგილობრივი გემოები</span>
          <h2>დააგემოვნე <em>რეგიონი.</em></h2>
          <p>
            მოგზაურობა ადგილობრივი სამზარეულოს გაცნობის გარეშეც არ არის სრულყოფილი.
          </p>
          <div className="tag-list">
            {destination.food.map((food) => (
              <span key={food}>{food.replace(/^svg/, "")}</span>
            ))}
          </div>
        </div>

        <div className="nearby-panel">
          <span className="section-label">07 / ახლომდებარე ადგილები</span>
          <h2>გააგრძელე <em>აღმოჩენა.</em></h2>
          <div className="nearby-list">
            {destination.nearby.map((place) => (
              <div key={place}>
                <MapPin size={16} /> {place.replace(/^svg/, "")}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="tips-section section-pad">
        <div>
          <span className="section-label">08 / სასარგებლო რჩევები</span>
          <h2>მოემზადე <em>მოგზაურობისთვის.</em></h2>
        </div>

        <div className="tips-list">
          {destination.tips.map((tip, index) => (
            <div key={tip}>
              <span>0{index + 1}</span>
              <p>{tip.replace(/^svg/, "")}</p>
            </div>
          ))}
        </div>
      </section>

      {related.length > 0 && (
        <section className="related-section section-pad">
          <div className="section-heading">
            <div>
              <span className="section-label">09 / მსგავსი მიმართულებები</span>
              <h2>კიდევ <em>აღმოაჩინე.</em></h2>
            </div>
            <Link to="/explore" className="text-link">
              ყველა ადგილი <ArrowRight size={17} />
            </Link>
          </div>

          <div className="destination-grid">
            {related.map((item) => (
              <DestinationCard
                key={item.id}
                destination={item}
                favorite={favorites.includes(item.id)}
                onFavorite={toggleFavorite}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function Favorites({
  favorites,
  toggleFavorite
}: {
  favorites: string[];
  toggleFavorite: (id: string) => void;
}) {
  const saved = destinations.filter((item) => favorites.includes(item.id));

  return (
    <main className="favorites-page section-pad">
      <div className="page-hero compact">
        <span className="section-label">YOUR COLLECTION</span>
        <h1>შენი <em>რჩეული ადგილები.</em></h1>
        <p>შეინახე ადგილები, რომელთა მონახულებაც მომავალში გსურს.</p>
      </div>

      {saved.length ? (
        <div className="destination-grid">
          {saved.map((destination) => (
            <DestinationCard
              key={destination.id}
              destination={destination}
              favorite={true}
              onFavorite={toggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Bookmark size={36} />
          <h3>ჯერ არაფერი შეგინახავს</h3>
          <p>
            დაათვალიერე მიმართულებები და დაამატე შენთვის საინტერესო ადგილები რჩეულებში.
          </p>
          <Link to="/explore" className="button-primary">
            აღმოაჩინე ადგილები <ArrowRight size={17} />
          </Link>
        </div>
      )}
    </main>
  );
}

function About() {
  return (
    <main className="about-page">
      <section className="page-hero">
        <span className="section-label">OUR STORY / DISCOVER GEORGIA</span>
        <h1>საქართველო,<br /><em>რომელიც უნდა იგრძნო.</em></h1>
        <p>პროექტი მათთვის, ვისაც სურს აღმოაჩინოს ქვეყნის ყველა კუთხის სილამაზე.</p>
      </section>

      <section className="about-story section-pad">
        <div className="about-image">
          <img
            src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1200"
            alt="საქართველოს ბუნება"
          />
        </div>

        <div>
          <span className="section-label">ჩვენი მიზანი</span>
          <h2>მოგზაურობა იწყება <em>აღმოჩენით.</em></h2>
          <p>
            Discover Georgia არის ციფრული გზამკვლევი, რომელიც საქართველოს
            ტურისტულ ადგილებს ერთ სივრცეში აერთიანებს. ჩვენი მიზანია,
            მოგზაურებს გავუმარტივოთ საინტერესო მიმართულებების აღმოჩენა,
            დაგეგმვა და ქვეყნის კულტურის გაცნობა.
          </p>
          <p>
            აქ შეხვდები მთებს, ტბებს, ჩანჩქერებს, ისტორიულ ძეგლებს,
            ქალაქებსა და კურორტებს — თითოეულს თავისი ისტორიითა და
            განსაკუთრებული ხასიათით.
          </p>
          <Link to="/explore" className="button-primary">
            აღმოაჩინე საქართველო <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>

      <section className="about-values section-pad">
        <span className="section-label">WHY DISCOVER GEORGIA</span>
        <h2>მეტი, ვიდრე <em>უბრალო რუკა.</em></h2>

        <div className="values-grid">
          <div>
            <Compass />
            <h3>აღმოჩენა</h3>
            <p>მრავალფეროვანი მიმართულებები ქვეყნის ყველა კუთხიდან.</p>
          </div>
          <div>
            <Info />
            <h3>ინფორმაცია</h3>
            <p>ადგილების აღწერა, საინტერესო ფაქტები და პრაქტიკული რჩევები.</p>
          </div>
          <div>
            <Heart />
            <h3>შენთვის</h3>
            <p>შეინახე საყვარელი ადგილები და დაგეგმე მომავალი მოგზაურობა.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("georgia-favorites") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("georgia-favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  return (
    <div className="app">
      <Navbar />

      <AnimatePresence mode="wait">
        <Routes>
          <Route
            path="/"
            element={
              <Home
                favorites={favorites}
                toggleFavorite={toggleFavorite}
              />
            }
          />

          <Route
            path="/explore"
            element={
              <Explore
                favorites={favorites}
                toggleFavorite={toggleFavorite}
              />
            }
          />

          <Route
            path="/destination/:id"
            element={
              <DestinationPage
                favorites={favorites}
                toggleFavorite={toggleFavorite}
              />
            }
          />

          <Route
            path="/favorites"
            element={
              <Favorites
                favorites={favorites}
                toggleFavorite={toggleFavorite}
              />
            }
          />

          <Route path="/about" element={<About />} />

          <Route
            path="*"
            element={
              <div className="not-found">
                <h1>გვერდი ვერ მოიძებნა</h1>
                <Link to="/" className="button-primary">
                  მთავარ გვერდზე დაბრუნება
                </Link>
              </div>
            }
          />
        </Routes>
      </AnimatePresence>

      <Footer />
    </div>
  );
}
