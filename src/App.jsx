import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";

import MarkerClusterGroup from "react-leaflet-cluster";

import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";

import L from "leaflet";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "./App.css";

import universities from "./data/universities.json";
import campusData from "./data/campuses.json";
import kykData from "./data/kyk-yurtlari.json";

// ==================================================
// LEAFLET
// ==================================================

const universityIcon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const selectedUniversityIcon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "selected-university-marker",
});


const mainCampusIcon = L.divIcon({
  className: "campus-marker main-campus",
  html: `<div style="background:#f59e0b; color:white; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(245,158,11,0.4); border: 2px solid white;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const subCampusIcon = L.divIcon({
  className: "campus-marker sub-campus",
  html: `<div style="background:#10b981; color:white; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(16,185,129,0.4); border: 2px solid white;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const kykKizIcon = L.divIcon({
  className: "kyk-marker kyk-kiz-marker",
  html: `<div class="kyk-marker-inner" style="background:#ec4899; color:white; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(236,72,153,0.4); border: 2px solid white;">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const kykErkekIcon = L.divIcon({
  className: "kyk-marker kyk-erkek-marker",
  html: `<div class="kyk-marker-inner" style="background:#3b82f6; color:white; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(59,130,246,0.4); border: 2px solid white;">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Haversine distance
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = (lat2 - lat1) * (Math.PI / 180);
  var dLon = (lon2 - lon1) * (Math.PI / 180);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}


const campusIcon = L.divIcon({
  className: "campus-map-marker",
  html: '<span class="campus-map-marker-dot">C</span>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});

// ==================================================
// HELPERS
// ==================================================

function normalize(str) {
  return (str || "")
    .toString()
    .toLowerCase()
    .replace(/i̇/g, "i")
    .replace(/İ/g, "i")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/â/g, "a")
    .replace(/î/g, "i")
    .replace(/û/g, "u")
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sameCity(firstCity, secondCity) {
  return normalize(firstCity) === normalize(secondCity);
}

function numberValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(
    String(value)
      .replace(/\./g, "")
      .replace(",", ".")
  );

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function coordinateValue(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(
    String(value).trim().replace(",", ".")
  );

  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumber(value) {
  const parsed = numberValue(value);

  if (parsed === null) {
    return "-";
  }

  return new Intl.NumberFormat("tr-TR").format(
    parsed
  );
}

// ==================================================
// MAP CONTROLLER
// ==================================================

function MapController({
  selectedUniversity,
  focusTarget,
}) {
  const map = useMap();
  const lastTargetRef = useRef(null);

  useEffect(() => {
    const target = focusTarget || selectedUniversity;

    const latitude = Number(target?.latitude);
    const longitude = Number(target?.longitude);
    const zoom = Number(target?.zoom) || (focusTarget ? 15 : 12);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return;
    }

    const nextTargetKey = `${latitude}|${longitude}|${zoom}`;

    if (lastTargetRef.current === nextTargetKey) {
      return;
    }

    lastTargetRef.current = nextTargetKey;

    // Fakülte/program geçişlerinde animasyonun haritayı kararsız
    // bırakmasını önlemek için doğrudan güvenli bir görünüm ayarlıyoruz.
    map.stop();
    map.setView([latitude, longitude], zoom, { animate: false });

    // Panel/overlay değişimlerinden sonra Leaflet boyutunu yeniden hesaplasın.
    requestAnimationFrame(() => {
      map.invalidateSize({ pan: false, debounceMoveend: true });
      window.setTimeout(() => {
        map.invalidateSize({ pan: false, debounceMoveend: true });
      }, 80);
      window.setTimeout(() => {
        map.invalidateSize({ pan: false, debounceMoveend: true });
      }, 350);
    });
  }, [focusTarget, selectedUniversity, map]);

  return null;
}

// ==================================================
// APP
// ==================================================

function App() {

  // ── SOSYAL KATMAN ──────────────────────────────────────────
  const [campusDetailTab, setCampusDetailTab] = useState('info');
  const [expandedUnits, setExpandedUnits] = useState({});
  const [reviewVotes, setReviewVotes] = useState({});
  const [qaVotes, setQaVotes] = useState({});
  const [selectedSubCampus, setSelectedSubCampus] = useState(null);

  useEffect(() => {
    setCampusDetailTab('info');
    setExpandedUnits({});
  }, [selectedSubCampus?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const getDirectionsUrl = (lat, lng) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    return isIOS
      ? `http://maps.apple.com/?daddr=${lat},${lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  };

  const MOCK_REVIEWS = [
    { id: 1, author: 'Elif K.', avatar: '👩‍🎓', rating: 5, date: 'Eylül 2025',
      text: 'Kampüs çok yeşil ve bakımlı. Kütüphane 7/24 açık, harika bir çalışma ortamı. Ulaşım biraz zor ama metro bekleniyor.' },
    { id: 2, author: 'Ahmet Y.', avatar: '👨‍🎓', rating: 4, date: 'Ağustos 2025',
      text: 'Sosyal olanaklar oldukça iyi. Yemekhane fiyatları öğrenci bütçesine uygun. Spor salonu yakın zamanda yenilendi.' },
    { id: 3, author: 'Zeynep M.', avatar: '👩‍💻', rating: 3, date: 'Temmuz 2025',
      text: 'Akademik kadro güçlü fakat bazı binalarda klima sorunu var. Staj imkanları için üniversite çok destek veriyor.' },
  ];

  const MOCK_QA = [
    {
      id: 1, votes: 12,
      question: 'Yurt başvurusu için son tarih ne zaman ve KYK yurt kapasitesi yeterli mi?',
      author: 'Mert T.', date: 'Eylül 2025',
      answers: [
        { id: 1, author: 'Eski Öğrenci', avatar: '🎓', votes: 8,
          text: 'KYK başvuruları genellikle Ağustos ortasında açılır. Yakındaki devlet yurdu kapasitesi 2000+ kişilik.' },
        { id: 2, author: 'Ayşe D.', avatar: '👩‍🏫', votes: 3,
          text: 'Özel yurtlar da mevcut, fiyatlar aylık 3000–6000 TL arası.' },
      ]
    },
    {
      id: 2, votes: 7,
      question: 'Kampüs içinde kafeterya dışında yemek alternatifleri var mı?',
      author: 'Selin A.', date: 'Ağustos 2025',
      answers: [
        { id: 1, author: 'Burak Ö.', avatar: '👨‍🍳', votes: 5,
          text: 'Merkez binada Starbucks lisanslı kafe ve birkaç küçük snack bar var.' },
      ]
    },
  ];
  // ──────────────────────────────────────────────────────────

  const [showKyk, setShowKyk] = useState(false);
  const [kykGenderFilter, setKykGenderFilter] = useState("Tümü");
  const [selectedKyk, setSelectedKyk] = useState(null);
  const [showAllCampuses, setShowAllCampuses] = useState(false);

  // ==================================================
  // STATE
  // ==================================================

  const [search, setSearch] =
    useState("");

  const [searchInput, setSearchInput] =
    useState("");

  const [searchPrograms, setSearchPrograms] =
    useState([]);

  const [searchProgramsLoaded, setSearchProgramsLoaded] =
    useState(false);

  const [loadingSearchPrograms, setLoadingSearchPrograms] =
    useState(false);

  const [searchResultLimit, setSearchResultLimit] =
    useState(15);

  useEffect(() => {
    const value = searchInput.trim();
    const timer = setTimeout(() => {
      setSearch(value);
    }, 280);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setSearchResultLimit(15);
  }, [search]);

  const [selectedUniversity, setSelectedUniversity] =
    useState(null);

  const [selectedProgram, setSelectedProgram] =
    useState(null);

  const [campusViewOpen, setCampusViewOpen] =
    useState(false);

  const [selectedCampus, setSelectedCampus] =
    useState(null);

  const [campusFocusOnly, setCampusFocusOnly] =
    useState(false);

  const [selectedCampusFaculty, setSelectedCampusFaculty] =
    useState(null);

  const [selectedCampusDepartment, setSelectedCampusDepartment] =
    useState(null);

  const [mapFocus, setMapFocus] =
    useState(null);

  const [universityPrograms, setUniversityPrograms] =
    useState([]);

  const [loadingUniversityPrograms, setLoadingUniversityPrograms] =
    useState(false);

  const [universityProgramSearch, setUniversityProgramSearch] =
    useState("");

  const [cityFilter, setCityFilter] =
    useState("Tümü");

  const [typeFilter, setTypeFilter] =
    useState("Tümü");

  const [educationFilter, setEducationFilter] =
    useState("Tümü");

  const [scoreFilter, setScoreFilter] =
    useState("Tümü");

  const [minRank, setMinRank] =
    useState("");

  const [maxRank, setMaxRank] =
    useState("");

  const mergedCampusData = useMemo(() => {
    const merged = {};

    Object.entries(campusData || {}).forEach(([key, record]) => {
      const normalizedKey = normalize(key);
      if (!normalizedKey) return;

      const campuses = Array.isArray(record?.campuses)
        ? record.campuses.map((campus, index) => ({
            ...campus,
            latitude: coordinateValue(campus?.latitude),
            longitude: coordinateValue(campus?.longitude),
            facultyNames: Array.isArray(campus?.facultyNames) ? campus.facultyNames : [],
            unitNames: Array.isArray(campus?.unitNames) ? campus.unitNames : [],
            unitAliases: Array.isArray(campus?.unitAliases) ? campus.unitAliases : [],
            programNames: Array.isArray(campus?.programNames) ? campus.programNames : [],
          }))
        : [];

      merged[normalizedKey] = {
        ...record,
        campuses,
      };
    });

    return merged;
  }, []);


  const [filtersOpen, setFiltersOpen] =
    useState(false);

  const [preferenceOpen, setPreferenceOpen] =
    useState(false);

  const [aboutOpen, setAboutOpen] =
    useState(false);

  const [browseOpen, setBrowseOpen] =
    useState(false);

  const [comparisonOpen, setComparisonOpen] =
    useState(false);

  const [preferences, setPreferences] =
    useState([]);

  const [preferencesLoaded, setPreferencesLoaded] =
    useState(false);

  const [comparisonPrograms, setComparisonPrograms] =
    useState([]);

  const [draggedPreferenceCode, setDraggedPreferenceCode] =
    useState(null);

  const [universitySheetTop, setUniversitySheetTop] =
    useState(null);

  const universitySheetDragRef = useRef({
    active: false,
    startY: 0,
    startTop: 0,
  });

  const getUniversitySheetBounds = useCallback(() => {
    const viewportHeight = window.innerHeight || 667;
    const collapsedTop = Math.min(
      Math.max(viewportHeight * 0.48, 260),
      430
    );
    const expandedTop = Math.max(
      104,
      Math.min(viewportHeight * 0.16, 150)
    );

    return {
      expandedTop,
      collapsedTop,
    };
  }, []);

  const startUniversitySheetDrag = (event) => {
    if (!selectedUniversity) return;

    const { collapsedTop } = getUniversitySheetBounds();
    const currentTop =
      universitySheetTop ?? collapsedTop;

    universitySheetDragRef.current = {
      active: true,
      startY: event.clientY,
      startTop: currentTop,
    };

    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  };

  const moveUniversitySheetDrag = (event) => {
    if (!universitySheetDragRef.current.active) return;

    const { expandedTop, collapsedTop } =
      getUniversitySheetBounds();

    const delta =
      event.clientY -
      universitySheetDragRef.current.startY;

    const nextTop = Math.min(
      collapsedTop,
      Math.max(
        expandedTop,
        universitySheetDragRef.current.startTop + delta
      )
    );

    setUniversitySheetTop(nextTop);
  };

  const endUniversitySheetDrag = () => {
    if (!universitySheetDragRef.current.active) return;

    universitySheetDragRef.current.active = false;

    const { expandedTop, collapsedTop } =
      getUniversitySheetBounds();
    const currentTop =
      universitySheetTop ?? collapsedTop;
    const middle =
      expandedTop + (collapsedTop - expandedTop) * 0.52;

    setUniversitySheetTop(
      currentTop < middle
        ? expandedTop
        : collapsedTop
    );
  };

  useEffect(() => {
    if (!selectedUniversity) {
      setUniversitySheetTop(null);
      return;
    }

    const { collapsedTop } =
      getUniversitySheetBounds();
    setUniversitySheetTop(collapsedTop);
  }, [selectedUniversity, getUniversitySheetBounds]);

  useEffect(() => {
    const handleResize = () => {
      if (!selectedUniversity) return;
      const { expandedTop, collapsedTop } =
        getUniversitySheetBounds();
      const currentTop =
        universitySheetTop ?? collapsedTop;
      setUniversitySheetTop(
        Math.min(
          collapsedTop,
          Math.max(expandedTop, currentTop)
        )
      );
    };

    window.addEventListener("resize", handleResize);
    return () =>
      window.removeEventListener("resize", handleResize);
  }, [selectedUniversity, universitySheetTop, getUniversitySheetBounds]);

  const blurSearch = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const applyQuickFilter = (kind) => {
    const values = {
      devlet: () => setTypeFilter("Devlet Üniversitesi"),
      vakif: () => setTypeFilter("Vakıf Üniversitesi"),
      lisans: () => setEducationFilter("Lisans"),
      onlisans: () => setEducationFilter("Önlisans"),
      tyt: () => setScoreFilter("TYT"),
      say: () => setScoreFilter("SAY"),
    };
    values[kind]?.();
  };

  const resetFilters = () => {
    setCityFilter("Tümü");
    setTypeFilter("Tümü");
    setEducationFilter("Tümü");
    setScoreFilter("Tümü");
    setMinRank("");
    setMaxRank("");
  };

  const toggleFloatingPanel = (panel) => {
    const isOpen =
      panel === "filters"
        ? filtersOpen
        : preferenceOpen;

    setFiltersOpen(false);
    setPreferenceOpen(false);
    setAboutOpen(false);
    setBrowseOpen(false);

    if (!isOpen) {
      if (panel === "filters") {
        setFiltersOpen(true);
      } else {
        setPreferenceOpen(true);
      }
    }
  };

  const goHome = () => {
    setFiltersOpen(false);
    setPreferenceOpen(false);
    setAboutOpen(false);
    setBrowseOpen(false);
    setSelectedProgram(null);
    setSelectedUniversity(null);
  };

  const openAbout = () => {
    setFiltersOpen(false);
    setPreferenceOpen(false);
    setBrowseOpen(false);
    setAboutOpen((open) => !open);
  };

  const openBrowse = () => {
    setFiltersOpen(false);
    setPreferenceOpen(false);
    setAboutOpen(false);
    setBrowseOpen(true);
  };

  const comparisonSummary =
    useMemo(() => {
      const ranks = comparisonPrograms
        .map((program) =>
          numberValue(
            program.successRank ?? program.basariSirasi
          )
        )
        .filter((rank) => rank !== null);

      const scores = comparisonPrograms
        .map((program) =>
          numberValue(
            program.minScore ?? program.minPuan
          )
        )
        .filter((score) => score !== null);

      return {
        lowestRank: ranks.length ? Math.min(...ranks) : null,
        highestRank: ranks.length ? Math.max(...ranks) : null,
        highestScore: scores.length ? Math.max(...scores) : null,
      };
    }, [comparisonPrograms]);

  const comparisonBest = useMemo(() => {
    const ranked = comparisonPrograms
      .map((program) => ({
        code: String(program.code),
        value: numberValue(
          program.successRank ??
          program.basariSirasi
        ),
      }))
      .filter((item) => item.value !== null);

    const minScores = comparisonPrograms
      .map((program) => ({
        code: String(program.code),
        value: numberValue(
          program.minScore ??
          program.minPuan
        ),
      }))
      .filter((item) => item.value !== null);

    const maxScores = comparisonPrograms
      .map((program) => ({
        code: String(program.code),
        value: numberValue(
          program.maxScore ??
          program.maxPuan
        ),
      }))
      .filter((item) => item.value !== null);

    const bestRank = ranked.length
      ? ranked.reduce((best, item) =>
          item.value < best.value ? item : best
        ).code
      : null;

    const bestMinScore = minScores.length
      ? minScores.reduce((best, item) =>
          item.value > best.value ? item : best
        ).code
      : null;

    const bestMaxScore = maxScores.length
      ? maxScores.reduce((best, item) =>
          item.value > best.value ? item : best
        ).code
      : null;

    return {
      bestRank,
      bestMinScore,
      bestMaxScore,
    };
  }, [comparisonPrograms]);

  // ==================================================
  // UNIVERSITY MAP
  // ==================================================

  const universityMap = useMemo(() => {
    const map = new Map();

    for (const university of universities) {
      map.set(university.id, university);
      map.set(String(university.id), university);
      map.set(normalize(university.name), university);
    }

    return map;
  }, []);

  // ==================================================
  // UNIVERSITIES WITH COORDINATES
  // ==================================================

  const mapUniversities = useMemo(() => {
    return universities.filter(
      (university) =>
        Number.isFinite(
          university.latitude
        ) &&
        Number.isFinite(
          university.longitude
        )
    );
  }, []);

  const browseUniversities = useMemo(() =>
    mapUniversities
      .slice()
      .sort((a, b) => {
        const cityCompare = (a.city || '').localeCompare(b.city || '', 'tr');
        if (cityCompare !== 0) return cityCompare;
        return (a.name || '').localeCompare(b.name || '', 'tr');
      })
      .slice(0, 18),
  [mapUniversities]);

  // ==================================================
  // CITIES
  // ==================================================

  const cities = useMemo(() => {
    const citySet = new Set();

    for (const university of mapUniversities) {
      if (university.city) {
        citySet.add(
          university.city
        );
      }
    }

    return [...citySet].sort(
      (a, b) =>
        a.localeCompare(
          b,
          "tr"
        )
    );
  }, [mapUniversities]);

  // ==================================================
  // UNIVERSITY TYPES
  // ==================================================

  const universityTypes =
    useMemo(() => {
      const typeSet = new Set();

      for (const university of mapUniversities) {
        if (university.type) {
          typeSet.add(
            university.type
          );
        }
      }

      return [...typeSet];
    }, [mapUniversities]);

  // ==================================================
  // LOAD SEARCH INDEX
  // ==================================================

  const loadSearchPrograms =
    useCallback(async () => {
      if (
        searchProgramsLoaded ||
        loadingSearchPrograms
      ) {
        return;
      }

      setLoadingSearchPrograms(true);

      try {
        const response =
          await fetch(
            "/programs-search.json"
          );

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}`
          );
        }

        const data =
          await response.json();

        setSearchPrograms(data);

        setSearchProgramsLoaded(true);
      } catch (error) {
        console.error(
          "Program arama indeksi yüklenemedi:",
          error
        );
      } finally {
        setLoadingSearchPrograms(false);
      }
    }, [
      searchProgramsLoaded,
      loadingSearchPrograms,
    ]);

  // ==================================================
  // BASE UNIVERSITY FILTER
  // ==================================================

  const baseFilteredUniversities =
    useMemo(() => {
      return mapUniversities.filter(
        (university) => {
          const cityMatch =
            cityFilter === "Tümü" ||
            sameCity(
              university.city,
              cityFilter
            );

          const typeMatch =
            typeFilter === "Tümü" ||
            university.type ===
              typeFilter;

          return (
            cityMatch &&
            typeMatch
          );
        }
      );
    }, [
      mapUniversities,
      cityFilter,
      typeFilter,
    ]);

  // ==================================================
  // GENERAL PROGRAM FILTER
  // ==================================================

  const generalFilteredPrograms =
    useMemo(() => {
      if (!searchProgramsLoaded) {
        return [];
      }

      const min =
        minRank === ""
          ? null
          : Number(minRank);

      const max =
        maxRank === ""
          ? null
          : Number(maxRank);

      return searchPrograms.filter(
        (program) => {
          const university = universityMap.get(String(program.universityId)) || universityMap.get(normalize(program.universityName));
          if (!university) {
            return false;
          }

          const cityMatch =
            cityFilter === "Tümü" ||
            sameCity(
              university.city,
              cityFilter
            );

          const typeMatch =
            typeFilter === "Tümü" ||
            university.type ===
              typeFilter;

          const duration =
            numberValue(
              program.duration
            );

          const education =
            duration === 2
              ? "Önlisans"
              : "Lisans";

          const educationMatch =
            educationFilter ===
              "Tümü" ||
            education ===
              educationFilter;

          const scoreMatch =
            scoreFilter === "Tümü" ||
            program.scoreType ===
              scoreFilter;

          const rank =
            numberValue(
              program.successRank
            );

          const minMatch =
            min === null ||
            (
              rank !== null &&
              rank >= min
            );

          const maxMatch =
            max === null ||
            (
              rank !== null &&
              rank <= max
            );

          return (
            cityMatch &&
            typeMatch &&
            educationMatch &&
            scoreMatch &&
            minMatch &&
            maxMatch
          );
        }
      );
    }, [
      searchPrograms,
      searchProgramsLoaded,
      universityMap,
      cityFilter,
      typeFilter,
      educationFilter,
      scoreFilter,
      minRank,
      maxRank,
    ]);

  // ==================================================
  // MAP UNIVERSITIES
  // ==================================================

  const filteredUniversities =
    useMemo(() => {
      const programFilterActive =
        educationFilter !==
          "Tümü" ||
        scoreFilter !==
          "Tümü" ||
        minRank !== "" ||
        maxRank !== "";

      if (!programFilterActive) {
        return baseFilteredUniversities;
      }

      if (
        !searchProgramsLoaded
      ) {
        return baseFilteredUniversities;
      }

      const ids =
        new Set(
          generalFilteredPrograms.map(
            (program) =>
              program.universityId
          )
        );

      return baseFilteredUniversities.filter(
        (university) =>
          ids.has(
            university.id
          )
      );
    }, [
      educationFilter,
      scoreFilter,
      minRank,
      maxRank,
      searchProgramsLoaded,
      generalFilteredPrograms,
      baseFilteredUniversities,
    ]);

  // ==================================================
  // SEARCH INDEX AUTO LOAD
  // ==================================================

  useEffect(() => {
    const query =
      normalize(search);

    if (
      query.length < 2 ||
      searchProgramsLoaded
    ) {
      return;
    }

    const universityExists =
      baseFilteredUniversities.some(
        (university) => {
          const name =
            normalize(
              university.name
            );

          const city =
            normalize(
              university.city
            );

          return (
            name.includes(query) ||
            city.includes(query)
          );
        }
      );

    // Üniversite bulunsa da bulunmasa da YKS program (ve kampüs) verilerini arkaplanda çekmeye başla
    if (search.length >= 2) {
      loadSearchPrograms();
    }
  }, [
    search,
    baseFilteredUniversities,
    searchProgramsLoaded,
    loadSearchPrograms,
  ]);
  // ==================================================
  // ÜNİVERSİTE İÇİNDE PROGRAMLAR
  // ==================================================

  const visibleUniversityPrograms =
    useMemo(() => {
      const query =
        normalize(
          universityProgramSearch
        );

      const min =
        minRank === ""
          ? null
          : Number(minRank);

      const max =
        maxRank === ""
          ? null
          : Number(maxRank);

      const normalized =
        universityPrograms.map(
          (program) => {
            const duration =
              numberValue(
                program.duration ??
                program.ogrenimSuresi
              );

            return {
              ...program,

              displayName:
                program.name ||
                program.programName ||
                program.birimAdi ||
                "Program adı bulunamadı",

              displayScoreType:
                program.scoreType ||
                program.puanTuru ||
                "-",

              displayEducation:
                duration === 2
                  ? "Önlisans"
                  : duration
                    ? "Lisans"
                    : (program.education ||
                        program.egitimTuru ||
                        "-"),

              displayDuration:
                program.duration ??
                program.ogrenimSuresi ??
                "-",

              displayQuota:
                program.quota ??
                program.kontenjan ??
                "-",

              displayPlaced:
                program.placed ??
                program.yerlesen ??
                "-",

              displayRank:
                program.successRank ??
                program.basariSirasi ??
                null,

              displayMinScore:
                program.minScore ??
                program.minPuan ??
                null,

              displayMaxScore:
                program.maxScore ??
                program.maxPuan ??
                null,

              displayFaculty:
                program.faculty ||
                program.fymkAdi ||
                program.birimAdi ||
                "-",
            };
          }
        );

      return normalized.filter(
        (program) => {
          const educationMatch =
            educationFilter === "Tümü" ||
            program.displayEducation ===
              educationFilter;

          const scoreMatch =
            scoreFilter === "Tümü" ||
            program.displayScoreType ===
              scoreFilter;

          const rank =
            numberValue(
              program.displayRank
            );

          const minMatch =
            min === null ||
            (rank !== null && rank >= min);

          const maxMatch =
            max === null ||
            (rank !== null && rank <= max);

          const searchMatch =
            !query ||
            normalize(
              program.displayName
            ).includes(query) ||
            normalize(
              program.displayScoreType
            ).includes(query) ||
            normalize(
              program.displayFaculty
            ).includes(query);

          return (
            educationMatch &&
            scoreMatch &&
            minMatch &&
            maxMatch &&
            searchMatch
          );
        }
      );
    }, [
      universityPrograms,
      universityProgramSearch,
      educationFilter,
      scoreFilter,
      minRank,
      maxRank,
    ]);
  // ==================================================
  // UNIVERSITY CAMPUSES / YERLEŞKELER
  // ==================================================

  const getUnitNames = useCallback((program) => {
    return [
      program.faculty,
      program.fymkAdi,
      program.facultyName,
      program.unitName,
      program.birimAdi,
      program.birim,
      program.yuksekokulAdi,
      program.meslekYuksekokulu,
    ]
      .map((value) => (value ?? "").toString().trim())
      .filter(Boolean);
  }, []);

  const getPrimaryUnitName = useCallback((program) => {
    return getUnitNames(program)[0] || "";
  }, [getUnitNames]);

  
  const allCampusesList = useMemo(() => {
    let list = [];
    Object.values(campusData).forEach(uniData => {
      if (uniData && uniData.campuses) {
        uniData.campuses.forEach(campus => {
          if (campus.latitude && campus.longitude && !isNaN(Number(campus.latitude)) && !isNaN(Number(campus.longitude))) {
            list.push({ ...campus, universityName: uniData.universityName });
          }
        });
      }
    });
    return list;
  }, []);

  const universityCampuses = useMemo(() => {
    if (!selectedUniversity) return [];

    const selectedId = String(selectedUniversity.id ?? '').trim();
    const selectedName = normalize(selectedUniversity.name);
    const stripParenthetical = (value) =>
      normalize(value).replace(/\s*\([^)]*\)\s*$/g, '').trim();

    // Önce üniversite ID'siyle buluyoruz. Böylece
    // "DOKUZ EYLÜL ÜNİVERSİTESİ" ile
    // "DOKUZ EYLÜL ÜNİVERSİTESİ (İZMİR)" gibi isim farkları
    // kampüs verisinin kaybolmasına neden olmaz.
    let record = Object.values(mergedCampusData).find((item) =>
      item && String(item.universityId ?? '').trim() === selectedId
    );

    // ID bulunamazsa tam ad, ardından parantez içi şehir kaldırılmış ad ile dene.
    if (!record) record = mergedCampusData[selectedName];
    if (!record) {
      const selectedBase = stripParenthetical(selectedUniversity.name);
      record = Object.values(mergedCampusData).find((item) =>
        stripParenthetical(item?.universityName) === selectedBase
      );
    }

    // Öncelik: üniversite için hazırlanmış gerçek kampüs verisi.
    if (record && Array.isArray(record.campuses) && record.campuses.length) {
      return record.campuses.map((campus, index) => ({
        ...campus,
        universityId: selectedUniversity.id,
        universityName: selectedUniversity.name,
        // Kampüs koordinatı yoksa üniversite koordinatına kopyalama yapma.
        // Aksi halde farklı kampüsler aynı noktaya üst üste biner ve
        // olmayan koordinatlar gerçekmiş gibi görünür.
        latitude: Number.isFinite(Number(campus.latitude))
          ? Number(campus.latitude)
          : null,
        longitude: Number.isFinite(Number(campus.longitude))
          ? Number(campus.longitude)
          : null,
        autoGenerated: campus.autoGenerated === true,
      }));
    }

    // Kampüs verisi henüz yoksa üniversiteyi yine de boş bırakma.
    // Program verilerinden fakülte/birimleri otomatik çıkarıp tek bir
    // "ana yerleşke" altında gösteriyoruz. Böylece bütün üniversitelerde
    // Kampüs → Fakülte → Bölüm → Program akışı kullanılabilir.
    const facultyMap = new Map();

    for (const program of universityPrograms) {
      const name = (
        program.fymkAdi ||
        program.faculty ||
        program.facultyName ||
        program.unitName ||
        program.birimAdi ||
        ""
      ).toString().trim();

      if (!name) continue;

      const id = normalize(name);
      if (!facultyMap.has(id)) facultyMap.set(id, name);
    }

    const latitude = Number(selectedUniversity.latitude);
    const longitude = Number(selectedUniversity.longitude);

    return [{
      id: `auto-${selectedUniversity.id}`,
      name: `${selectedUniversity.name} Ana Yerleşkesi`,
      universityId: selectedUniversity.id,
      universityName: selectedUniversity.name,
      city: selectedUniversity.city,
      district: "",
      address: "Program verilerinden otomatik oluşturuldu.",
      isMain: true,
      autoGenerated: true,
      latitude: Number.isFinite(latitude) ? latitude : null,
      longitude: Number.isFinite(longitude) ? longitude : null,
      facultyNames: [...facultyMap.values()].sort((a, b) =>
        a.localeCompare(b, "tr")
      ),
      unitNames: [],
      unitAliases: [],
      programNames: [],
    }];
  }, [selectedUniversity, universityPrograms, mergedCampusData]);

  const getCampusGroupNames = useCallback((campus) => {
    return [
      ...(Array.isArray(campus?.facultyNames) ? campus.facultyNames : []),
      ...(Array.isArray(campus?.unitNames) ? campus.unitNames : []),
      ...(Array.isArray(campus?.unitAliases) ? campus.unitAliases : []),
    ]
      .map((name) => (name ?? "").toString().trim())
      .filter(Boolean)
      .filter((name, index, arr) =>
        arr.findIndex((item) => normalize(item) === normalize(name)) === index
      );
  }, []);

  const getCampusProgramNames = useCallback((campus) => {
    return (Array.isArray(campus?.programNames) ? campus.programNames : [])
      .map((name) => (name ?? "").toString().trim())
      .filter(Boolean);
  }, []);

  const selectedCampusFacultyGroups = useMemo(() => {
    if (!selectedCampus || !universityPrograms.length) return [];

    const names = getCampusGroupNames(selectedCampus);

    return names.map((name) => {
      const target = normalize(name);
      const programs = universityPrograms.filter((program) => {
        const unitNames = getUnitNames(program).map(normalize).filter(Boolean);
        const programName = normalize(program?.name || program?.programName || program?.bolumAdi || "");

        const explicitProgramMatch = getCampusProgramNames(selectedCampus).some((name) =>
          normalize(name) === programName
        );

        if (explicitProgramMatch) return true;

        return unitNames.some((unitName) => unitName === target);
      });

      const departments = [...new Set(
        programs
          .map((program) => (
            program.department ||
            program.departmentName ||
            program.bolum ||
            program.bolumAdi ||
            ""
          ).toString().trim())
          .filter(Boolean)
      )].sort((a, b) => a.localeCompare(b, "tr"));

      return {
        id: target,
        name,
        programCount: programs.length,
        departments,
        programs,
      };
    }).filter((item) => item.programCount > 0 || item.departments.length > 0);
  }, [selectedCampus, universityPrograms, getCampusGroupNames, getUnitNames]);

  const selectedCampusFacultyPrograms = useMemo(() => {
    if (!selectedCampusFaculty) return [];

    // Fakülte grubu oluşturulurken açıkça eşleşen programları zaten taşıyoruz.
    // Önce bu hazır listeyi kullanarak program kaybını önlüyoruz.
    if (Array.isArray(selectedCampusFaculty.programs)) {
      return selectedCampusFaculty.programs;
    }

    const target = normalize(selectedCampusFaculty.id);
    return universityPrograms.filter((program) =>
      getUnitNames(program).some((unitName) => {
        const normalized = normalize(unitName);
        return normalized === target || normalized.includes(target) || target.includes(normalized);
      })
    );
  }, [selectedCampusFaculty, universityPrograms, getUnitNames]);

  const getProgramName = useCallback((program) => {
    return (
      program.name ||
      program.programName ||
      program.programAdi ||
      program.bolumAdi ||
      program.program ||
      program.birimAdi ||
      ""
    ).toString().trim();
  }, []);

  const getDepartmentName = useCallback((program) => {
    const explicitDepartment = (
      program.department ||
      program.departmentName ||
      program.bolum ||
      program.bolumAdi
    )?.toString().trim();

    if (explicitDepartment) {
      return explicitDepartment;
    }

    // YÖK program verilerinde her zaman ayrı bir "Bölüm" alanı bulunmuyor.
    // Bu durumda program adındaki parantez içi tercih/öğretim/indirim
    // varyasyonlarını çıkarıp temel bölüm adını kullanıyoruz.
    const programName = getProgramName(program);
    const departmentName = programName
      .replace(/\s*\([^)]*\)/g, "")
      .replace(/\s*[-–—]\s*[^-–—]*$/g, "")
      .replace(/\s+/g, " ")
      .trim();

    return departmentName || program.birimAdi?.toString().trim() || "Bölüm bilgisi bulunmuyor";
  }, [getProgramName]);

  const selectedCampusFacultyDepartments = useMemo(() => {
    if (!selectedCampusFaculty) return [];

    const groups = new Map();

    selectedCampusFacultyPrograms.forEach((program) => {
      const name = getDepartmentName(program);
      const id = normalize(name) || "bilinmeyen-bolum";

      if (!groups.has(id)) {
        groups.set(id, {
          id,
          name,
          programs: [],
        });
      }

      groups.get(id).programs.push(program);
    });

    return [...groups.values()].sort((a, b) =>
      a.name.localeCompare(b.name, "tr")
    );
  }, [selectedCampusFaculty, selectedCampusFacultyPrograms, getDepartmentName]);

  const selectedCampusDepartmentPrograms = useMemo(() => {
    if (!selectedCampusDepartment) return [];
    return selectedCampusFacultyPrograms.filter(
      (program) => normalize(getDepartmentName(program)) === selectedCampusDepartment.id
    );
  }, [selectedCampusDepartment, selectedCampusFacultyPrograms, getDepartmentName]);

  const findCampusForProgram = useCallback((program, university) => {
    const key = normalize(university?.name);
    const record = mergedCampusData[key];
    const campuses = Array.isArray(record?.campuses) ? record.campuses : [];
    if (!campuses.length) return null;

    // 0) Doğrudan campus_id eklenmişse (HIZLI EŞLEŞTİRME SİSTEMİ):
    if (program?.campus_id) {
       const exactCampus = campuses.find(c => c.id === program.campus_id);
       if (exactCampus) return { ...exactCampus, universityId: university.id, universityName: university.name };
    }

    const programUnits = getUnitNames(program).map(normalize).filter(Boolean);
    const programName = normalize(program?.name || program?.programName || program?.bolumAdi || "");

    // 1) En güvenli eşleşme: program adı açıkça kampüse atanmışsa onu kullan.
    if (programName) {
      const explicitProgramMatch = campuses.find((campus) =>
        getCampusProgramNames(campus).some((name) => normalize(name) === programName)
      );

      if (explicitProgramMatch) {
        return {
          ...explicitProgramMatch,
          universityId: university.id,
          universityName: university.name,
        };
      }
    }

    // 2) Sonra birim adı eşleşmesi: önce tam eşleşme, sonra kontrollü eşleşme.
    if (programUnits.length) {
      const exactUnitMatch = campuses.find((campus) =>
        getCampusGroupNames(campus).some((campusUnitName) =>
          programUnits.includes(normalize(campusUnitName))
        )
      );

      if (exactUnitMatch) {
        return {
          ...exactUnitMatch,
          universityId: university.id,
          universityName: university.name,
        };
      }

      const controlledUnitMatch = campuses.find((campus) =>
        getCampusGroupNames(campus).some((campusUnitName) => {
          const normalizedCampusUnit = normalize(campusUnitName);
          return programUnits.some((programUnit) => {
            const shorter = Math.min(normalizedCampusUnit.length, programUnit.length);
            const longer = Math.max(normalizedCampusUnit.length, programUnit.length);
            return shorter >= 12 && longer - shorter <= 10 &&
              (normalizedCampusUnit.startsWith(programUnit) || programUnit.startsWith(normalizedCampusUnit));
          });
        })
      );

      if (controlledUnitMatch) {
        return {
          ...controlledUnitMatch,
          universityId: university.id,
          universityName: university.name,
        };
      }
    }

    return campuses.find((campus) => campus.isMain) || campuses[0] || null;
  }, [getUnitNames, getCampusGroupNames, getCampusProgramNames, mergedCampusData]);

  // ==================================================
  // SEARCH RESULTS
  // ==================================================

  const searchResults =
    useMemo(() => {
      const query = normalize(search);
      if (!query || query.length < 2) return [];

      const tokens = query.split(/\s+/).filter(Boolean);
      const candidates = [];
      const joined = (...parts) => normalize(parts.filter(Boolean).join(" "));

      const match = (text) => {
        const value = normalize(text);
        if (!value || !tokens.every((token) => value.includes(token))) {
          return { matched: false, score: 0 };
        }
        let score = 50 + Math.min(tokens.length, 6) * 4;
        if (value === query) score = 130;
        else if (value.startsWith(query)) score = 108;
        else if (value.includes(query)) score = 92;
        return { matched: true, score };
      };

      for (const university of baseFilteredUniversities) {
        const hit = match(joined(university.name, university.city));
        if (hit.matched) {
          const name = normalize(university.name);
          let score = hit.score;
          if (name === query) score += 35;
          else if (name.startsWith(query)) score += 22;
          candidates.push({ type: "university", university, score });
        }

        // KAMPÜS (YERLEŞKE) ARAMASI
        const uniData = mergedCampusData[normalize(university.name)];
        if (uniData && uniData.campuses) {
          for (const campus of uniData.campuses) {
            const cHit = match(joined(campus.name, campus.district, university.name, university.city));
            if (cHit.matched) {
              const cName = normalize(campus.name);
              let score = cHit.score + 10;
              if (cName === query) score += 60;
              else if (cName.startsWith(query)) score += 30;
              candidates.push({ type: "campus", university, campus, score });
            }
          }
        }
      }

      if (searchProgramsLoaded) {
        for (const program of generalFilteredPrograms) {
          // Önce ID ile, bulamazsa program.universityName ile üniversiteyi bul
          const university = universityMap.get(String(program.universityId)) || universityMap.get(normalize(program.universityName));
          if (!university) {
            continue;
          }
          const hit = match(joined(program.name, program.faculty, program.universityName, university.city));
          if (!hit.matched) continue;
          const programName = normalize(program.name);
          const universityName = normalize(program.universityName);
          let score = hit.score;
          if (programName === query) score += 70;
          else if (programName.startsWith(query)) score += 42;
          else if (programName.includes(query)) score += 26;
          if (universityName.includes(query)) score += 18;
          candidates.push({ type: "program", university, program, score });
        }
      }

      candidates.sort((a,b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.type !== b.type) return a.type === "program" ? -1 : 1;
        const an = normalize(a.type === "program" ? a.program.name : a.university.name);
        const bn = normalize(b.type === "program" ? b.program.name : b.university.name);
        return an.localeCompare(bn, "tr");
      });

      return candidates;
    }, [search, baseFilteredUniversities, searchProgramsLoaded, generalFilteredPrograms, universityMap]);

  const visibleSearchResults = useMemo(
    () => searchResults.slice(0, searchResultLimit),
    [searchResults, searchResultLimit]
  );

  // ==================================================
  // LOAD UNIVERSITY PROGRAMS
  // ==================================================

  const loadUniversityPrograms =
    useCallback(
      async (universityId) => {
        setLoadingUniversityPrograms(
          true
        );

        try {
          const response =
            await fetch(
              `/programs/${universityId}.json?v=` + Date.now()
            );

          if (!response.ok) {
            throw new Error(
              `HTTP ${response.status}`
            );
          }

          const data =
            await response.json();

          setUniversityPrograms(
            Array.isArray(data)
              ? data
              : []
          );

          return Array.isArray(
            data
          )
            ? data
            : [];
        } catch (error) {
          console.error(
            "Üniversite programları yüklenemedi:",
            error
          );

          setUniversityPrograms(
            []
          );

          return [];
        } finally {
          setLoadingUniversityPrograms(
            false
          );
        }
      },
      []
    );

  // ==================================================
  // OPEN UNIVERSITY
  // ==================================================

  const openUniversity =
    useCallback(
      async (university) => {
        setFiltersOpen(false);
        setPreferenceOpen(false);
        setAboutOpen(false);
        setBrowseOpen(false);

        setSelectedUniversity(university);
        setSelectedProgram(null);
        setCampusFocusOnly(false);
        setCampusViewOpen(false);
        setSelectedCampus(null);
        setSelectedCampusFaculty(null);
        setMapFocus(null);
        setUniversityProgramSearch("");
        setUniversityPrograms([]);

        await loadUniversityPrograms(university.id);
      },
      [loadUniversityPrograms]
    );

  // ==================================================
  // OPEN PROGRAM
  // ==================================================

  const openProgram =
    useCallback(
      async (program, university) => {
        const data = await loadUniversityPrograms(university.id);

        const fullProgram =
          data.find(
            (item) => String(item.code) === String(program.code)
          ) || program;

        const campus = findCampusForProgram(fullProgram, university);

        setSelectedUniversity(university);
        setCampusViewOpen(false);
        setCampusFocusOnly(false);
        setSelectedCampus(campus);
        setSelectedCampusFaculty(null);

        setMapFocus(
          campus
            ? {
                latitude: campus.latitude,
                longitude: campus.longitude,
                zoom: 15,
              }
            : {
                latitude: university.latitude,
                longitude: university.longitude,
                zoom: 13,
              }
        );

        setSelectedProgram(fullProgram);
        setUniversityProgramSearch("");
      },
      [loadUniversityPrograms, findCampusForProgram]
    );

  // ==================================================
  // CAMPUS VIEW ACTIONS
  // ==================================================

  const openCampusView = () => {
    setSelectedProgram(null);
    setSelectedCampus(null);
    setSelectedCampusFaculty(null);
    setSelectedCampusDepartment(null);
    setCampusViewOpen(true);
    setUniversityProgramSearch("");
    setMapFocus({
      latitude: selectedUniversity?.latitude,
      longitude: selectedUniversity?.longitude,
      zoom: 12,
    });
    // Mobilde haritayı görebilmek için paneli aşağıya (küçük boyuta) çek
    if (window.innerWidth <= 800) {
      setUniversitySheetTop(window.innerHeight - 150);
    }
  };

  const openCampus = (campus) => {
    setCampusFocusOnly(false);
    setSelectedCampus(campus);
    setSelectedCampusFaculty(null);
    setSelectedCampusDepartment(null);
    setCampusViewOpen(true);
    setSelectedProgram(null);
    setUniversityProgramSearch("");

    if (Number.isFinite(Number(campus.latitude)) && Number.isFinite(Number(campus.longitude))) {
      setMapFocus({
        latitude: Number(campus.latitude),
        longitude: Number(campus.longitude),
        zoom: 15,
      });
    } else {
      setMapFocus({
        latitude: selectedUniversity?.latitude,
        longitude: selectedUniversity?.longitude,
        zoom: 13,
      });
    }
  };

  const openCampusFaculty = (faculty) => {
    setSelectedCampusFaculty(faculty);
    setSelectedCampusDepartment(null);
    setSelectedProgram(null);
    setUniversityProgramSearch("");
  };

  const openCampusDepartment = (department) => {
    setSelectedCampusDepartment(department);
    setSelectedProgram(null);
    setUniversityProgramSearch("");
  };

  const focusSelectedProgramCampus = () => {
    setSelectedProgram(null);
    if (window.innerWidth <= 800) {
      setUniversitySheetTop(window.innerHeight - 150);
    }
    const latitude = Number(selectedCampus?.latitude);
    const longitude = Number(selectedCampus?.longitude);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180
    ) {
      return;
    }

    setCampusFocusOnly(true);
    setCampusViewOpen(false);
    setMapFocus({
      latitude,
      longitude,
      zoom: 16,
    });
  };

  const closeUniversityPanel = () => {
    setSelectedUniversity(null);
    setSelectedProgram(null);
    setCampusFocusOnly(false);
    setSelectedCampus(null);
    setUniversityPrograms([]);
    setCampusViewOpen(false);
    setSelectedCampus(null);
    setSelectedCampusFaculty(null);
    setMapFocus(null);
    setUniversityProgramSearch("");
  };

  // ==================================================
  // NORMALIZE PREFERENCE DATA
  // ==================================================

  const normalizeProgram =
    (program) => ({
      ...program,

      displayName:
        program.name ||
        program.programName ||
        program.birimAdi ||
        "Program",

      displayUniversity:
        program.universityName ||
        program.university ||
        "-",

      displayScore:
        program.scoreType ||
        program.puanTuru ||
        "-",

      displayDuration:
        program.duration ??
        program.ogrenimSuresi ??
        "-",

      displayQuota:
        program.quota ??
        program.kontenjan ??
        "-",

      displayRank:
        program.successRank ??
        program.basariSirasi ??
        null,

      displayMinScore:
        program.minScore ??
        program.minPuan ??
        null,

      displayMaxScore:
        program.maxScore ??
        program.maxPuan ??
        null,

      displayPlaced:
        program.placed ??
        program.yerlesen ??
        "-",

      displayFaculty:
        program.faculty ||
        program.fymkAdi ||
        "-"
    });

  // ==================================================
  // PREFERENCE LIST
  // ==================================================

  const preferenceCodes =
    useMemo(
      () =>
        new Set(
          preferences.map(
            (program) =>
              String(
                program.code
              )
          )
        ),
      [preferences]
    );

  const isInPreferences =
    (program) =>
      preferenceCodes.has(
        String(program.code)
      );

  const addToPreferences =
    (program) => {
      const normalized =
        normalizeProgram(
          program
        );

      setPreferences(
        (current) => {
          if (
            current.some(
              (item) =>
                String(
                  item.code
                ) ===
                String(
                  normalized.code
                )
            )
          ) {
            return current;
          }

          if (current.length >= 24) {
            alert(
              "En fazla 24 tercih ekleyebilirsiniz."
            );

            return current;
          }

          return [
            ...current,
            normalized,
          ];
        }
      );
    };

  const movePreference =
    (sourceCode, targetCode) => {
      if (
        !sourceCode ||
        !targetCode ||
        String(sourceCode) === String(targetCode)
      ) {
        return;
      }

      setPreferences((current) => {
        const fromIndex = current.findIndex(
          (program) => String(program.code) === String(sourceCode)
        );
        const toIndex = current.findIndex(
          (program) => String(program.code) === String(targetCode)
        );

        if (fromIndex < 0 || toIndex < 0) {
          return current;
        }

        const next = [...current];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      });
    };

  const removeFromPreferences =
    (code) => {
      setPreferences(
        (current) =>
          current.filter(
            (program) =>
              String(
                program.code
              ) !==
              String(code)
          )
      );

      setComparisonPrograms(
        (current) =>
          current.filter(
            (program) =>
              String(
                program.code
              ) !==
              String(code)
          )
      );
    };

  // ==================================================
  // MOVE PREFERENCE UP
  // ==================================================

  const movePreferenceUp =
    (index) => {
      if (index <= 0) {
        return;
      }

      setPreferences(
        (current) => {
          const next = [
            ...current,
          ];

          const temp =
            next[index - 1];

          next[index - 1] =
            next[index];

          next[index] =
            temp;

          return next;
        }
      );
    };

  // ==================================================
  // MOVE PREFERENCE DOWN
  // ==================================================

  const movePreferenceDown =
    (index) => {
      setPreferences(
        (current) => {
          if (
            index >=
            current.length - 1
          ) {
            return current;
          }

          const next = [
            ...current,
          ];

          const temp =
            next[index + 1];

          next[index + 1] =
            next[index];

          next[index] =
            temp;

          return next;
        }
      );
    };

  // ==================================================
  // COMPARISON
  // ==================================================

  const isInComparison =
    (program) =>
      comparisonPrograms.some(
        (item) =>
          String(
            item.code
          ) ===
          String(
            program.code
          )
      );

  const toggleComparison =
    (program) => {
      setComparisonPrograms(
        (current) => {
          if (
            current.some(
              (item) =>
                String(
                  item.code
                ) ===
                String(
                  program.code
                )
            )
          ) {
            return current.filter(
              (item) =>
                String(
                  item.code
                ) !==
                String(
                  program.code
                )
            );
          }

          if (
            current.length >=
            3
          ) {
            alert(
              "En fazla 3 program karşılaştırabilirsiniz."
            );

            return current;
          }

          return [
            ...current,
            normalizeProgram(
              program
            ),
          ];
        }
      );
    };

  // ==================================================
  // LOCAL STORAGE
  // ==================================================

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          "universite-tercih-listesi"
        );

      if (saved) {
        const parsed = JSON.parse(saved);

        setPreferences(
          Array.isArray(parsed)
            ? parsed.slice(0, 24)
            : []
        );
      }
    } catch {
      // boş bırak
    } finally {
      setPreferencesLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) {
      return;
    }

    try {
      localStorage.setItem(
        "universite-tercih-listesi",
        JSON.stringify(
          preferences
        )
      );
    } catch {
      // boş bırak
    }
  }, [preferences, preferencesLoaded]);

  // ==================================================
  // UI
  // ==================================================
