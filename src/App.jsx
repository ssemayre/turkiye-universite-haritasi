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

// ==================================================
// HELPERS
// ==================================================

function normalize(text) {
  return String(text || "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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
}) {
  const map = useMap();

  useEffect(() => {
    if (
      selectedUniversity &&
      Number.isFinite(
        selectedUniversity.latitude
      ) &&
      Number.isFinite(
        selectedUniversity.longitude
      )
    ) {
      map.flyTo(
        [
          selectedUniversity.latitude,
          selectedUniversity.longitude,
        ],
        12,
        {
          duration: 1.2,
        }
      );
    }
  }, [
    selectedUniversity,
    map,
  ]);

  return null;
}

// ==================================================
// APP
// ==================================================

function App() {
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
      map.set(
        university.id,
        university
      );
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
          const university =
            universityMap.get(
              program.universityId
            );

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

    if (!universityExists) {
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
        if (!hit.matched) continue;
        const name = normalize(university.name);
        let score = hit.score;
        if (name === query) score += 35;
        else if (name.startsWith(query)) score += 22;
        candidates.push({ type: "university", university, score });
      }

      if (searchProgramsLoaded) {
        for (const program of generalFilteredPrograms) {
          const university = universityMap.get(program.universityId);
          if (!university) continue;
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
              `/programs/${universityId}.json`
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

        setSelectedUniversity(
          university
        );

        setSelectedProgram(
          null
        );

        setUniversityProgramSearch(
          ""
        );

        setUniversityPrograms(
          []
        );

        await loadUniversityPrograms(
          university.id
        );
      },
      [loadUniversityPrograms]
    );

  // ==================================================
  // OPEN PROGRAM
  // ==================================================

  const openProgram =
    useCallback(
      async (
        program,
        university
      ) => {
        const data =
          await loadUniversityPrograms(
            university.id
          );

        const fullProgram =
          data.find(
            (item) =>
              String(
                item.code
              ) ===
              String(
                program.code
              )
          );

        setSelectedUniversity(
          university
        );

        setSelectedProgram(
          fullProgram ||
          program
        );

        setUniversityProgramSearch(
          ""
        );
      },
      [loadUniversityPrograms]
    );

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
  return (
    <div className="app">

      {/* ========================================
          HEADER
      ======================================== */}

      <header className="header">

        <div className="logo-area">

          <h1>
            Türkiye Üniversite Haritası
          </h1>

          <p>
            Üniversite ve bölüm keşfet
          </p>

        </div>

        <div className="search-area">

          <input
            type="text"
            placeholder="🔎 Üniversite veya bölüm ara..."
            value={searchInput}
            onChange={(event) =>
              setSearchInput(
                event.target.value
              )
            }
            onKeyDown={(event) => {
              if (event.key === "Enter" && searchResults.length > 0) {
                const first = searchResults[0];
                blurSearch();
                if (first.type === "university") {
                  openUniversity(first.university);
                } else {
                  openProgram(first.program, first.university);
                }
                setSearchInput("");
                setSearch("");
              }
            }}
          />

          <div className="quick-filter-strip" aria-label="Hızlı filtreler">
            <button type="button" onClick={() => applyQuickFilter("devlet")}>Devlet</button>
            <button type="button" onClick={() => applyQuickFilter("vakif")}>Vakıf</button>
            <button type="button" onClick={() => applyQuickFilter("lisans")}>Lisans</button>
            <button type="button" onClick={() => applyQuickFilter("onlisans")}>Önlisans</button>
            <button type="button" onClick={() => applyQuickFilter("tyt")}>TYT</button>
            <button type="button" onClick={() => applyQuickFilter("say")}>SAY</button>
          </div>

          {loadingSearchPrograms &&
            search.trim() && (
              <div className="search-loading">
                Programlar yükleniyor...
              </div>
            )}

          {search.trim() &&
            !loadingSearchPrograms && (
              <div className="search-results">

                {searchResults.length >
                0 ? (

                  <>
                    <div className="search-results-count">
                      {searchResults.length} sonuç bulundu • {Math.min(searchResultLimit, searchResults.length)} gösteriliyor
                    </div>

                    {visibleSearchResults.map(
                    (
                      result,
                      index
                    ) => {

                      if (
                        result.type ===
                        "university"
                      ) {
                        return (
                          <button
                            key={
                              `uni-${result.university.id}`
                            }
                            className="search-result"

                            onClick={() => {
                              blurSearch();
                              openUniversity(result.university);
                              setSearchInput("");
                              setSearch("");
                            }}
                          >

                            <span className="result-type">
                              ÜNİVERSİTE
                            </span>

                            <strong>
                              {
                                result
                                  .university
                                  .name
                              }
                            </strong>

                            <span>
                              {
                                result
                                  .university
                                  .city
                              }{" "}
                              •{" "}
                              {
                                result
                                  .university
                                  .type
                              }
                            </span>

                          </button>
                        );
                      }

                      return (
                        <div
                          key={
                            `program-${result.program.code}-${index}`
                          }
                          className="search-result program-search-result"
                        >

                          <button
                            className="search-result-main"

                            onClick={() => {
                              blurSearch();
                              openProgram(result.program, result.university);
                              setSearchInput("");
                              setSearch("");
                            }}
                          >

                            <span className="result-type">
                              PROGRAM
                            </span>

                            <strong>
                              {
                                result
                                  .program
                                  .name
                              }
                            </strong>

                            <span>
                              {
                                result
                                  .program
                                  .universityName
                              }
                            </span>

                            <small>
                              {
                                result
                                  .program
                                  .scoreType
                              }{" "}
                              • TBS:{" "}
                              {
                                formatNumber(
                                  result
                                    .program
                                    .successRank
                                )
                              }
                            </small>

                          </button>

                          <button
                            className={
                              isInPreferences(
                                result.program
                              )
                                ? "quick-add-button added"
                                : "quick-add-button"
                            }

                            onClick={() =>
                              addToPreferences(
                                result.program
                              )
                            }
                          >
                            {
                              isInPreferences(
                                result.program
                              )
                                ? "✓"
                                : "+"
                            }
                          </button>

                        </div>
                      );
                    }
                    )}

                    {searchResults.length > searchResultLimit && (
                      <button
                        type="button"
                        className="search-load-more"
                        onClick={() =>
                          setSearchResultLimit((current) =>
                            Math.min(current + 15, searchResults.length)
                          )
                        }
                      >
                        Daha fazla göster ({searchResults.length - searchResultLimit})
                      </button>
                    )}
                  </>

                ) : (

                  <div className="no-result">
                    Sonuç bulunamadı.
                  </div>

                )}

              </div>
            )}

        </div>

        <nav className="top-nav" aria-label="Ana menü">
          <button className="top-nav-item active" type="button" onClick={goHome}>⌂ <span>Ana Sayfa</span></button>
          <button className="top-nav-item" type="button" onClick={openBrowse}>🎓 <span>Üniversiteler</span></button>
          <button className="top-nav-item" type="button" onClick={() => toggleFloatingPanel("preferences")}>⭐ <span>Tercih Listem</span><b>{preferences.length}</b></button>
          <button className="top-nav-item" type="button" onClick={() => setFiltersOpen(true)}>⚙ <span>Filtreler</span></button>
          <button className="top-nav-item" type="button" onClick={openAbout}>ⓘ <span>Hakkında</span></button>
        </nav>

        <div className="header-actions">

          <button
            className="header-universities-button"
            onClick={openBrowse}
          >
            🎓 Üniversiteler
          </button>

          <button
            className="header-list-button"
            onClick={() =>
              toggleFloatingPanel("preferences")
            }
          >
            ⭐ Tercih Listem

            <span>
              {
                preferences.length
              }
            </span>
          </button>

          <button
            className="filter-button"
            onClick={() =>
              toggleFloatingPanel("filters")
            }
          >
            ⚙ Filtreler

            {activeFilterCount >
              0 && (
              <span className="filter-count">
                {
                  activeFilterCount
                }
              </span>
            )}

          </button>

        </div>

      </header>

      {/* ========================================
          MODERN DASHBOARD SHELL
      ======================================== */}

      <aside className="explore-sidebar">
        <div className="sidebar-search-label">KEŞFET</div>
        <h2>Üniversiteni bul</h2>
        <p className="sidebar-intro">Şehrini ve üniversite türünü seç, haritadaki seçenekleri hızlıca keşfet.</p>

        <button
          className="sidebar-select"
          onClick={() => setFiltersOpen(true)}
        >
          <span className="sidebar-icon indigo">⌖</span>
          <span>
            <strong>Şehir</strong>
            <small>{cityFilter === "Tümü" ? "Tüm şehirler" : cityFilter}</small>
          </span>
          <b>⌄</b>
        </button>

        <button
          className="sidebar-select"
          onClick={() => setFiltersOpen(true)}
        >
          <span className="sidebar-icon cyan">▣</span>
          <span>
            <strong>Üniversite türü</strong>
            <small>{typeFilter === "Tümü" ? "Tüm üniversiteler" : typeFilter}</small>
          </span>
          <b>⌄</b>
        </button>

        <button
          className="sidebar-select"
          onClick={() => setFiltersOpen(true)}
        >
          <span className="sidebar-icon orange">▤</span>
          <span>
            <strong>Program türü</strong>
            <small>{educationFilter === "Tümü" ? "Lisans + Önlisans" : educationFilter}</small>
          </span>
          <b>⌄</b>
        </button>

        <div className="sidebar-section-title">Hızlı Erişim</div>

        <button className="sidebar-feature orange" onClick={openBrowse}>
          <span>🔥</span>
          <span><strong>Üniversiteleri keşfet</strong><small>Haritadan veya listeden seç</small></span>
          <b>→</b>
        </button>

        <button className="sidebar-feature cyan" onClick={() => setFiltersOpen(true)}>
          <span>▥</span>
          <span><strong>2026 taban verileri</strong><small>Güncel program bilgileri</small></span>
          <b>→</b>
        </button>

        <div className="sidebar-quote">
          <strong>Doğru tercih,<br />daha aydınlık bir gelecek.</strong>
          <p>Türkiye’deki üniversiteleri keşfet, karşılaştır ve hayallerine bir adım daha yaklaş.</p>
        </div>
      </aside>

      {/* ========================================
          UYGUN PROGRAMLAR
      ======================================== */}

      {/* ========================================
          FİLTRELER
      ======================================== */}

      {filtersOpen && (
        <aside className="filter-panel">

          <div className="filter-header">

            <h2>
              Filtreler
            </h2>

            <button
              onClick={() =>
                setFiltersOpen(false)
              }
            >
              ✕
            </button>

          </div>

          <label>
            Şehir
          </label>

          <select
            value={cityFilter}
            onChange={(event) =>
              setCityFilter(
                event.target.value
              )
            }
          >

            <option value="Tümü">
              Tüm şehirler
            </option>

            {cities.map(
              (city) => (
                <option
                  key={city}
                  value={city}
                >
                  {city}
                </option>
              )
            )}

          </select>

          <label>
            Üniversite türü
          </label>

          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(
                event.target.value
              )
            }
          >

            <option value="Tümü">
              Tümü
            </option>

            {universityTypes.map(
              (type) => (
                <option
                  key={type}
                  value={type}
                >
                  {type}
                </option>
              )
            )}

          </select>

          <label>
            Eğitim
          </label>

          <select
            value={educationFilter}
            onChange={(event) =>
              setEducationFilter(
                event.target.value
              )
            }
          >

            <option value="Tümü">
              Tümü
            </option>

            <option value="Lisans">
              Lisans
            </option>

            <option value="Önlisans">
              Önlisans
            </option>

          </select>

          <label>
            Puan türü
          </label>

          <select
            value={scoreFilter}
            onChange={(event) =>
              setScoreFilter(
                event.target.value
              )
            }
          >

            <option value="Tümü">
              Tümü
            </option>

            <option value="TYT">
              TYT
            </option>

            <option value="SAY">
              SAY
            </option>

            <option value="EA">
              EA
            </option>

            <option value="SÖZ">
              SÖZ
            </option>

            <option value="DİL">
              DİL
            </option>

          </select>

          <label>
            En düşük başarı sırası
          </label>

          <input
            className="rank-input"
            type="number"
            min="1"
            placeholder="Örn. 0"
            value={minRank}
            onChange={(event) =>
              setMinRank(
                event.target.value
              )
            }
          />

          <label>
            En yüksek başarı sırası
          </label>

          <input
            className="rank-input"
            type="number"
            min="1"
            placeholder="Örn. 100000"
            value={maxRank}
            onChange={(event) =>
              setMaxRank(
                event.target.value
              )
            }
          />

          <div className="rank-info">
            Başarı sırası aralığına
            göre programları filtreler.
          </div>

          <div className="filter-actions">

            <button
              className="reset-filter"
              onClick={
                () => {
                  resetFilters();
                }
              }
            >
              Tüm filtreleri temizle
            </button>

          </div>

        </aside>
      )}

      {/* ========================================
          MAP
      ======================================== */}

      <main className="map-area">

        <div className="map-dashboard-top">
          <div className="map-stat-card indigo">
            <span className="map-stat-icon">⌂</span>
            <div><strong>{mapUniversities.length || 205}</strong><small>Üniversite</small></div>
          </div>
          <div className="map-stat-card cyan">
            <span className="map-stat-icon">▤</span>
            <div><strong>21.493+</strong><small>Program</small></div>
          </div>
          <div className="map-stat-card orange">
            <span className="map-stat-icon">◎</span>
            <div><strong>81</strong><small>İl</small></div>
          </div>
          <div className="map-stat-card soft">
            <span className="map-stat-icon">✓</span>
            <div><strong>2026</strong><small>Güncel veriler</small></div>
          </div>
        </div>

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
            selectedUniversity={
              selectedUniversity
            }
          />

          <MarkerClusterGroup
            chunkedLoading={true}
            maxClusterRadius={70}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
            zoomToBoundsOnClick={true}
            disableClusteringAtZoom={12}
          >

            {filteredUniversities.map(
              (university) => (

                <Marker
                  key={
                    university.id
                  }

                  position={[
                    university.latitude,
                    university.longitude,
                  ]}

                  icon={
                    selectedUniversity?.id === university.id
                      ? selectedUniversityIcon
                      : universityIcon
                  }
                >

                  {/* HOVER İSİM */}

                  <Tooltip
                    direction="top"
                    offset={[
                      0,
                      -35,
                    ]}
                    opacity={0.95}
                    sticky
                  >

                    <span className="university-tooltip">
                      {
                        university.name
                      }
                    </span>

                  </Tooltip>

                  {/* POPUP */}

                  <Popup>

                    <div className="popup">

                      <h2>
                        {
                          university.name
                        }
                      </h2>

                      <p>
                        <strong>
                          Şehir:
                        </strong>{" "}
                        {
                          university.city
                        }
                      </p>

                      <p>
                        <strong>
                          Tür:
                        </strong>{" "}
                        {
                          university.type
                        }
                      </p>

                      <button
                        className="open-university-button"
                        onClick={() =>
                          openUniversity(
                            university
                          )
                        }
                      >
                        Üniversiteyi incele
                      </button>

                    </div>

                  </Popup>

                </Marker>
              )
            )}

          </MarkerClusterGroup>

        </MapContainer>

        <div className="dashboard-bottom">
          <button className="dashboard-card image-card popular" type="button" onClick={openBrowse}>
            <span className="dashboard-card-overlay">
              <small>KEŞFET</small>
              <strong>Üniversiteleri<br />Keşfet</strong>
              <em>Şehir ve kampüsleri keşfet →</em>
            </span>
          </button>
          <button className="dashboard-card image-card strategy" type="button" onClick={() => setFiltersOpen(true)}>
            <span className="dashboard-card-overlay">
              <small>VERİ</small>
              <strong>2026 Taban<br />Verileri</strong>
              <em>Güncel programları keşfet →</em>
            </span>
          </button>
          <button className="dashboard-card image-card list" type="button" onClick={() => toggleFloatingPanel("preferences")}>
            <span className="dashboard-card-overlay">
              <small>KİŞİSEL</small>
              <strong>Tercih<br />Listem</strong>
              <em>Kendine özel liste oluştur →</em>
            </span>
          </button>
          <div className="dashboard-quote-card">
            <span>“</span>
            <strong>Doğru tercih,<br />daha güçlü bir gelecek.</strong>
            <small>Türkiye Üniversite Haritası</small>
          </div>
        </div>

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

              onClick={() => {
                setSelectedUniversity(
                  null
                );

                setUniversityPrograms(
                  []
                );
              }}
            >
              ✕
            </button>

            <div className="university-panel-header">

              <div className="detail-label">
                ÜNİVERSİTE
              </div>

              <h2>
                {
                  selectedUniversity.name
                }
              </h2>

              <p>
                {
                  selectedUniversity.city
                }{" "}
                •{" "}
                {
                  selectedUniversity.type
                }
              </p>

            </div>

            {loadingUniversityPrograms ? (

              <div className="program-loading-box">

                <div className="loading-spinner" />

                <p>
                  Programlar yükleniyor...
                </p>

              </div>

            ) : (

              <>

                <div className="university-stats">

                  <div className="university-stat">

                    <strong>
                      {
                        visibleUniversityPrograms.length
                      }
                    </strong>

                    <span>
                      Program
                    </span>

                  </div>

                  <div className="university-stat">

                    <strong>
                      {
                        selectedUniversity
                          .type
                          ?.includes(
                            "Vakıf"
                          )
                          ? "Vakıf"
                          : "Devlet"
                      }
                    </strong>

                    <span>
                      Kurum
                    </span>

                  </div>

                </div>

                <div className="university-program-header">

                  <h3>
                    Programlar
                  </h3>

                  <span>
                    {
                      visibleUniversityPrograms.length
                    }
                  </span>

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
                  value={
                    universityProgramSearch
                  }
                  onChange={(event) =>
                    setUniversityProgramSearch(
                      event.target.value
                    )
                  }
                />

                <div className="university-program-list">

                  {visibleUniversityPrograms.length >
                  0 ? (

                    visibleUniversityPrograms.map(
                      (program) => {

                        const normalized =
                          normalizeProgram(
                            program
                          );

                        return (
                          <div
                            key={
                              program.code
                            }
                            className="university-program-item"
                          >

                            <button
                              className="university-program-main"
                              onClick={() =>
                                openProgram(
                                  program,
                                  selectedUniversity
                                )
                              }
                            >

                              <strong>
                                {
                                  normalized.displayName
                                }
                              </strong>

                              <span>
                                {
                                  normalized.displayScore
                                }{" "}
                                •{" "}
                                {
                                  normalized.displayDuration
                                }{" "}
                                yıl
                              </span>

                              <small>
                                TBS:{" "}
                                {
                                  formatNumber(
                                    normalized.displayRank
                                  )
                                }{" "}
                                • Kontenjan:{" "}
                                {
                                  normalized.displayQuota
                                }
                              </small>

                            </button>

                            <div className="program-card-actions">
                              <button
                                type="button"
                                className={
                                  isInPreferences(
                                    normalized
                                  )
                                    ? "program-add-button added"
                                    : "program-add-button"
                                }
                                onClick={() =>
                                  addToPreferences(
                                    normalized
                                  )
                                }
                                title={
                                  isInPreferences(normalized)
                                    ? "Tercih listesinde"
                                    : "Tercih listesine ekle"
                                }
                              >
                                {
                                  isInPreferences(
                                    normalized
                                  )
                                    ? "✓"
                                    : "⭐"
                                }
                              </button>

                              <button
                                type="button"
                                className={
                                  isInComparison(normalized)
                                    ? "program-compare-button selected"
                                    : "program-compare-button"
                                }
                                onClick={() =>
                                  toggleComparison(
                                    normalized
                                  )
                                }
                                title={
                                  isInComparison(normalized)
                                    ? "Karşılaştırmadan çıkar"
                                    : "Karşılaştırmaya ekle"
                                }
                              >
                                {
                                  isInComparison(normalized)
                                    ? "✓"
                                    : "⇄"
                                }
                              </button>
                            </div>

                          </div>
                        );
                      }
                    )

                  ) : (

                    <div className="empty-programs">
                      Program bulunamadı.
                    </div>

                  )}

                </div>

              </>

            )}

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

    </div>
  );
}

export default App;
