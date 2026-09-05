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

function getStrategyStatus(program, studentRank) {
  const programRank = numberValue(
    program.successRank ?? program.basariSirasi ?? program.displayRank
  );

  if (!Number.isFinite(studentRank) || programRank === null) {
    return {
      key: "unknown",
      label: "Veri yok",
    };
  }

  if (programRank < studentRank * 0.85) {
    return {
      key: "risky",
      label: "Riskli",
    };
  }

  if (programRank <= studentRank * 1.15) {
    return {
      key: "balanced",
      label: "Dengeli",
    };
  }

  return {
    key: "safe",
    label: "Güvenli",
  };
}

function getStrategyReason(program, studentRank) {
  const programRank = numberValue(
    program.successRank ?? program.basariSirasi ?? program.displayRank
  );

  if (!Number.isFinite(studentRank) || programRank === null) {
    return "Başarı sırası verisi değerlendirilemedi.";
  }

  const ratio = programRank / studentRank;

  if (ratio < 0.85) {
    return `Geçen yıl ${formatNumber(programRank)} sıralamayla kapattı; senden daha iyi sıra istiyor.`;
  }

  if (ratio <= 1.15) {
    return `Geçen yıl ${formatNumber(programRank)} sıralamayla kapattı; sıralamana yakın.`;
  }

  return `Geçen yıl ${formatNumber(programRank)} sıralamayla kapattı; daha geniş güven payı var.`;
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

  const [searchPrograms, setSearchPrograms] =
    useState([]);

  const [searchProgramsLoaded, setSearchProgramsLoaded] =
    useState(false);

  const [loadingSearchPrograms, setLoadingSearchPrograms] =
    useState(false);

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

  const [fitRank, setFitRank] =
    useState("");

  const [fitScoreType, setFitScoreType] =
    useState("SAY");

  const [fitEducation, setFitEducation] =
    useState("Lisans");

  const [fitMode, setFitMode] =
    useState("strict");

  const [fitSearch, setFitSearch] =
    useState("");

  const [fitOpen, setFitOpen] =
    useState(false);

  const [filtersOpen, setFiltersOpen] =
    useState(false);

  const [preferenceOpen, setPreferenceOpen] =
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

  const toggleFloatingPanel = (panel) => {
    const isOpen =
      panel === "fit"
        ? fitOpen
        : panel === "filters"
          ? filtersOpen
          : preferenceOpen;

    setFitOpen(false);
    setFiltersOpen(false);
    setPreferenceOpen(false);

    if (!isOpen) {
      if (panel === "fit") {
        setFitOpen(true);
      } else if (panel === "filters") {
        setFiltersOpen(true);
      } else {
        setPreferenceOpen(true);
      }
    }
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
  // SUITABLE PROGRAMS
  // ==================================================

  const suitablePrograms =
    useMemo(() => {
      if (
        !searchProgramsLoaded ||
        fitRank === ""
      ) {
        return [];
      }

      const studentRank =
        Number(fitRank);

      if (
        !Number.isFinite(
          studentRank
        )
      ) {
        return [];
      }

      const fitQuery =
        normalize(fitSearch);

      return searchPrograms.filter(
        (program) => {
          const university =
            universityMap.get(
              program.universityId
            );

          if (!university) {
            return false;
          }

          const programRank =
            numberValue(
              program.successRank
            );

          if (
            programRank === null
          ) {
            return false;
          }

          const safeRank =
            Math.round(studentRank * 1.25);

          const rankMatch =
            fitMode === "ambitious"
              ? programRank >= Math.round(studentRank * 0.8)
              : fitMode === "safe"
                ? programRank >= safeRank
                : programRank >= studentRank;

          const scoreMatch =
            fitScoreType ===
              "Tümü" ||
            program.scoreType ===
              fitScoreType;

          const duration =
            numberValue(
              program.duration
            );

          const education =
            duration === 2
              ? "Önlisans"
              : "Lisans";

          const educationMatch =
            fitEducation ===
              "Tümü" ||
            education ===
              fitEducation;

          const cityMatch =
            cityFilter ===
              "Tümü" ||
            sameCity(
              university.city,
              cityFilter
            );

          const typeMatch =
            typeFilter ===
              "Tümü" ||
            university.type ===
              typeFilter;

          const queryMatch =
            !fitQuery ||
            normalize(
              program.name
            ).includes(
              fitQuery
            );

          return (
            rankMatch &&
            scoreMatch &&
            educationMatch &&
            cityMatch &&
            typeMatch &&
            queryMatch
          );
        }
      )
        .sort(
          (a, b) =>
            numberValue(
              a.successRank
            ) -
            numberValue(
              b.successRank
            )
        );
    }, [
      searchPrograms,
      searchProgramsLoaded,
      universityMap,
      fitRank,
      fitScoreType,
      fitEducation,
      fitSearch,
      fitMode,
      cityFilter,
      typeFilter,
    ]);

  // ==================================================
  // UNIVERSITIES FOR SUITABLE SEARCH
  // ==================================================

  const suitableUniversities =
    useMemo(() => {
      if (
        !fitRank ||
        !searchProgramsLoaded
      ) {
        return baseFilteredUniversities;
      }

      const ids =
        new Set(
          suitablePrograms.map(
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
      fitRank,
      searchProgramsLoaded,
      suitablePrograms,
      baseFilteredUniversities,
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

      if (
        fitRank !== ""
      ) {
        return suitableUniversities;
      }

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
      fitRank,
      suitableUniversities,
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
      query.length < 3 ||
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
  useEffect(() => {
    if (fitOpen && !searchProgramsLoaded) {
      loadSearchPrograms();
    }
  }, [fitOpen, searchProgramsLoaded, loadSearchPrograms]);

  // ==================================================
  // ÜNİVERSİTE İÇİNDE PROGRAMLAR
  // ==================================================

  const visibleUniversityPrograms =
    useMemo(() => {
      const query =
        normalize(
          universityProgramSearch
        );

      const normalized =
        universityPrograms.map(
          (program) => ({
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
          })
        );

      if (!query) {
        return normalized;
      }

      return normalized.filter(
        (program) =>
          normalize(
            program.displayName
          ).includes(query) ||
          normalize(
            program.displayScoreType
          ).includes(query)
      );
    }, [
      universityPrograms,
      universityProgramSearch,
    ]);
  // ==================================================
  // SEARCH RESULTS
  // ==================================================

  const searchResults =
    useMemo(() => {
      const query =
        normalize(search);

      if (!query) {
        return [];
      }

      const results = [];

      for (const university of baseFilteredUniversities) {
        if (
          results.length >=
          30
        ) {
          break;
        }

        const name =
          normalize(
            university.name
          );

        const city =
          normalize(
            university.city
          );

        if (
          name.includes(query) ||
          city.includes(query)
        ) {
          results.push({
            type: "university",
            university,
          });
        }
      }

      if (
        searchProgramsLoaded
      ) {
        for (const program of generalFilteredPrograms) {
          if (
            results.length >=
            30
          ) {
            break;
          }

          const programName =
            normalize(
              program.name
            );

          if (
            !programName.includes(
              query
            )
          ) {
            continue;
          }

          const university =
            universityMap.get(
              program.universityId
            );

          if (!university) {
            continue;
          }

          results.push({
            type: "program",
            university,
            program,
          });
        }
      }

      return results;
    }, [
      search,
      baseFilteredUniversities,
      searchProgramsLoaded,
      generalFilteredPrograms,
      universityMap,
    ]);

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

  const strategySummary = useMemo(() => {
    const studentRank = numberValue(fitRank);
    const summary = {
      risky: 0,
      balanced: 0,
      safe: 0,
      unknown: 0,
      scoreMismatch: 0,
    };

    for (const program of preferences) {
      const status = getStrategyStatus(program, studentRank);
      summary[status.key] += 1;

      const scoreType = program.scoreType ?? program.puanTuru;
      if (
        fitScoreType !== "Tümü" &&
        scoreType &&
        scoreType !== fitScoreType
      ) {
        summary.scoreMismatch += 1;
      }
    }

    return summary;
  }, [preferences, fitRank, fitScoreType]);

  const strategyRecommendations = useMemo(() => {
    const studentRank = numberValue(fitRank);

    if (!searchProgramsLoaded || !Number.isFinite(studentRank)) {
      return { risky: [], balanced: [], safe: [] };
    }

    const query = normalize(fitSearch);
    const buckets = { risky: [], balanced: [], safe: [] };

    for (const program of searchPrograms) {
      const scoreType = program.scoreType ?? program.puanTuru;
      if (fitScoreType !== "Tümü" && scoreType !== fitScoreType) continue;

      const duration = numberValue(program.duration ?? program.ogrenimSuresi);
      const education = duration === 2 ? "Önlisans" : "Lisans";
      if (fitEducation !== "Tümü" && education !== fitEducation) continue;

      const university = universityMap.get(program.universityId);
      if (!university) continue;
      if (cityFilter !== "Tümü" && !sameCity(university.city, cityFilter)) continue;
      if (typeFilter !== "Tümü" && university.type !== typeFilter) continue;

      const name = program.name ?? program.programName ?? program.birimAdi ?? "";
      if (query && !normalize(name).includes(query)) continue;

      const rank = numberValue(program.successRank ?? program.basariSirasi);
      if (rank === null) continue;

      const ratio = rank / studentRank;
      if (ratio < 0.55 || ratio > 2.25) continue;

      const status = getStrategyStatus(program, studentRank);
      if (!buckets[status.key]) continue;

      buckets[status.key].push({
        ...program,
        displayName: name || "Program",
        displayUniversity: program.universityName ?? university.name ?? "-",
        recommendationReason: getStrategyReason(program, studentRank),
        _distance: Math.abs(Math.log(ratio)),
      });
    }

    for (const key of Object.keys(buckets)) {
      buckets[key].sort((a, b) => a._distance - b._distance || numberValue(a.successRank) - numberValue(b.successRank));
      buckets[key] = buckets[key].slice(0, 6);
    }

    return buckets;
  }, [
    fitRank,
    fitScoreType,
    fitEducation,
    fitSearch,
    searchProgramsLoaded,
    searchPrograms,
    universityMap,
    cityFilter,
    typeFilter,
  ]);



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
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

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

                  searchResults.map(
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

                            onClick={() =>
                              openUniversity(
                                result.university
                              )
                            }
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

                            onClick={() =>
                              openProgram(
                                result.program,
                                result.university
                              )
                            }
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
                  )

                ) : (

                  <div className="no-result">
                    Sonuç bulunamadı.
                  </div>

                )}

              </div>
            )}

        </div>

        <div className="header-actions">

          <button
            className={`fit-button mobile-nav-button ${fitOpen ? "is-active" : ""}`}
            aria-label="Tercih Stratejim"
            aria-pressed={fitOpen}
            onClick={() =>
              toggleFloatingPanel("fit")
            }
          >
            <span className="mobile-nav-icon" aria-hidden="true">🎯</span>
            <span className="mobile-nav-label">Tercih Stratejim</span>
          </button>

          <button
            className={`header-list-button mobile-nav-button ${preferenceOpen ? "is-active" : ""}`}
            aria-label="Tercih Listem"
            aria-pressed={preferenceOpen}
            onClick={() =>
              toggleFloatingPanel("preferences")
            }
          >
            <span className="mobile-nav-icon" aria-hidden="true">⭐</span>
            <span className="mobile-nav-label">Tercih Listem</span>
            <span className="mobile-nav-count">{preferences.length}</span>
          </button>

          <button
            className={`filter-button mobile-nav-button ${filtersOpen ? "is-active" : ""}`}
            aria-label="Filtreler"
            aria-pressed={filtersOpen}
            onClick={() =>
              toggleFloatingPanel("filters")
            }
          >
            <span className="mobile-nav-icon" aria-hidden="true">⚙</span>
            <span className="mobile-nav-label">Filtreler</span>
            {activeFilterCount > 0 && (
              <span className="filter-count mobile-nav-filter-count">{activeFilterCount}</span>
            )}
          </button>

        </div>

      </header>

      {/* ========================================
          UYGUN PROGRAMLAR
      ======================================== */}

      {fitOpen && (
        <aside className="fit-panel">

          <div className="fit-panel-header">

            <div>

              <div className="detail-label">
                TERCİH STRATEJİSİ
              </div>

              <h2>
                Tercih listenizi dengele
              </h2>

            </div>

            <button
              className="close-button"
              onClick={() =>
                setFitOpen(false)
              }
            >
              ✕
            </button>

          </div>

          <p className="fit-description">
            Başarı sıranı gir. Tercih listen,
            geçen yılın taban başarı sıralarına göre
            riskli, dengeli ve güvenli olarak analiz edilir.
          </p>

          <label>
            Başarı sıran
          </label>

          <input
            className="fit-rank-input"
            type="number"
            min="1"
            placeholder="Örn. 150000"
            value={fitRank}
            onChange={(event) =>
              setFitRank(
                event.target.value
              )
            }
          />

          <label>
            Puan türün
          </label>

          <select
            value={fitScoreType}
            onChange={(event) =>
              setFitScoreType(
                event.target.value
              )
            }
          >
            <option value="Tümü">
              Tüm puan türleri
            </option>

            <option value="TYT">TYT</option>
            <option value="SAY">SAY</option>
            <option value="EA">EA</option>
            <option value="SÖZ">SÖZ</option>
            <option value="DİL">DİL</option>
          </select>

          <label>
            Eğitim türü
          </label>

          <select
            value={fitEducation}
            onChange={(event) =>
              setFitEducation(
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
            İstersen bölüm ara
          </label>

          <input
            className="fit-rank-input fit-search-input"
            type="text"
            placeholder="Örn. Bilgisayar Mühendisliği"
            value={fitSearch}
            onChange={(event) =>
              setFitSearch(event.target.value)
            }
          />

          {!fitRank ? (
            <div className="fit-summary">
              <span>
                Analizi başlatmak için başarı sıralanı gir.
              </span>
            </div>
          ) : preferences.length === 0 ? (
            <div className="fit-summary">
              <span>
                Analiz için önce tercih listene program ekle.
              </span>
            </div>
          ) : (
            <>
              <div className="strategy-summary-grid">
                <div className="strategy-count risky">
                  <strong>{strategySummary.risky}</strong>
                  <span>Riskli</span>
                </div>
                <div className="strategy-count balanced">
                  <strong>{strategySummary.balanced}</strong>
                  <span>Dengeli</span>
                </div>
                <div className="strategy-count safe">
                  <strong>{strategySummary.safe}</strong>
                  <span>Güvenli</span>
                </div>
              </div>

              <div className="strategy-warnings">
                {strategySummary.safe === 0 && (
                  <p>Listenizde güvenli tercih bulunmuyor; aşağıdaki önerilerden ekleyebilirsiniz.</p>
                )}
                {strategySummary.scoreMismatch > 0 && (
                  <p>{strategySummary.scoreMismatch} tercih seçtiğiniz puan türüyle uyuşmuyor.</p>
                )}
                {strategySummary.unknown > 0 && (
                  <p>{strategySummary.unknown} tercih için başarı sırası verisi yok.</p>
                )}
                {strategySummary.safe > 0 && strategySummary.balanced > 0 && (
                  <p>Listenizde riskli, dengeli ve güvenli seçeneklerden oluşan bir dağılım var.</p>
                )}
              </div>

              <div className="strategy-recommendations">
                <div className="strategy-section-title">
                  <div>
                    <strong>Sana uygun öneriler</strong>
                    <span>Başarı sırana en yakın seçenekler öne çıkarılır.</span>
                  </div>
                </div>

                {(["risky", "balanced", "safe"]).map((key) => {
                  const labels = {
                    risky: "Riskli seçenekler",
                    balanced: "Dengeli seçenekler",
                    safe: "Güvenli seçenekler",
                  };

                  return (
                    <div key={key} className={`strategy-recommendation-group ${key}`}>
                      <div className="strategy-group-heading">
                        <strong>{labels[key]}</strong>
                        <span>{strategyRecommendations[key].length} öneri</span>
                      </div>

                      {strategyRecommendations[key].length === 0 ? (
                        <div className="strategy-empty">Bu kategori için eşleşen program bulunamadı.</div>
                      ) : (
                        strategyRecommendations[key].map((program) => (
                          <div key={program.code} className="strategy-recommendation-card">
                            <div className="strategy-recommendation-content">
                              <strong>{program.displayName}</strong>
                              <small>{program.displayUniversity}</small>
                              <span>2026 başarı sırası: {formatNumber(program.successRank)}</span>
                              <em>{program.recommendationReason}</em>
                            </div>
                            <button
                              className={`strategy-add-button ${preferenceCodes.has(String(program.code)) ? "added" : ""}`}
                              type="button"
                              disabled={preferenceCodes.has(String(program.code))}
                              onClick={() => addToPreferences(program)}
                            >
                              {preferenceCodes.has(String(program.code)) ? "✓ Eklendi" : "+ Listeye ekle"}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="strategy-list-analysis">
                <div className="strategy-section-title">
                  <div>
                    <strong>Mevcut tercih listen</strong>
                    <span>Listenizdeki programların risk seviyeleri.</span>
                  </div>
                </div>

                <div className="strategy-program-list">
                  {preferences.map((program, index) => {
                    const status = getStrategyStatus(
                      program,
                      numberValue(fitRank)
                    );

                    return (
                      <div key={program.code} className="strategy-program-row">
                        <span>{index + 1}</span>
                        <div>
                          <strong>{program.displayName || program.name || "Program"}</strong>
                          <small>{program.displayUniversity || program.universityName || "-"}</small>
                        </div>
                        <em className={`strategy-tag ${status.key}`}>{status.label}</em>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

        </aside>
      )}

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
                  setFitRank("");
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
                    universityIcon
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

        {/* =====================================
            UNIVERSITY PANEL
        ===================================== */}

        {selectedUniversity &&
          !selectedProgram && (

          <aside className="university-panel">

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
                        universityPrograms.length
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

                            <button
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
                            >
                              {
                                isInPreferences(
                                  normalized
                                )
                                  ? "✓"
                                  : "+"
                              }
                            </button>

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