const activeFilterCount = [
  cityFilter !== "Tümü",
  typeFilter !== "Tümü",
  educationFilter !== "Tümü",
  scoreFilter !== "Tümü",
  minRank !== "",
  maxRank !== "",
].filter(Boolean).length;
  const isAnyModalOpen = (selectedUniversity !== null) || (selectedProgram !== null) || (selectedKyk !== null) || (filtersOpen === true) || (selectedSubCampus !== null) || (preferenceOpen === true) || (browseOpen === true) || (aboutOpen === true);
  return (
    <div className="app">

      {/* ========================================
          HEADER
      ======================================== */}

      
      {/* ========================================
          UNIFIED MOBILE & DESKTOP HEADER
      ======================================== */}
      <header className="header-unified" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000, background: 'rgba(255, 255, 255, 0.94)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: 'max(12px, env(safe-area-inset-top)) 16px 12px 16px', display: 'flex', flexDirection: 'column', gap: '12px', pointerEvents: 'auto' }}>
        
        {/* Satır 1: Başlık */}
        <div className="logo-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '22px' }}>🎓</span> Türkiye Üniversite Haritası
          </h1>
        </div>

        {/* Satır 2: Arama */}
        <div className="search-row">
          <input
            type="text"
            placeholder="🔎 Üniversite, bölüm veya şehir ara..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            style={{ width: '100%', height: '44px', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '0 16px', background: '#f1f5f9', color: '#334155', outline: 'none', fontSize: '16px' }}
          />
        </div>

        {/* Satır 3: Hızlı Keşfet ve Filtreler */}
        <div className="filters-row hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          
          <button 
            className={`pill-btn ${showAllCampuses ? 'active' : ''}`}
            onClick={() => setShowAllCampuses(!showAllCampuses)}>
            📍 Tüm Yerleşkeler
          </button>

          <button 
            className={`pill-btn ${showKyk ? 'active' : ''}`}
            onClick={() => setShowKyk(!showKyk)}>
            🏕️ KYK Yurtları
          </button>

          <button 
            className={`pill-btn ${typeFilter === 'Devlet Üniversitesi' ? 'active' : ''}`}
            onClick={() => setTypeFilter(typeFilter === 'Devlet Üniversitesi' ? 'Tümü' : 'Devlet Üniversitesi')}>
            Devlet
          </button>

          <button 
            className={`pill-btn ${typeFilter === 'Vakıf Üniversitesi' ? 'active' : ''}`}
            onClick={() => setTypeFilter(typeFilter === 'Vakıf Üniversitesi' ? 'Tümü' : 'Vakıf Üniversitesi')}>
            Vakıf
          </button>

          <button 
            className={`pill-btn ${educationFilter === 'Lisans' ? 'active' : ''}`}
            onClick={() => setEducationFilter(educationFilter === 'Lisans' ? 'Tümü' : 'Lisans')}>
            Lisans
          </button>

          <button 
            className={`pill-btn ${educationFilter === 'Önlisans' ? 'active' : ''}`}
            onClick={() => setEducationFilter(educationFilter === 'Önlisans' ? 'Tümü' : 'Önlisans')}>
            Önlisans
          </button>

          <button 
            className="pill-btn"
            style={{ background: '#f8fafc' }}
            onClick={() => setFiltersOpen(true)}>
            ⚙ Detaylı Filtre
          </button>

        </div>
      </header>

      {/* ========================================
          MAP
      ======================================== */}
      <main className="map-area-unified" style={{ position: 'absolute', inset: 0, width: '100vw', height: '100dvh', zIndex: 10 }}>
        <MapContainer
          center={[
            39.0,
            35.0,
          ]}
          zoom={7}
          className="map"
        >

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController
            selectedUniversity={selectedUniversity}
            focusTarget={mapFocus}
          />

          {campusFocusOnly &&
          selectedCampus &&
          Number.isFinite(Number(selectedCampus.latitude)) &&
          Number.isFinite(Number(selectedCampus.longitude)) ? (
            <Marker
              key={`program-campus-${selectedCampus.id}`}
              position={[Number(selectedCampus.latitude), Number(selectedCampus.longitude)]}
              icon={campusIcon}
              eventHandlers={{ click: () => openCampus(selectedCampus) }}
            >
              <Tooltip direction="top" offset={[0, -18]} opacity={0.95}>
                <span className="campus-tooltip">{selectedCampus.name}</span>
              </Tooltip>
              <Popup>
                <div className="campus-popup">
                  <div className="detail-label">{selectedCampus.isMain ? "ANA YERLEŞKE" : "YERLEŞKE"}</div>
                  <h3>{selectedCampus.name}</h3>
                  <p>{selectedCampus.district ? `${selectedCampus.district}, ${selectedCampus.city}` : selectedCampus.city}</p>
                  <button className="open-university-button" onClick={() => openCampus(selectedCampus)}>
                    Yerleşkeyi incele
                  </button>
                </div>
              </Popup>
            </Marker>
          ) : !campusViewOpen ? (
            showAllCampuses ? (
              <MarkerClusterGroup
                chunkedLoading={true}
                maxClusterRadius={70}
                spiderfyOnMaxZoom={true}
                showCoverageOnHover={false}
                zoomToBoundsOnClick={true}
                disableClusteringAtZoom={13}
              >
                {allCampusesList.map(campus => (
                   <Marker 
                      key={campus.id} 
                      position={[Number(campus.latitude), Number(campus.longitude)]} 
                      icon={campus.isMain ? mainCampusIcon : subCampusIcon} 
                      eventHandlers={{ click: () => setSelectedSubCampus(campus) }}
                   >
                      <Tooltip direction="top" offset={[0, -18]} opacity={0.95} sticky>
                         <span className="university-tooltip"><strong>{campus.universityName}</strong><br/>{campus.name}</span>
                      </Tooltip>
                   </Marker>
                ))}
              </MarkerClusterGroup>
            ) : (
<MarkerClusterGroup
              chunkedLoading={true}
              maxClusterRadius={70}
              spiderfyOnMaxZoom={true}
              showCoverageOnHover={false}
              zoomToBoundsOnClick={true}
              disableClusteringAtZoom={12}
            >
              {filteredUniversities.map((university) => (
                <Marker
                  key={university.id}
                  position={[university.latitude, university.longitude]}
                  icon={selectedUniversity?.id === university.id ? selectedUniversityIcon : universityIcon}
                >
                  <Tooltip direction="top" offset={[0, -35]} opacity={0.95} sticky>
                    <span className="university-tooltip">{university.name}</span>
                  </Tooltip>

                  <Popup>
                    <div className="popup">
                      <h2>{university.name}</h2>
                      <p><strong>Şehir:</strong> {university.city}</p>
                      <p><strong>Tür:</strong> {university.type}</p>
                      <button className="open-university-button" onClick={() => openUniversity(university)}>
                        Üniversiteyi incele
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
            )
          ) : (
            selectedUniversity &&
            universityCampuses
              .filter((campus) =>
                Number.isFinite(Number(campus.latitude)) &&
                Number.isFinite(Number(campus.longitude))
              )
              .map((campus, index) => (
              <Marker
                key={`campus-${campus.id}`}
                position={[Number(campus.latitude), Number(campus.longitude)]}
                icon={campusIcon}
                eventHandlers={{ click: () => openCampus(campus) }}
              >
                <Tooltip direction="top" offset={[0, -18]} opacity={0.95}>
                  <span className="campus-tooltip">{campus.name}</span>
                </Tooltip>
                <Popup>
                  <div className="campus-popup">
                    <div className="detail-label">{campus.isMain ? "ANA YERLEŞKE" : "YERLEŞKE"}</div>
                    <h3>{campus.name}</h3>
                    <p>{campus.district ? `${campus.district}, ${campus.city}` : campus.city}</p>
                    <button className="open-university-button" onClick={() => openCampus(campus)}>
                      Yerleşkeyi incele
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))
          )}

        
          {showKyk && (
            <MarkerClusterGroup
              chunkedLoading={true}
              maxClusterRadius={50}
              spiderfyOnMaxZoom={true}
              showCoverageOnHover={false}
              zoomToBoundsOnClick={true}
              disableClusteringAtZoom={13}
            >
              {kykData
                .filter(kyk => kykGenderFilter === "Tümü" || kyk.gender === kykGenderFilter)
                .map(kyk => (
                  <Marker
                    key={`kyk-${kyk.id}`}
                    position={[kyk.coordinates.lat, kyk.coordinates.lng]}
                    icon={kyk.gender === "Kız" ? kykKizIcon : kykErkekIcon}
                    eventHandlers={{ click: () => setSelectedKyk(kyk) }}
                  >
                    <Tooltip direction="top" offset={[0, -18]} opacity={0.95}>
                      <span className="kyk-tooltip">{kyk.name} ({kyk.gender})</span>
                    </Tooltip>
                  </Marker>
              ))}
            </MarkerClusterGroup>
          )}

</MapContainer>

        {browseOpen && (
          <aside className="browse-panel">
            
            <div className="browse-panel-header">
              <div>
                <div className="detail-label">ÜNİVERSİTELER</div>
                <h2>Üniversiteleri keşfet</h2>
              </div>
              <button className="close-button" onClick={() => setBrowseOpen(false)}>✕</button>
            </div>
            <p className="browse-intro">Şehrini seç, haritadaki üniversitelere hızlıca göz at ve detaylarını aç.</p>
            <div className="browse-grid">
              {browseUniversities.map((university) => (
                <button
                  key={university.id}
                  className="browse-card"
                  type="button"
                  onClick={() => {
                    openUniversity(university);
                    setBrowseOpen(false);
                  }}
                >
                  <span className="browse-card-icon">🎓</span>
                  <span>
                    <strong>{university.name}</strong>
                    <small>{university.city} · {university.type || "Üniversite"}</small>
                  </span>
                  <b>→</b>
                </button>
              ))}
            </div>
          </aside>
        )}

        {aboutOpen && (
          <aside className="about-panel">
            <div className="about-panel-header">
              <div>
                <div className="detail-label">HAKKINDA</div>
                <h2>Türkiye Üniversite Haritası</h2>
              </div>
              <button className="close-button" onClick={() => setAboutOpen(false)}>✕</button>
            </div>
            <div className="about-hero">
              <span>✦</span>
              <div>
                <strong>Doğru bölümü bul. Şehrini seç. Tercihini oluştur.</strong>
                <p>Türkiye’deki üniversiteleri ve 2026 programlarını tek bir harita üzerinde keşfetmek için tasarlandı.</p>
              </div>
            </div>
            <div className="about-stats">
              <div><strong>205</strong><span>Haritadaki üniversite</span></div>
              <div><strong>21.493+</strong><span>Program verisi</span></div>
              <div><strong>2026</strong><span>Güncel tercih yılı</span></div>
            </div>
            <div className="about-text">
              <p>Bu platformun amacı; öğrencilerin üniversite, şehir ve bölüm seçeneklerini daha anlaşılır bir şekilde keşfetmesine yardımcı olmak.</p>
              <p>Program detaylarını inceleyebilir, filtreleyebilir, karşılaştırabilir ve kendi tercih listeni oluşturabilirsin.</p>
            </div>
            <div className="about-note">
              <span>💙</span>
              <strong>Gençler için sade, hızlı ve yol gösteren bir tercih deneyimi.</strong>
            </div>
          </aside>
        )}

        {/* =====================================
            UNIVERSITY PANEL
        ===================================== */}

        {selectedUniversity &&
          !selectedProgram && (

          <aside
            className="university-panel"
            style={{
              "--university-sheet-top": `${
                universitySheetTop ??
                getUniversitySheetBounds().collapsedTop
              }px`,
            }}
          >

            <div
              className="university-sheet-handle"
              onPointerDown={startUniversitySheetDrag}
              onPointerMove={moveUniversitySheetDrag}
              onPointerUp={endUniversitySheetDrag}
              onPointerCancel={endUniversitySheetDrag}
              role="slider"
              aria-label="Üniversite panelini yukarı veya aşağı taşı"
              aria-valuemin={getUniversitySheetBounds().expandedTop}
              aria-valuemax={getUniversitySheetBounds().collapsedTop}
              tabIndex={0}
            />

            <button
              className="close-button"
              onClick={closeUniversityPanel}
            >
              ✕
            </button>
            <div className="university-scrollable-content">


            <div className="university-panel-header">
              <div className="detail-label">ÜNİVERSİTE</div>
              <h2>{selectedUniversity.name}</h2>
              <p>{selectedUniversity.city} • {selectedUniversity.type}</p>
            </div>

            {loadingUniversityPrograms ? (
              <div className="program-loading-box">
                <div className="loading-spinner" />
                <p>Programlar yükleniyor...</p>
              </div>
            ) : (
              <>
                <div className="university-stats">
                  <div className="university-stat">
                    <strong>{universityPrograms.length}</strong>
                    <span>Program</span>
                  </div>
                  <div className="university-stat">
                    <strong>{selectedUniversity.type?.includes("Vakıf") ? "Vakıf" : "Devlet"}</strong>
                    <span>Kurum</span>
                  </div>
                  <div className="university-stat">
                    <strong>{universityCampuses.length || "-"}</strong>
                    <span>Yerleşke</span>
                  </div>
                </div>

                <div className="university-view-switch">
                  {campusViewOpen ? (
                    <button
                      type="button"
                      className="university-view-button active"
                      onClick={() => {
                        setCampusViewOpen(false);
                        setSelectedCampus(null);
                        setSelectedCampusFaculty(null);
                        setMapFocus({
                          latitude: selectedUniversity.latitude,
                          longitude: selectedUniversity.longitude,
                          zoom: 12,
                        });
                      }}
                    >
                      ← Programlara dön
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="university-view-button"
                      onClick={openCampusView}
                    >
                      📍 Kampüsleri / Yerleşkeleri Göster
                    </button>
                  )}
                </div>

                {!campusViewOpen ? (
                  <>
                    <div className="university-program-header">
                      <h3>Programlar</h3>
                      <span>{visibleUniversityPrograms.length}</span>
                    </div>

                    <div className="university-action-bar">
                      <button
                        type="button"
                        className="university-action-button preference"
                        onClick={() => {
                          setSelectedProgram(null);
                          setPreferenceOpen(true);
                          setFiltersOpen(false);
                        }}
                      >
                        ⭐ Tercih Listem <b>{preferences.length}</b>
                      </button>

                      <button
                        type="button"
                        className="university-action-button compare"
                        disabled={comparisonPrograms.length < 2}
                        onClick={() => setComparisonOpen(true)}
                        title={comparisonPrograms.length < 2 ? "Karşılaştırmak için en az 2 program seçin" : "Seçili programları karşılaştır"}
                      >
                        ⇄ Karşılaştır <b>{comparisonPrograms.length}</b>
                      </button>
                    </div>

                    <input
                      className="university-program-search"
                      type="text"
                      placeholder="🔎 Bu üniversitede program ara..."
                      value={universityProgramSearch}
                      onChange={(event) => setUniversityProgramSearch(event.target.value)}
                    />

                    <div className="university-program-list">
                      {visibleUniversityPrograms.length > 0 ? (
                        visibleUniversityPrograms.map((program) => {
                          const normalized = normalizeProgram(program);

                          return (
                            <div key={program.code} className="university-program-item">
                              <button
                                className="university-program-main"
                                onClick={() => openProgram(program, selectedUniversity)}
                              >
                                <strong>{normalized.displayName}</strong>
                                <span>{normalized.displayScore} • {normalized.displayDuration} yıl</span>
                                <small>
                                  TBS: {formatNumber(normalized.displayRank)} • Kontenjan: {normalized.displayQuota}
                                </small>
                              </button>

                              <div className="program-card-actions">
                                <button
                                  type="button"
                                  className={isInPreferences(normalized) ? "program-add-button added" : "program-add-button"}
                                  onClick={() => addToPreferences(normalized)}
                                  title={isInPreferences(normalized) ? "Tercih listesinde" : "Tercih listesine ekle"}
                                >
                                  {isInPreferences(normalized) ? "✓" : "⭐"}
                                </button>

                                <button
                                  type="button"
                                  className={isInComparison(normalized) ? "program-compare-button selected" : "program-compare-button"}
                                  onClick={() => toggleComparison(normalized)}
                                  title={isInComparison(normalized) ? "Karşılaştırmadan çıkar" : "Karşılaştırmaya ekle"}
                                >
                                  {isInComparison(normalized) ? "✓" : "⇄"}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="empty-programs">Program bulunamadı.</div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="campus-view-heading">
                      <div>
                        <div className="detail-label">KAMPÜSLER / YERLEŞKELER</div>
                        <h3>{selectedCampus?.name || "Üniversite Kampüsleri"}</h3>
                        <p>
                          {selectedCampus
                            ? "Bu yerleşkedeki fakülteleri ve programları incele."
                            : "Bir yerleşke seç, haritada konumuna git ve o yerleşkedeki fakülteleri gör."}
                        </p>
                      </div>
                      <span>{universityCampuses.length}</span>
                    </div>

                    <div className="university-campus-list">
                      {!selectedCampus ? (
                        universityCampuses.length > 0 ? (
                          universityCampuses.map((campus, index) => (
                            <button
                              type="button"
                              key={campus.id}
                              className="university-campus-card"
                              onClick={() => openCampus(campus)}
                            >
                              <span className="campus-card-icon">📍</span>
                              <span>
                                <strong>{campus.name}</strong>
                                <small>
                                  {campus.isMain ? "Ana yerleşke" : "Yerleşke"} · {campus.district || campus.city}
                                </small>
                              </span>
                              <b>›</b>
                            </button>
                          ))
                        ) : (
                          <div className="empty-programs">Bu üniversite için henüz kampüs/yerleşke verisi eklenmedi.</div>
                        )
                      ) : !selectedCampusFaculty ? (
                        <>
                          <div className="selected-campus-summary">
                            <strong>{selectedCampus.name}</strong>
                            <span>{selectedCampus.isMain ? "Ana yerleşke" : "Yerleşke"}</span>
                            <small>{selectedCampus.address || `${selectedCampus.district || ""} ${selectedCampus.city || ""}`.trim()}</small>
                            <button type="button" onClick={() => setSelectedCampus(null)}>
                              ← Tüm yerleşkeler
                            </button>
                          </div>

                          <div className="campus-section-title">
                            <strong>Bu yerleşkedeki fakülte / birimler</strong>
                            <span>{selectedCampusFacultyGroups.length}</span>
                          </div>

                          {selectedCampusFacultyGroups.length > 0 ? (
                            selectedCampusFacultyGroups.map((faculty) => (
                              <button
                                type="button"
                                key={faculty.id}
                                className="university-campus-faculty-card"
                                onClick={() => openCampusFaculty(faculty)}
                              >
                                <span className="faculty-card-icon">🏫</span>
                                <span>
                                  <strong>{faculty.name}</strong>
                                  <small>{faculty.programCount} program · Bölüm / programları gör →</small>
                                </span>
                                <b>›</b>
                              </button>
                            ))
                          ) : (
                            <div className="empty-programs">Bu yerleşke için fakülte eşlemesi henüz tamamlanmadı.</div>
                          )}
                        </>
                      ) : !selectedCampusDepartment ? (
                        <>
                          <div className="selected-campus-summary">
                            <strong>{selectedCampusFaculty.name}</strong>
                            <span>{selectedCampus.name}</span>
                            <small>{selectedCampusFacultyDepartments.length} bölüm · {selectedCampusFacultyPrograms.length} program</small>
                            <button type="button" onClick={() => setSelectedCampusFaculty(null)}>
                              ← Fakültelere dön
                            </button>
                          </div>

                          <div className="campus-section-title">
                            <strong>Bu fakültedeki bölümler</strong>
                            <span>{selectedCampusFacultyDepartments.length}</span>
                          </div>

                          {selectedCampusFacultyDepartments.length > 0 ? (
                            selectedCampusFacultyDepartments.map((department) => (
                              <button
                                type="button"
                                key={department.id}
                                className="university-campus-faculty-card campus-department-card"
                                onClick={() => openCampusDepartment(department)}
                              >
                                <span className="faculty-card-icon">📚</span>
                                <span>
                                  <strong>{department.name}</strong>
                                  <small>{department.programs.length} program · Programları gör →</small>
                                </span>
                                <b>›</b>
                              </button>
                            ))
                          ) : (
                            <div className="empty-programs">Bu fakülte için bölüm verisi bulunamadı.</div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="selected-campus-summary">
                            <strong>{selectedCampusDepartment.name}</strong>
                            <span>{selectedCampusFaculty.name} · {selectedCampus.name}</span>
                            <small>{selectedCampusDepartmentPrograms.length} program</small>
                            <button type="button" onClick={() => setSelectedCampusDepartment(null)}>
                              ← Bölümlere dön
                            </button>
                          </div>

                          {selectedCampusDepartmentPrograms.map((program) => (
                            <button
                              type="button"
                              key={program.code}
                              className="faculty-program-row"
                              onClick={() => openProgram(program, selectedUniversity)}
                            >
                              <span>
                                <strong>{normalizeProgram(program).displayName}</strong>
                                <small>{normalizeProgram(program).displayScore} · TBS {formatNumber(normalizeProgram(program).displayRank)}</small>
                              </span>
                              <b>→</b>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
            </div>
          </aside>
        )}

        {/* =====================================
            PROGRAM DETAIL
        ===================================== */}

        {selectedProgram && (

          <aside className="program-detail">
            

            <button
              className="close-button"

              onClick={() =>
                setSelectedProgram(
                  null
                )
              }
            >
              ✕
            </button>

            <div className="detail-label">
              PROGRAM DETAYI
            </div>

            <h2>
              {
                selectedProgram.name ||
                selectedProgram.programName ||
                selectedProgram.birimAdi ||
                "Program"
              }
            </h2>

            <p className="detail-university">
              {
                selectedProgram.universityName ||
                selectedProgram.university ||
                selectedUniversity?.name ||
                "-"
              }
            </p>

            <div className="detail-tags">

              <span>
                {
                  selectedProgram.duration ??
                  selectedProgram.ogrenimSuresi ??
                  "-"
                }{" "}
                yıl
              </span>

              <span>
                {
                  selectedProgram.scoreType ||
                  selectedProgram.puanTuru ||
                  "-"
                }
              </span>

              <span>
                Kontenjan:{" "}
                {
                  selectedProgram.quota ??
                  selectedProgram.kontenjan ??
                  "-"
                }
              </span>

            </div>

            <div className="detail-actions">

              <button
                className={
                  isInPreferences(
                    selectedProgram
                  )
                    ? "primary-detail-button added"
                    : "primary-detail-button"
                }

                onClick={() =>
                  addToPreferences(
                    selectedProgram
                  )
                }
              >
                {
                  isInPreferences(
                    selectedProgram
                  )
                    ? "✓ Tercih listesinde"
                    : "⭐ Tercih listesine ekle"
                }
              </button>

              <button
                className={
                  isInComparison(
                    selectedProgram
                  )
                    ? "secondary-detail-button selected"
                    : "secondary-detail-button"
                }

                onClick={() =>
                  toggleComparison(
                    selectedProgram
                  )
                }
              >
                {
                  isInComparison(
                    selectedProgram
                  )
                    ? "✓ Karşılaştırmada"
                    : "⇄ Karşılaştır"
                }
              </button>

            </div>

            <div className="detail-section">

              <h3>
                2026 Program Bilgileri
              </h3>

              <div className="detail-row">
                <span>
                  Program Kodu
                </span>

                <strong>
                  {
                    selectedProgram.code ||
                    "-"
                  }
                </strong>
              </div>

              <div className="detail-row">
                <span>
                  Puan Türü
                </span>

                <strong>
                  {
                    selectedProgram.scoreType ||
                    selectedProgram.puanTuru ||
                    "-"
                  }
                </strong>
              </div>

              <div className="detail-row">
                <span>
                  Süre
                </span>

                <strong>
                  {
                    selectedProgram.duration ??
                    selectedProgram.ogrenimSuresi ??
                    "-"
                  }{" "}
                  yıl
                </strong>
              </div>

              <div className="detail-row">
                <span>
                  Kontenjan
                </span>

                <strong>
                  {
                    selectedProgram.quota ??
                    selectedProgram.kontenjan ??
                    "-"
                  }
                </strong>
              </div>

              <div className="detail-row">
                <span>
                  Yerleşen
                </span>

                <strong>
                  {
                    selectedProgram.placed ??
                    selectedProgram.yerlesen ??
                    "-"
                  }
                </strong>
              </div>

              <div className="detail-row highlight-row">
                <span>
                  2026 Başarı Sırası
                </span>

                <strong>
                  {
                    formatNumber(
                      selectedProgram.successRank ??
                      selectedProgram.basariSirasi
                    )
                  }
                </strong>
              </div>

              <div className="detail-row">
                <span>
                  En Küçük Puan
                </span>

                <strong>
                  {
                    selectedProgram.minScore ??
                    selectedProgram.minPuan ??
                    "-"
                  }
                </strong>
              </div>

              <div className="detail-row">
                <span>
                  En Büyük Puan
                </span>

                <strong>
                  {
                    selectedProgram.maxScore ??
                    selectedProgram.maxPuan ??
                    "-"
                  }
                </strong>
              </div>

              {selectedCampus ? (
                <button
                  type="button"
                  className="detail-row detail-location-row"
                  onClick={focusSelectedProgramCampus}
                  title={`${selectedProgram.campus_name || selectedCampus.name || selectedProgram.faculty} konumunu haritada göster`}
                >
                  <span>
                    Fakülte / Birim
                  </span>

                  <strong>
                    {
                      selectedProgram.faculty ||
                      selectedProgram.fymkAdi ||
                      selectedProgram.birimAdi ||
                      "-"
                    }
                    <small>📍 {selectedProgram.campus_name || selectedCampus.name || selectedProgram.faculty || "Yerleşke Konumu Belirleniyor"} · Haritada göster</small>
                  </strong>
                </button>
              ) : (
                <div className="detail-row">
                  <span>
                    Fakülte / Birim
                  </span>

                  <strong>
                    {
                      selectedProgram.faculty ||
                      selectedProgram.fymkAdi ||
                      selectedProgram.birimAdi ||
                      "-"
                    }
                  </strong>
                </div>
              )}

            </div>

          </aside>
        )}

      
        {selectedKyk && (
          <aside className="kyk-detail program-detail">
  
  <button
    className="close-button"
    onClick={() => setSelectedKyk(null)}
  >
    ✕
  </button>
  <div className="kyk-panel-header" style={{ marginBottom: '15px', paddingTop: '10px' }}>
    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
      <span style={{ background: '#10b981', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>GSB KYK</span>
      <span style={{ background: selectedKyk.gender === 'Kız' ? '#fbcfe8' : (selectedKyk.gender === 'Erkek' ? '#bfdbfe' : '#e5e7eb'), color: selectedKyk.gender === 'Kız' ? '#be185d' : (selectedKyk.gender === 'Erkek' ? '#1e3a8a' : '#4b5563'), padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>{selectedKyk.gender} Yurdu</span>
    </div>
    <h2 style={{ fontSize: '20px', margin: '5px 0', color: '#1e293b', fontWeight: '700', lineHeight: '1.3' }}>{selectedKyk.name}</h2>
    <p style={{ color: '#64748b', margin: 0, fontSize: "16px" }}>{selectedKyk.district}{selectedKyk.district && selectedKyk.city ? ', ' : ''}{selectedKyk.city}</p>
  </div>
  
  <div className="kyk-info-box">
    {/* Distance card */}
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px', marginBottom: '15px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ fontSize: '18px' }}>🎓</span>
        <h4 style={{ margin: 0, color: '#475569', fontSize: "16px", textTransform: 'uppercase', fontWeight: '700' }}>En Yakın Kampüs</h4>
      </div>
      <div style={{ color: '#0f172a', fontSize: '15px', fontWeight: '600' }}>
        {(() => {
          let minD = Infinity;
          let minName = null;
          Object.values(campusData).forEach(uniData => {
            if (uniData && uniData.campuses) {
              uniData.campuses.forEach(c => {
                if (c.latitude && c.longitude) {
                  let lat = Number(c.latitude);
                  let lng = Number(c.longitude);
                  if (!isNaN(lat) && !isNaN(lng) && selectedKyk && selectedKyk.coordinates && selectedKyk.coordinates.lat) {
                    let d = getDistanceFromLatLonInKm(Number(selectedKyk.coordinates.lat), Number(selectedKyk.coordinates.lng), lat, lng);
                    if (d < minD) {
                      minD = d;
                      minName = c.name + (uniData.universityName ? " (" + uniData.universityName + ")" : "");
                    }
                  }
                }
              });
            }
          });
          if (minD !== Infinity && minName) {
            let walkTime = Math.round((minD / 5) * 60);
            let walkStr = walkTime < 60 ? walkTime + " dk" : Math.round(walkTime/60) + " saat";
            return (
              <div>
                <div style={{ marginBottom: '6px' }}>{minName}</div>
                <div style={{ color: '#6366f1', fontSize: "16px", display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>📍 {(minD).toFixed(1)} km</span>
                  <span style={{ color: '#94a3b8' }}>•</span>
                  <span>🚶‍♂️ Yürüyerek ~{walkStr}</span>
                </div>
              </div>
            );
          }
          return "Kampüs bulunamadı";
        })()}
      </div>
    </div>

    {/* Address card */}
    {(selectedKyk.address || (selectedKyk.district && selectedKyk.city)) ? (
      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <span style={{ fontSize: '18px' }}>🗺️</span>
          <h4 style={{ margin: 0, color: '#475569', fontSize: "16px", textTransform: 'uppercase', fontWeight: '700' }}>Açık Adres</h4>
        </div>
        <div style={{ color: '#334155', fontSize: "16px", lineHeight: '1.5' }}>
          {selectedKyk.address ? selectedKyk.address : selectedKyk.district + ", " + selectedKyk.city}
        </div>
      </div>
    ) : null}
    
    <a href={"https://www.google.com/maps/dir/?api=1&destination=" + selectedKyk.coordinates.lat + "," + selectedKyk.coordinates.lng} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '14px', background: '#2563eb', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontWeight: '600', fontSize: '15px', transition: 'background 0.2s', boxSizing: 'border-box' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
      Haritalarda Yol Tarifi
    </a>
  </div>
</aside>
        )}


        {selectedSubCampus && (
          <aside
            className="campus-social-drawer"
            onTouchStart={e => e.stopPropagation()}
            onTouchMove={e => e.stopPropagation()}
            onWheel={e => e.stopPropagation()}
          >
            {/* ── KAPAT ── */}
            <button className="close-button" onClick={() => setSelectedSubCampus(null)}>✕</button>

            {/* ── BAŞLIK ── */}
            <div className="csd-header">
              <div className="csd-badges">
                <span className="csd-badge csd-badge--purple">Üniversite Yerleşkesi</span>
                <span className={`csd-badge ${selectedSubCampus.isMain ? 'csd-badge--amber' : 'csd-badge--green'}`}>
                  {selectedSubCampus.isMain ? 'Ana Kampüs' : 'Alt Yerleşke'}
                </span>
              </div>
              <h2 className="csd-title">{selectedSubCampus.name}</h2>
              <p className="csd-subtitle">{selectedSubCampus.universityName}</p>
            </div>

            {/* ── TAB BAR ── */}
            <div className="csd-tabbar">
              {[
                { key: 'info',    label: 'Bilgi',            icon: 'ℹ️' },
                { key: 'units',   label: 'Bölümler',         icon: '🎓' },
                { key: 'reviews', label: 'Değerlendirmeler', icon: '⭐' },
                { key: 'qa',      label: 'Soru & Cevap',     icon: '❓' },
              ].map(tab => (
                <button
                  key={tab.key}
                  className={`csd-tab ${campusDetailTab === tab.key ? 'csd-tab--active' : ''}`}
                  onClick={() => setCampusDetailTab(tab.key)}
                >
                  <span className="csd-tab-icon">{tab.icon}</span>
                  <span className="csd-tab-label">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* ── TAB İÇERİKLERİ ── */}
            <div className="csd-body">

              {/* ━━ BİLGİ ━━ */}
              {campusDetailTab === 'info' && (
                <div className="csd-section-list">
                  <div className="csd-card">
                    <div className="csd-card-header"><span>🗺️</span><h4>Açık Adres</h4></div>
                    <p className="csd-card-text">
                      {selectedSubCampus.address ||
                        [selectedSubCampus.district, selectedSubCampus.city].filter(Boolean).join(', ') ||
                        'Adres bilgisi mevcut değil'}
                    </p>
                  </div>
                  {selectedSubCampus.latitude && (
                    <div className="csd-card">
                      <div className="csd-card-header"><span>📍</span><h4>Koordinatlar</h4></div>
                      <p className="csd-card-text" style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                        {Number(selectedSubCampus.latitude).toFixed(6)}, {Number(selectedSubCampus.longitude).toFixed(6)}
                      </p>
                    </div>
                  )}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedSubCampus.latitude},${selectedSubCampus.longitude}`}
                    target="_blank" rel="noreferrer"
                    className="csd-directions-btn"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                    Yol Tarifi Al
                  </a>
                </div>
              )}

              {/* ━━ BÖLÜMLER ━━ */}
              {campusDetailTab === 'units' && (
                <div className="csd-section-list">
                  {selectedSubCampus.academicUnits && selectedSubCampus.academicUnits.length > 0 ? (
                    selectedSubCampus.academicUnits.map((unit, idx) => (
                      <div key={idx} className="csd-accordion-item">
                        <button
                          className="csd-accordion-trigger"
                          onClick={() => setExpandedUnits(prev => ({ ...prev, [idx]: !prev[idx] }))}
                        >
                          <span className={`csd-unit-badge ${unit.type === 'MYO' ? 'csd-unit-badge--blue' : unit.type === 'Fakülte' ? 'csd-unit-badge--pink' : 'csd-unit-badge--gray'}`}>
                            {unit.type}
                          </span>
                          <span className="csd-accordion-name">{unit.name}</span>
                          <span className={`csd-accordion-arrow ${expandedUnits[idx] ? 'csd-accordion-arrow--open' : ''}`}>▼</span>
                        </button>
                        {expandedUnits[idx] && (
                          <div className="csd-accordion-body">
                            {unit.programs && unit.programs.length > 0 ? (
                              <div className="csd-program-list">
                                {unit.programs.map((prog, pidx) => (
                                  <span key={pidx} className="csd-program-chip">
                                    <span className={`csd-degree-badge ${prog.degree === 'Önlisans' ? 'csd-degree-badge--blue' : 'csd-degree-badge--orange'}`}>
                                      {prog.degree}
                                    </span>
                                    {prog.name}
                                  </span>
                                ))}
                              </div>
                            ) : <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Bölüm bilgisi yok.</p>}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="csd-empty">Bu yerleşkeye ait akademik birim bilgisi bulunmuyor.</div>
                  )}
                </div>
              )}

              {/* ━━ DEĞERLENDİRMELER ━━ */}
              {campusDetailTab === 'reviews' && (
                <div className="csd-section-list">
                  <div className="csd-rating-summary">
                    <div className="csd-rating-score">4.0</div>
                    <div>
                      <div className="csd-stars">★★★★☆</div>
                      <div className="csd-rating-count">{MOCK_REVIEWS.length} değerlendirme</div>
                    </div>
                    <button className="csd-add-review-btn">+ Yorum Yap</button>
                  </div>
                  {MOCK_REVIEWS.map(review => (
                    <div key={review.id} className="csd-review-card">
                      <div className="csd-review-top">
                        <span className="csd-review-avatar">{review.avatar}</span>
                        <div className="csd-review-meta">
                          <span className="csd-review-author">{review.author}</span>
                          <span className="csd-review-date">{review.date}</span>
                        </div>
                        <div className="csd-review-stars">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} style={{ color: i < review.rating ? '#f59e0b' : '#e2e8f0', fontSize: '15px' }}>★</span>
                          ))}
                        </div>
                      </div>
                      <p className="csd-review-text">{review.text}</p>
                      <div className="csd-review-actions">
                        <button
                          className={`csd-vote-btn ${reviewVotes[review.id] === 'up' ? 'csd-vote-btn--active' : ''}`}
                          onClick={() => setReviewVotes(p => ({ ...p, [review.id]: p[review.id] === 'up' ? null : 'up' }))}
                        >👍 Yararlı</button>
                        <button
                          className={`csd-vote-btn ${reviewVotes[review.id] === 'down' ? 'csd-vote-btn--active-down' : ''}`}
                          onClick={() => setReviewVotes(p => ({ ...p, [review.id]: p[review.id] === 'down' ? null : 'down' }))}
                        >👎</button>
                      </div>
                    </div>
                  ))}
                  <button className="csd-load-more-btn">Tüm yorumları gör →</button>
                </div>
              )}

              {/* ━━ SORU & CEVAP ━━ */}
              {campusDetailTab === 'qa' && (
                <div className="csd-section-list">
                  <button className="csd-ask-btn">+ Soru Sor</button>
                  {MOCK_QA.map(qa => (
                    <div key={qa.id} className="csd-qa-item">
                      <div className="csd-qa-question-row">
                        <div className="csd-qa-votes">
                          <button
                            className={`csd-upvote ${(qaVotes[`q${qa.id}`] || 0) > 0 ? 'csd-upvote--active' : ''}`}
                            onClick={() => setQaVotes(p => ({ ...p, [`q${qa.id}`]: (p[`q${qa.id}`] || 0) > 0 ? 0 : 1 }))}
                          >▲</button>
                          <span className="csd-vote-count">{qa.votes + (qaVotes[`q${qa.id}`] || 0)}</span>
                          <button className="csd-downvote">▼</button>
                        </div>
                        <div className="csd-qa-question-body">
                          <p className="csd-qa-question-text">{qa.question}</p>
                          <div className="csd-qa-meta">
                            <span>💬 {qa.answers.length} cevap</span>
                            <span className="csd-qa-author">{qa.author}</span>
                            <span className="csd-qa-date">{qa.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="csd-qa-answers">
                        {qa.answers.map(ans => (
                          <div key={ans.id} className="csd-answer-row">
                            <div className="csd-qa-votes csd-qa-votes--sm">
                              <button
                                className={`csd-upvote ${(qaVotes[`a${qa.id}-${ans.id}`] || 0) > 0 ? 'csd-upvote--active' : ''}`}
                                onClick={() => setQaVotes(p => ({ ...p, [`a${qa.id}-${ans.id}`]: (p[`a${qa.id}-${ans.id}`] || 0) > 0 ? 0 : 1 }))}
                              >▲</button>
                              <span className="csd-vote-count csd-vote-count--sm">{ans.votes + (qaVotes[`a${qa.id}-${ans.id}`] || 0)}</span>
                            </div>
                            <div className="csd-answer-body">
                              <div className="csd-answer-author">
                                <span>{ans.avatar}</span>
                                <strong>{ans.author}</strong>
                              </div>
                              <p className="csd-answer-text">{ans.text}</p>
                            </div>
                          </div>
                        ))}
                        <button className="csd-answer-btn">Cevapla</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </aside>
        )}


      </main>

      {/* ========================================
          TERCİH LİSTESİ
      ======================================== */}

      {preferenceOpen && (

        <aside className="preference-drawer">
            

          <div className="preference-header">

            <div>

              <div className="detail-label">
                TERCİH LİSTEM
              </div>

              <h2>
                {
                  preferences.length
                } / 24 tercih
              </h2>

            </div>

            <button
              className="close-button"
              onClick={() =>
                setPreferenceOpen(
                  false
                )
              }
            >
              ✕
            </button>

          </div>

          {preferences.length ===
          0 ? (

            <div className="empty-preferences">

              <div className="empty-icon">
                ⭐
              </div>

              <h3>
                Henüz program eklenmedi
              </h3>

              <p>
                Beğendiğin programların
                yanındaki + butonuna
                basarak tercih listene
                ekleyebilirsin.
              </p>

            </div>

          ) : (

            <>

              <div className="preference-toolbar">

                <span>
                  Sürükleyip bırakarak veya
                  ↑ ↓ ile sıralayabilirsin.
                </span>

                {comparisonPrograms.length >=
                  2 && (

                  <button
                    className="compare-open-button"
                    onClick={() =>
                      setComparisonOpen(
                        true
                      )
                    }
                  >
                    ⇄ Karşılaştır
                  </button>

                )}

              </div>

              <div className="preference-list">

                {preferences.map(
                  (
                    program,
                    index
                  ) => (

                    <div
                      key={
                        program.code
                      }
                      className={
                        draggedPreferenceCode === String(program.code)
                          ? "preference-item dragging"
                          : "preference-item"
                      }
                      draggable
                      onDragStart={(event) => {
                        setDraggedPreferenceCode(String(program.code));
                        event.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        movePreference(
                          draggedPreferenceCode,
                          String(program.code)
                        );
                        setDraggedPreferenceCode(null);
                      }}
                      onDragEnd={() =>
                        setDraggedPreferenceCode(null)
                      }
                    >

                      <div className="preference-order">
                        {
                          index + 1
                        }
                      </div>

                      <span
                        className="drag-handle"
                        title="Sürükleyerek sırala"
                        aria-hidden="true"
                      >
                        ⠿
                      </span>

                      <button
                        className="preference-main"

                        onClick={() => {
                          const university =
                            universityMap.get(
                              program.universityId
                            );

                          if (
                            university
                          ) {
                            openProgram(
                              program,
                              university
                            );

                            setPreferenceOpen(
                              false
                            );
                          }
                        }}
                      >

                        <strong>
                          {
                            program.name ||
                            program.programName ||
                            program.birimAdi ||
                            "Program"
                          }
                        </strong>

                        <span>
                          {
                            program.universityName ||
                            program.university ||
                            "-"
                          }
                        </span>

                        <small>
                          {
                            program.scoreType ||
                            program.puanTuru ||
                            "-"
                          }{" "}
                          • TBS:{" "}
                          {
                            formatNumber(
                              program.successRank ??
                              program.basariSirasi
                            )
                          }
                        </small>

                      </button>

                      <div className="preference-actions">

                        <button
                          className="order-button"
                          disabled={
                            index ===
                            0
                          }
                          onClick={() =>
                            movePreferenceUp(
                              index
                            )
                          }
                        >
                          ↑
                        </button>

                        <button
                          className="order-button"
                          disabled={
                            index ===
                            preferences.length -
                              1
                          }
                          onClick={() =>
                            movePreferenceDown(
                              index
                            )
                          }
                        >
                          ↓
                        </button>

                        <button
                          className={
                            isInComparison(
                              program
                            )
                              ? "compare-mini selected"
                              : "compare-mini"
                          }
                          onClick={() =>
                            toggleComparison(
                              program
                            )
                          }
                        >
                          ⇄
                        </button>

                        <button
                          className="remove-mini"
                          onClick={() =>
                            removeFromPreferences(
                              program.code
                            )
                          }
                        >
                          ✕
                        </button>

                      </div>

                    </div>

                  )
                )}

              </div>

              <button
                className="clear-list-button"
                onClick={() => {
                  setPreferences([]);
                  setComparisonPrograms([]);
                }}
              >
                Tercih listesini temizle
              </button>

            </>

          )}

        </aside>

      )}

      {/* ========================================
          COMPARISON
      ======================================== */}

      {comparisonOpen &&
        comparisonPrograms.length >=
          2 && (

        <div className="modal-overlay">

          <div className="comparison-modal">

            <div className="comparison-header">

              <div>

                <div className="detail-label">
                  KARŞILAŞTIRMA
                </div>

                <h2>
                  Programları karşılaştır
                </h2>

              </div>

              <button
                className="close-button"
                onClick={() =>
                  setComparisonOpen(
                    false
                  )
                }
              >
                ✕
              </button>

            </div>

            <div className="comparison-table-wrapper">

              <div className="comparison-summary">
                <div>
                  <span>En seçici sıra</span>
                  <strong>
                    {formatNumber(comparisonSummary.lowestRank)}
                  </strong>
                </div>
                <div>
                  <span>En geniş sıra</span>
                  <strong>
                    {formatNumber(comparisonSummary.highestRank)}
                  </strong>
                </div>
                <div>
                  <span>En yüksek taban puan</span>
                  <strong>
                    {comparisonSummary.highestScore ?? "-"}
                  </strong>
                </div>
              </div>

              <div className="comparison-mobile-cards">
                {comparisonPrograms.map((program, index) => {
                  const code = String(program.code);
                  const name =
                    program.name ||
                    program.programName ||
                    program.birimAdi ||
                    "Program";
                  const university =
                    program.universityName ||
                    program.university ||
                    "-";
                  const rank = program.successRank ?? program.basariSirasi;
                  const minScore = program.minScore ?? program.minPuan;
                  const maxScore = program.maxScore ?? program.maxPuan;
                  const education =
                    numberValue(
                      program.duration ?? program.ogrenimSuresi
                    ) === 2
                      ? "Önlisans"
                      : "Lisans";

                  return (
                    <article className="comparison-mobile-card" key={`mobile-${code}`}>
                      <div className="comparison-mobile-card-head">
                        <div className="comparison-mobile-number">{index + 1}</div>
                        <div className="comparison-mobile-title">
                          <strong>{name}</strong>
                          <span>{university}</span>
                        </div>
                        <button
                          type="button"
                          className="comparison-remove"
                          onClick={() => toggleComparison(program)}
                        >
                          ✕
                        </button>
                      </div>

                      <div className="comparison-mobile-grid">
                        <div><span>Puan</span><strong>{program.scoreType || program.puanTuru || "-"}</strong></div>
                        <div><span>Eğitim</span><strong>{education}</strong></div>
                        <div><span>Kontenjan</span><strong>{program.quota ?? program.kontenjan ?? "-"}</strong></div>
                        <div><span>Yerleşen</span><strong>{program.placed ?? program.yerlesen ?? "-"}</strong></div>
                        <div className="comparison-mobile-highlight">
                          <span>2026 Başarı Sırası</span>
                          <strong>{formatNumber(rank)}</strong>
                          {comparisonBest.bestRank === code && (
                            <small>🏆 En iyi sıra</small>
                          )}
                        </div>
                        <div className="comparison-mobile-highlight">
                          <span>En küçük puan</span>
                          <strong>{minScore ?? "-"}</strong>
                          {comparisonBest.bestMinScore === code && (
                            <small>⭐ En yüksek</small>
                          )}
                        </div>
                        <div className="comparison-mobile-highlight">
                          <span>En büyük puan</span>
                          <strong>{maxScore ?? "-"}</strong>
                          {comparisonBest.bestMaxScore === code && (
                            <small>⭐ En yüksek</small>
                          )}
                        </div>
                        <div className="comparison-mobile-wide">
                          <span>Fakülte / Birim</span>
                          <strong>{program.faculty || program.fymkAdi || program.birimAdi || "-"}</strong>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <table className="comparison-table">

                <thead>

                  <tr>

                    <th>
                      Bilgi
                    </th>

                    {comparisonPrograms.map(
                      (program) => (

                        <th
                          key={
                            program.code
                          }
                        >

                          <div className="comparison-program-title">

                            <strong>
                              {
                                program.name ||
                                program.programName ||
                                program.birimAdi ||
                                "Program"
                              }
                            </strong>

                            <small>
                              {
                                program.universityName ||
                                program.university ||
                                "-"
                              }
                            </small>

                            <button
                              type="button"
                              className="comparison-remove"
                              onClick={() =>
                                toggleComparison(program)
                              }
                            >
                              ✕ Çıkar
                            </button>

                          </div>

                        </th>

                      )
                    )}

                  </tr>

                </thead>

                <tbody>

                  <tr>

                    <td>
                      Puan türü
                    </td>

                    {comparisonPrograms.map(
                      (program) => (

                        <td
                          key={
                            program.code
                          }
                        >
                          {
                            program.scoreType ||
                            program.puanTuru ||
                            "-"
                          }
                        </td>

                      )
                    )}

                  </tr>

                  <tr>

                    <td>
                      Eğitim
                    </td>

                    {comparisonPrograms.map(
                      (program) => (

                        <td
                          key={
                            program.code
                          }
                        >
                          {
                            numberValue(
                              program.duration ??
                              program.ogrenimSuresi
                            ) === 2
                              ? "Önlisans"
                              : "Lisans"
                          }
                        </td>

                      )
                    )}

                  </tr>

                  <tr>

                    <td>
                      Kontenjan
                    </td>

                    {comparisonPrograms.map(
                      (program) => (

                        <td
                          key={
                            program.code
                          }
                        >
                          {
                            program.quota ??
                            program.kontenjan ??
                            "-"
                          }
                        </td>

                      )
                    )}

                  </tr>

                  <tr>

                    <td>
                      Yerleşen
                    </td>

                    {comparisonPrograms.map(
                      (program) => (

                        <td
                          key={
                            program.code
                          }
                        >
                          {
                            program.placed ??
                            program.yerlesen ??
                            "-"
                          }
                        </td>

                      )
                    )}

                  </tr>

                  <tr className="comparison-highlight">

                    <td>
                      2026 Başarı Sırası
                    </td>

                    {comparisonPrograms.map(
                      (program) => {
                        const isBest =
                          comparisonBest.bestRank ===
                          String(program.code);

                        return (
                          <td
                            key={program.code}
                            className={
                              isBest
                                ? "comparison-best-cell"
                                : ""
                            }
                          >
                            {isBest && (
                              <span className="comparison-best-badge">
                                🏆 En iyi sıra
                              </span>
                            )}

                            <strong>
                              {formatNumber(
                                program.successRank ??
                                program.basariSirasi
                              )}
                            </strong>
                          </td>
                        );
                      }
                    )}

                  </tr>

                  <tr>

                    <td>
                      En küçük puan
                    </td>

                    {comparisonPrograms.map(
                      (program) => (

                        <td
                          key={
                            program.code
                          }
                          className={
                            comparisonBest.bestMinScore ===
                            String(program.code)
                              ? "comparison-best-cell"
                              : ""
                          }
                        >
                          {comparisonBest.bestMinScore ===
                            String(program.code) && (
                            <span className="comparison-best-badge">
                              ⭐ En yüksek
                            </span>
                          )}
                          {
                            program.minScore ??
                            program.minPuan ??
                            "-"
                          }
                        </td>

                      )
                    )}

                  </tr>

                  <tr>

                    <td>
                      En büyük puan
                    </td>

                    {comparisonPrograms.map(
                      (program) => (

                        <td
                          key={
                            program.code
                          }
                          className={
                            comparisonBest.bestMaxScore ===
                            String(program.code)
                              ? "comparison-best-cell"
                              : ""
                          }
                        >
                          {comparisonBest.bestMaxScore ===
                            String(program.code) && (
                            <span className="comparison-best-badge">
                              ⭐ En yüksek
                            </span>
                          )}
                          {
                            program.maxScore ??
                            program.maxPuan ??
                            "-"
                          }
                        </td>

                      )
                    )}

                  </tr>

                  <tr>

                    <td>
                      Fakülte / Birim
                    </td>

                    {comparisonPrograms.map(
                      (program) => (

                        <td
                          key={
                            program.code
                          }
                        >
                          {
                            program.faculty ||
                            program.fymkAdi ||
                            program.birimAdi ||
                            "-"
                          }
                        </td>

                      )
                    )}

                  </tr>

                </tbody>

              </table>

            </div>

          </div>

        </div>

      )}
      {/* MOBİL ALT MENÜ (Glassmorphism) */}
      <nav className={`mobile-bottom-bar ${isAnyModalOpen ? 'nav-hidden' : ''}`}>
        <button type="button" onClick={openBrowse}>
          <span style={{fontSize: '20px', marginBottom: '2px'}}>🎓</span>
          <span>Keşfet</span>
        </button>
        <button type="button" onClick={() => toggleFloatingPanel("preferences")}>
          <span style={{fontSize: '20px', marginBottom: '2px'}}>⭐</span>
          <span>Tercihler</span>
        </button>
        <button type="button" onClick={() => setFiltersOpen(true)}>
          <span style={{fontSize: '20px', marginBottom: '2px'}}>⚙</span>
          <span>Filtreler</span>
        </button>
      </nav>

    </div>
  );
}

export default App;
