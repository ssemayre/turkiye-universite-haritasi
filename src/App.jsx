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

function MapController({ selectedUniversity, focusTarget }) {
  const map = useMap();
  const lastTargetRef = useRef(null);

  useEffect(() => {
    const target = focusTarget || selectedUniversity;

    const latitude = Number(target?.latitude);
    const longitude = Number(target?.longitude);
    const zoom = Number(target?.zoom) || (focusTarget ? 15 : 12);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    const nextTargetKey = `${latitude}|${longitude}|${zoom}`;
    if (lastTargetRef.current === nextTargetKey) return;

    lastTargetRef.current = nextTargetKey;

    map.stop();
    map.setView([latitude, longitude], zoom, { animate: false });

    requestAnimationFrame(() => {
      map.invalidateSize({ pan: false, debounceMoveend: true });
      window.setTimeout(() => map.invalidateSize({ pan: false, debounceMoveend: true }), 80);
      window.setTimeout(() => map.invalidateSize({ pan: false, debounceMoveend: true }), 350);
    });
  }, [focusTarget, selectedUniversity, map]);

  return null;
}

// ==================================================
// APP
// ==================================================

import { useAuth } from './AuthContext';
import { supabase } from './supabaseClient';

function App() {
  const { user, openAuthModal, signOut } = useAuth();
  
  const [universities, setUniversities] = useState([]);

  useEffect(() => {
    const fetchUniversities = async () => {
      const { data, error } = await supabase.from('universities').select('id, name, lat, lng, type, city');
      if (error) {
        console.error("Error fetching universities:", error);
      } else if (data) {
        setUniversities(data.map(u => ({
          ...u,
          latitude: u.lat,
          longitude: u.lng
        })));
      }
    };
    fetchUniversities();
  }, []);
  
  // ── SOSYAL KATMAN ──────────────────────────────────────────
  const [campusDetailTab, setCampusDetailTab] = useState('info');
  const [expandedUnits, setExpandedUnits] = useState({});
  const [reviewVotes, setReviewVotes] = useState({});
  const [qaVotes, setQaVotes] = useState({});
  const [selectedSubCampus, setSelectedSubCampus] = useState(null);

  // --- BÖLÜMLER (PROGRAMS) YENİ YAPI ---
  const [campusPrograms, setCampusPrograms] = useState([]);
  const [isFetchingCampusPrograms, setIsFetchingCampusPrograms] = useState(false);
  const [programSearchQuery, setProgramSearchQuery] = useState('');
  const [expandedProgramId, setExpandedProgramId] = useState(null);

  // --- YENİ YORUM YAPISI ---
  const [realReviews, setRealReviews] = useState([]);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    setCampusDetailTab('info');
    setExpandedUnits({});
    setCampusPrograms([]); // Reset programs when campus changes
    setProgramSearchQuery('');
    setExpandedProgramId(null);
  }, [selectedSubCampus?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Programs Fetch
  useEffect(() => {
    if (selectedSubCampus && campusDetailTab === 'units') {
      fetchCampusPrograms();
    }
  }, [selectedSubCampus?.id, campusDetailTab]);

  const fetchCampusPrograms = async () => {
    if (!selectedSubCampus) return;
    setIsFetchingCampusPrograms(true);
    
    // JSON dosyasındaki ID ile Supabase'deki ID uyuşmayabilir (Örn: Yozgat Bozok JSON'da 1023, Supabase'de 937).
    // Bu yüzden doğru ID'yi isim eşleştirmesi ile 'universities' statinden buluyoruz.
    let correctUniId = selectedSubCampus.universityId || selectedSubCampus.id;
    if (universities && universities.length > 0) {
      const targetName = normalize(selectedSubCampus.originalUniName || selectedSubCampus.universityName || selectedSubCampus.name).split('(')[0].trim();
      const exactUni = universities.find(u => normalize(u.name).includes(targetName));
      if (exactUni) {
        correctUniId = exactUni.id;
      }
    }

    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('university_id', correctUniId);
    
    if (data) {
      setCampusPrograms(data);
    } else if (error) {
      console.error('Bölümler çekilirken hata:', error);
    }
    setIsFetchingCampusPrograms(false);
  };

  // Reviews Fetch
  useEffect(() => {
    if (selectedSubCampus && campusDetailTab === 'reviews') {
      fetchReviews();
    }
  }, [selectedSubCampus?.id, campusDetailTab]);

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('university_id', selectedSubCampus.id)
      .order('created_at', { ascending: false });
    if (data) setRealReviews(data);
  };

  const submitReview = async () => {
    if (reviewRating === 0) {
      alert('Lütfen bir yıldız puanı seçin!');
      return;
    }
    if (!reviewContent.trim()) {
      alert('Lütfen yorumunuzu yazın!');
      return;
    }
    setIsSubmittingReview(true);

    const { data, error } = await supabase.from('comments').insert({
      university_id: selectedSubCampus.id,
      user_id: user.id,
      rating: reviewRating,
      content: reviewContent
    }).select('*').single();

    setIsSubmittingReview(false);
    
    if (error) {
      alert('Yorum gönderilirken hata oluştu: ' + error.message);
    } else {
      setIsReviewFormOpen(false);
      setReviewRating(0);
      setReviewContent('');
      setRealReviews([data, ...realReviews]);
    }
  };

  // --- YENİ SORU CEVAP YAPISI ---
  const [realQuestions, setRealQuestions] = useState([]);
  const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false);
  const [questionContent, setQuestionContent] = useState('');
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  
  const [replyingToQuestionId, setReplyingToQuestionId] = useState(null);
  const [answerContent, setAnswerContent] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

  useEffect(() => {
    if (selectedSubCampus && campusDetailTab === 'qa') {
      fetchQuestions();
    }
  }, [selectedSubCampus?.id, campusDetailTab]);

  const fetchQuestions = async () => {
    const { data, error } = await supabase
      .from('questions')
      .select('*, answers(*)')
      .eq('university_id', selectedSubCampus.id)
      .order('created_at', { ascending: false });
      
    if (data) {
      const sorted = data.map(q => ({
        ...q,
        answers: (q.answers || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      }));
      setRealQuestions(sorted);
    }
  };

  const submitQuestion = async () => {
    if (!questionContent.trim()) {
      alert('Lütfen sorunuzu yazın!');
      return;
    }
    setIsSubmittingQuestion(true);

    const { data, error } = await supabase.from('questions').insert({
      university_id: selectedSubCampus.id,
      user_id: user.id,
      content: questionContent
    }).select('*').single();

    setIsSubmittingQuestion(false);
    
    if (error) {
      alert('Soru gönderilirken hata oluştu: ' + error.message);
    } else {
      setIsQuestionFormOpen(false);
      setQuestionContent('');
      setRealQuestions([{...data, answers: []}, ...realQuestions]);
    }
  };

  const submitAnswer = async (questionId) => {
    if (!answerContent.trim()) {
      alert('Lütfen cevabınızı yazın!');
      return;
    }
    setIsSubmittingAnswer(true);

    const { data, error } = await supabase.from('answers').insert({
      question_id: questionId,
      user_id: user.id,
      content: answerContent
    }).select('*').single();

    setIsSubmittingAnswer(false);
    
    if (error) {
      alert('Cevap gönderilirken hata oluştu: ' + error.message);
    } else {
      setReplyingToQuestionId(null);
      setAnswerContent('');
      
      setRealQuestions(prev => prev.map(q => {
         if (q.id === questionId) {
             return { ...q, answers: [...(q.answers || []), data] };
         }
         return q;
      }));
    }
  };

  // --- OYLAMA YAPISI ---
  const [voteTotals, setVoteTotals] = useState({});
  const [userVotes, setUserVotes] = useState({});

  const fetchVotes = async () => {
    const items = [];
    realReviews.forEach(r => items.push({ type: 'comment', id: r.id }));
    realQuestions.forEach(q => {
        items.push({ type: 'question', id: q.id });
        if (q.answers) {
            q.answers.forEach(a => items.push({ type: 'answer', id: a.id }));
        }
    });

    if (items.length === 0) return;
    const ids = items.map(i => i.id);
    
    const { data } = await supabase.from('votes').select('*').in('item_id', ids);
    if (data) {
        const totals = {};
        const userV = {};
        data.forEach(v => {
            // Check if this vote's item_type matches one of our items
            const isValid = items.some(i => i.id === v.item_id && i.type === v.item_type);
            if (!isValid) return;

            const key = `${v.item_type}_${v.item_id}`;
            totals[key] = (totals[key] || 0) + v.vote_value;
            if (user && v.user_id === user.id) {
                userV[key] = v.vote_value;
            }
        });
        setVoteTotals(totals);
        setUserVotes(userV);
    }
  };

  useEffect(() => {
    fetchVotes();
  }, [realReviews, realQuestions, user]);

  const handleVote = async (type, id, value) => {
    if (!user) {
       openAuthModal();
       return;
    }
    const key = `${type}_${id}`;
    const currentValue = userVotes[key] || 0;
    
    let newValue = value;
    if (currentValue === value) {
       newValue = 0; // Cancel vote
    }
    
    const diff = newValue - currentValue;
    setVoteTotals(prev => ({ ...prev, [key]: (prev[key] || 0) + diff }));
    setUserVotes(prev => ({ ...prev, [key]: newValue }));

    // Execute in DB
    await supabase.from('votes').delete().match({ user_id: user.id, item_type: type, item_id: id });
    if (newValue !== 0) {
       await supabase.from('votes').insert({ user_id: user.id, item_type: type, item_id: id, vote_value: newValue });
    }
  };


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

  const [showMyo, setShowMyo] = useState(false);

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
  }, [universities]);

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
  }, [universities]);

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
          if (!showMyo && university.type === 'MYO') return false;

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
      showMyo,
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

        setSelectedUniversity(null); // DISABLED the old flat list
        setSelectedProgram(null);
        setCampusFocusOnly(false);

        // Redirect to campuses logic using fuzzy matching
        const norm = (s) => (s||'').toLowerCase().replace(/\s+/g,'').replace(/\(.*?\)/g, '');
        const uName = norm(university.name);
        
        let mainCampus = allCampusesList.find(c => c.isMain && norm(c.universityName) === uName);
        if (!mainCampus) {
            mainCampus = allCampusesList.find(c => c.isMain && (norm(c.universityName).includes(uName) || uName.includes(norm(c.universityName))));
        }
        
        if (mainCampus) {
            setSelectedSubCampus(mainCampus);
            setMapFocus({ latitude: Number(mainCampus.latitude), longitude: Number(mainCampus.longitude), zoom: 14 });
        } else {
            const anyCampus = allCampusesList.find(c => norm(c.universityName) === uName || norm(c.universityName).includes(uName) || uName.includes(norm(c.universityName)));
            if (anyCampus) {
                setSelectedSubCampus(anyCampus);
                setMapFocus({ latitude: Number(anyCampus.latitude), longitude: Number(anyCampus.longitude), zoom: 14 });
            }
        }
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
    <div className="app" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>

      {/* ========================================
          UNIFIED MOBILE & DESKTOP HEADER
      ======================================== */}
      <header className="header-unified" style={{ flexShrink: 0, position: 'relative', zIndex: 2000, background: 'rgba(255, 255, 255, 0.94)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: 'max(12px, env(safe-area-inset-top)) 16px 12px 16px', display: 'flex', flexDirection: 'column', gap: '12px', pointerEvents: 'auto' }}>
        
        {/* Satır 1: Başlık ve Kullanıcı Profil */}
        <div className="logo-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '22px' }}>🎓</span> Türkiye Üniversite Haritası
          </h1>
          
          <div className="user-profile-section" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '4px 12px 4px 4px', borderRadius: '20px', fontSize: '14px', fontWeight: '500', color: '#475569' }}>
                <img src={user.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} alt="Avatar" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                <span>{user.user_metadata?.full_name || user.email?.split('@')[0]}</span>
                <button onClick={() => window.confirm('Çıkış yapmak istiyor musunuz?') && signOut()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', marginLeft: '4px', color: '#ef4444', fontWeight: 'bold' }}>✕</button>
              </div>
            ) : (
              <button onClick={openAuthModal} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '20px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)' }}>
                Giriş Yap
              </button>
            )}
          </div>
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
              className={`pill-btn ${showMyo ? 'active' : ''}`}
              onClick={() => setShowMyo(!showMyo)}>
              🏢 Tüm MYO'ları Göster
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
      <main className="map-area-unified" style={{ flex: 1, display: 'flex', flexDirection: 'row', position: 'relative', width: '100%', overflow: 'hidden', zIndex: 10 }}>
        <div style={{ flex: 1, position: 'relative' }}>
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
              <Popup autoPan={true} autoPanPaddingTopLeft={[0, 250]} autoPanPaddingBottomRight={[0, 20]} minWidth={240} maxWidth={300}>
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
          ) : (
            <MarkerClusterGroup
              chunkedLoading={true}
              maxClusterRadius={70}
              spiderfyOnMaxZoom={true}
              showCoverageOnHover={false}
              zoomToBoundsOnClick={true}
              disableClusteringAtZoom={13}
            >
              {filteredUniversities.map(university => (
                 <Marker 
                    key={university.id} 
                    position={[Number(university.latitude), Number(university.longitude)]} 
                    icon={university.type === 'Ana Kampüs' ? mainCampusIcon : subCampusIcon} 
                    eventHandlers={{ click: () => setSelectedSubCampus(university) }}
                 >
                    <Tooltip direction="top" offset={[0, -18]} opacity={0.95} sticky>
                       <span className="university-tooltip"><strong>{university.city}</strong><br/>{university.name}</span>
                    </Tooltip>
                    <Popup autoPan={true} autoPanPaddingTopLeft={[0, 250]} autoPanPaddingBottomRight={[0, 20]} minWidth={240} maxWidth={300}>
                       <div className="campus-popup" style={{ textAlign: 'center', padding: '5px' }}>
                         <div className="detail-label" style={{ fontSize: '10px', color: '#6366f1', fontWeight: 'bold' }}>
                           {university.type === 'Ana Kampüs' ? "ANA YERLEŞKE" : "ALT YERLEŞKE"}
                         </div>
                         <h3 style={{ margin: '5px 0', fontSize: '14px' }}>{university.name}</h3>
                         <p style={{ margin: '0', fontSize: '12px', color: '#64748b' }}>{university.city}</p>
                         <button 
                           style={{ marginTop: '10px', background: '#2563eb', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                           className="open-university-button"
                           onClick={(e) => { e.stopPropagation(); setSelectedSubCampus(university); }}
                         >
                           Detayları Gör
                         </button>
                       </div>
                    </Popup>
                 </Marker>
              ))}
            </MarkerClusterGroup>
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
            {/* ── DİNAMİK BAŞLIK VE KAPAT BUTONU ── */}
            <div className="csd-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px', flexShrink: 0, borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 4px 0', lineHeight: '1.2' }}>
                  {selectedSubCampus.name}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    {selectedSubCampus.universityName}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px', background: selectedSubCampus.isMain ? '#fef3c7' : '#dcfce3', color: selectedSubCampus.isMain ? '#d97706' : '#16a34a' }}>
                    {selectedSubCampus.isMain ? 'Ana Kampüs' : 'Alt Yerleşke'}
                  </span>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedSubCampus(null)}
                style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f1f5f9', border: 'none', color: '#475569', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
              >
                ✕
              </button>
            </div>

            {/* ── TAB BAR ── */}
            <div className="csd-tabbar">
              {[
                { key: 'info',    label: 'Bilgi',            icon: 'ℹ️' },
                { key: 'units',   label: 'Bölümler',         icon: '📚' },
                { key: 'campuses',label: 'Yerleşkeler',      icon: '🏢' },
                { key: 'reviews', label: 'Değerlendirmeler', icon: '⭐' },
                { key: 'qa',      label: 'Soru & Cevap',     icon: '💬' },
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
                <div className="csd-section-list" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                  
                  {/* Sticky Search Bar */}
                  <div style={{ flexShrink: 0, position: 'sticky', top: 0, zIndex: 10, background: '#fff', padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                    <input 
                      type="text" 
                      placeholder="Bu üniversitede program ara..." 
                      value={programSearchQuery}
                      onChange={(e) => setProgramSearchQuery(e.target.value)}
                      style={{ width: '100%', padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', background: '#f8fafc', color: '#1e293b' }}
                    />
                  </div>

                  {/* Scrollable List Area */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {isFetchingCampusPrograms ? (
                      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                        <div className="spinner" style={{ margin: '0 auto 16px', width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        <h4 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '15px' }}>Veriler Çekiliyor</h4>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>
                          Bölüm ve program verileri yükleniyor...
                        </p>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                      </div>
                    ) : campusPrograms && campusPrograms.length > 0 ? (
                      (() => {
                        const filtered = campusPrograms.filter(p => (p.name || '').toLocaleLowerCase('tr-TR').includes(programSearchQuery.toLocaleLowerCase('tr-TR')));
                        if (filtered.length === 0) {
                          return <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', padding: '20px' }}>Aradığınız kriterlere uygun program bulunamadı.</p>;
                        }
                        return filtered.map((p, idx) => {
                          const isExpanded = expandedProgramId === idx;
                          return (
                            <div key={idx} style={{ flexShrink: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}>
                              
                              {/* CLOSED VIEW (HEADER) */}
                              <div 
                                onClick={() => setExpandedProgramId(isExpanded ? null : idx)}
                                style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isExpanded ? '#f8fafc' : '#fff' }}
                              >
                                <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px', lineHeight: '1.4', paddingRight: '12px' }}>
                                  {p.name}
                                </span>
                                <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#cbd5e1' }} onClick={(e) => { e.stopPropagation(); /* Favorite Logic */ }}>
                                  ⭐
                                </button>
                              </div>

                              {/* EXPANDED VIEW (DETAILS) */}
                              {isExpanded && (
                                <div style={{ padding: '0 16px 16px 16px', borderTop: '1px solid #f1f5f9' }}>
                                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span style={{ fontSize: '12px', fontWeight: '600', padding: '4px 8px', borderRadius: '6px', background: p.degree_level === 'Önlisans' ? '#eff6ff' : '#f0fdf4', color: p.degree_level === 'Önlisans' ? '#3b82f6' : '#16a34a' }}>
                                        {p.degree_level === 'Önlisans' ? 'TYT • 2 Yıl' : 'Lisans • 4 Yıl'}
                                      </span>
                                      <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>
                                        {p.faculty || 'Fakülte belirtilmemiş'}
                                      </span>
                                    </div>
                                    <button 
                                      onClick={() => {
                                        if (p.campus_id) {
                                          const exactCampus = universities.find(u => String(u.id) === String(p.campus_id));
                                          if (exactCampus && exactCampus.lat) {
                                            setMapFocus({ latitude: Number(exactCampus.lat), longitude: Number(exactCampus.lng), zoom: 16 });
                                          }
                                        } else if (selectedSubCampus && selectedSubCampus.latitude && selectedSubCampus.longitude) {
                                          setMapFocus({ latitude: Number(selectedSubCampus.latitude), longitude: Number(selectedSubCampus.longitude), zoom: 15 });
                                        }
                                      }}
                                      style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                      📍 Haritada Göster
                                    </button>
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                    <div>
                                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Puan Türü</div>
                                      <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: '600' }}>{p.score_type || '-'}</div>
                                    </div>
                                    <div>
                                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kontenjan</div>
                                      <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: '600' }}>{p.quota || '-'}</div>
                                    </div>
                                    <div>
                                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Taban Puan</div>
                                      <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: '600' }}>{p.base_score || '-'}</div>
                                    </div>
                                    <div>
                                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Başarı Sırası</div>
                                      <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: '600' }}>{p.rank || '-'}</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()
                    ) : (
                      <div className="csd-empty" style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
                        <h4 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '15px' }}>Bölüm Bulunamadı</h4>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>
                          Bu üniversiteye ait bölüm veya program verisi bulunamadı.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ━━ YERLEŞKELER ━━ */}
              {campusDetailTab === 'campuses' && (
                <div className="csd-section-list">
                  {(() => {
                    // Extract core name (e.g., "KOCAELİ" from "KOCAELİ ÜNİVERSİTESİ")
                    let coreName = normalize(selectedSubCampus.name);
                    coreName = coreName.replace(/universitesi/g, '').replace(/uni\./g, '').replace(/uni/g, '').trim();
                    
                    // Fallback to first word if coreName is empty
                    if (!coreName) coreName = normalize(selectedSubCampus.name).split(' ')[0];
                    
                    const relatedMyos = universities.filter(u => {
                      if (u.type !== 'MYO' || u.id === selectedSubCampus.id) return false;
                      const normalizedMyo = normalize(u.name);
                      return normalizedMyo.includes(coreName) || coreName.includes(normalizedMyo);
                    });
                    
                    return (
                      <>
                        <div className="csd-card">
                          <h3 style={{ margin: '0 0 10px 0', fontSize: '15px' }}>Bağlı Meslek Yüksekokulları (MYO)</h3>
                          {relatedMyos.length === 0 ? (
                            <div className="csd-empty" style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px' }}>
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                              </svg>
                              <h4 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '15px' }}>MYO Bulunamadı</h4>
                              <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>Bu üniversiteye ait kayıtlı Meslek Yüksekokulu bulunmuyor.</p>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {relatedMyos.map(myo => (
                                <button
                                  key={myo.id}
                                  style={{ textAlign: 'left', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                  onClick={() => {
                                    setMapFocus({ latitude: Number(myo.latitude), longitude: Number(myo.longitude), zoom: 15 });
                                    setSelectedSubCampus(myo);
                                    setCampusDetailTab('info');
                                  }}
                                >
                                  <span style={{ fontWeight: '500', color: '#1e293b', fontSize: '14px' }}>{myo.name}</span>
                                  <span style={{ fontSize: '12px', color: '#3b82f6', background: '#eff6ff', padding: '4px 10px', borderRadius: '12px', whiteSpace: 'nowrap', marginLeft: '8px' }}>Haritada Gör</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* ━━ DEĞERLENDİRMELER ━━ */}
              {campusDetailTab === 'reviews' && (
                <div className="csd-section-list">
                  <div className="csd-rating-summary">
                    <div className="csd-rating-score">
                      {(realReviews.length > 0 ? (realReviews.reduce((a,b) => a + b.rating, 0) / realReviews.length).toFixed(1) : "0.0")}
                    </div>
                    <div>
                      <div className="csd-stars" style={{ color: '#f59e0b' }}>
                        {'★'.repeat(Math.round(realReviews.length > 0 ? (realReviews.reduce((a,b) => a + b.rating, 0) / realReviews.length) : 0))}
                        {'☆'.repeat(5 - Math.round(realReviews.length > 0 ? (realReviews.reduce((a,b) => a + b.rating, 0) / realReviews.length) : 0))}
                      </div>
                      <div className="csd-rating-count">{realReviews.length} değerlendirme</div>
                    </div>
                    {!isReviewFormOpen && (
                      <button 
                        className="csd-add-review-btn" 
                        onClick={() => user ? setIsReviewFormOpen(true) : openAuthModal()}
                      >
                        + Yorum Yap
                      </button>
                    )}
                  </div>
                  
                  {isReviewFormOpen && (
                    <div className="csd-review-form" style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#1e293b' }}>Puanınız</h4>
                      <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <span 
                            key={star} 
                            onClick={() => setReviewRating(star)}
                            style={{ cursor: 'pointer', fontSize: '24px', color: star <= reviewRating ? '#f59e0b' : '#cbd5e1' }}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#1e293b' }}>Yorumunuz</h4>
                      <textarea 
                        value={reviewContent}
                        onChange={(e) => setReviewContent(e.target.value)}
                        placeholder="Bu yerleşke hakkında ne düşünüyorsunuz?"
                        style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical', fontFamily: 'inherit', fontSize: '14px', boxSizing: 'border-box', marginBottom: '15px' }}
                      />
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => setIsReviewFormOpen(false)}
                          style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', cursor: 'pointer', fontWeight: '500' }}
                          disabled={isSubmittingReview}
                        >
                          İptal
                        </button>
                        <button 
                          onClick={submitReview}
                          style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: '500' }}
                          disabled={isSubmittingReview}
                        >
                          {isSubmittingReview ? 'Gönderiliyor...' : 'Gönder'}
                        </button>
                      </div>
                    </div>
                  )}

                  {realReviews.length === 0 ? (
                    <div className="csd-empty" style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px' }}>
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                      </svg>
                      <h4 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '15px' }}>Henüz Değerlendirme Yok</h4>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>İlk değerlendiren siz olun ve diğer öğrencilere rehberlik edin!</p>
                    </div>
                  ) : (
                    realReviews.map(review => {
                      const vKey = `comment_${review.id}`;
                      const score = voteTotals[vKey] || 0;
                      const uVote = userVotes[vKey] || 0;
                      return (
                      <div key={review.id} className="csd-review-card">
                        <div className="csd-review-top">
                          <span className="csd-review-avatar" style={{ background: '#3b82f6', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                            👤
                          </span>
                          <div className="csd-review-meta">
                            <span className="csd-review-author">Kayıtlı Öğrenci</span>
                            <span className="csd-review-date">{new Date(review.created_at).toLocaleDateString('tr-TR')}</span>
                          </div>
                          <div className="csd-review-stars">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} style={{ color: i < review.rating ? '#f59e0b' : '#e2e8f0', fontSize: '15px' }}>★ </span>
                            ))}
                          </div>
                        </div>
                        <p className="csd-review-text">{review.content}</p>
                        <div className="csd-review-actions" style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                          <button
                            className={`csd-vote-btn ${uVote === 1 ? 'csd-vote-btn--active' : ''}`}
                            onClick={() => handleVote('comment', review.id, 1)}
                            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', background: uVote === 1 ? '#eff6ff' : 'white', color: uVote === 1 ? '#3b82f6' : '#64748b', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            👍 <span style={{ fontWeight: '600' }}>{score > 0 ? `+${score}` : (score < 0 ? score : 'Yararlı')}</span>
                          </button>
                          <button
                            className={`csd-vote-btn ${uVote === -1 ? 'csd-vote-btn--active-down' : ''}`}
                            onClick={() => handleVote('comment', review.id, -1)}
                            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', background: uVote === -1 ? '#fee2e2' : 'white', color: uVote === -1 ? '#ef4444' : '#64748b', cursor: 'pointer', fontSize: '12px' }}
                          >
                            👎
                          </button>
                        </div>
                      </div>
                    )})
                  )}
                </div>
              )}

              {/* ━━ SORU & CEVAP ━━ */}
              {campusDetailTab === 'qa' && (
                <div className="csd-section-list">
                  {!isQuestionFormOpen && (
                    <button 
                      className="csd-ask-btn" 
                      onClick={() => user ? setIsQuestionFormOpen(true) : openAuthModal()}
                    >
                      + Soru Sor
                    </button>
                  )}

                  {isQuestionFormOpen && (
                    <div className="csd-review-form" style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#1e293b' }}>Sorunuzu Yazın</h4>
                      <textarea 
                        value={questionContent}
                        onChange={(e) => setQuestionContent(e.target.value)}
                        placeholder="Örn: Yurt kapasitesi nasıl? Ulaşım zor mu?"
                        style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical', fontFamily: 'inherit', fontSize: '14px', boxSizing: 'border-box', marginBottom: '15px' }}
                      />
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => setIsQuestionFormOpen(false)}
                          style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', cursor: 'pointer', fontWeight: '500' }}
                          disabled={isSubmittingQuestion}
                        >
                          İptal
                        </button>
                        <button 
                          onClick={submitQuestion}
                          style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: '500' }}
                          disabled={isSubmittingQuestion}
                        >
                          {isSubmittingQuestion ? 'Gönderiliyor...' : 'Gönder'}
                        </button>
                      </div>
                    </div>
                  )}

                  {realQuestions.length === 0 ? (
                    <div className="csd-empty" style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px' }}>
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                      <h4 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '15px' }}>Henüz Soru Sorulmamış</h4>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>Bu üniversite hakkında merak ettiklerinizi sorun, cevaplayalım!</p>
                    </div>
                  ) : (
                    realQuestions.map(qa => {
                      const qKey = `question_${qa.id}`;
                      const qScore = voteTotals[qKey] || 0;
                      const qVote = userVotes[qKey] || 0;
                      return (
                      <div key={qa.id} className="csd-qa-item">
                        <div className="csd-qa-question-row">
                          <div className="csd-qa-votes">
                            <button 
                              className={`csd-upvote ${qVote === 1 ? 'csd-upvote--active' : ''}`}
                              onClick={() => handleVote('question', qa.id, 1)}
                              style={{ color: qVote === 1 ? '#3b82f6' : '#94a3b8' }}
                            >▲</button>
                            <span className="csd-vote-count">{qScore}</span>
                            <button 
                              className={`csd-downvote ${qVote === -1 ? 'csd-downvote--active' : ''}`}
                              onClick={() => handleVote('question', qa.id, -1)}
                              style={{ color: qVote === -1 ? '#ef4444' : '#94a3b8' }}
                            >▼</button>
                          </div>
                          <div className="csd-qa-question-body">
                            <p className="csd-qa-question-text">{qa.content}</p>
                            <div className="csd-qa-meta">
                              <span className="csd-qa-author">👤 Kayıtlı Öğrenci</span>
                              <span className="csd-qa-date">{new Date(qa.created_at).toLocaleDateString('tr-TR')}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="csd-qa-answers">
                          {qa.answers && qa.answers.map(ans => {
                            const aKey = `answer_${ans.id}`;
                            const aScore = voteTotals[aKey] || 0;
                            const aVote = userVotes[aKey] || 0;
                            return (
                            <div key={ans.id} className="csd-answer-row">
                              <div className="csd-qa-votes csd-qa-votes--sm">
                                <button 
                                  className={`csd-upvote ${aVote === 1 ? 'csd-upvote--active' : ''}`}
                                  onClick={() => handleVote('answer', ans.id, 1)}
                                  style={{ color: aVote === 1 ? '#3b82f6' : '#94a3b8' }}
                                >▲</button>
                                <span className="csd-vote-count csd-vote-count--sm">{aScore}</span>
                                <button 
                                  className={`csd-downvote ${aVote === -1 ? 'csd-downvote--active' : ''}`}
                                  onClick={() => handleVote('answer', ans.id, -1)}
                                  style={{ color: aVote === -1 ? '#ef4444' : '#94a3b8' }}
                                >▼</button>
                              </div>
                              <div className="csd-answer-body">
                                <div className="csd-answer-author">
                                  <span>👤</span>
                                  <strong>Kayıtlı Öğrenci</strong>
                                  <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px' }}>{new Date(ans.created_at).toLocaleDateString('tr-TR')}</span>
                                </div>
                                <p className="csd-answer-text">{ans.content}</p>
                              </div>
                            </div>
                          )})}
                          
                          {replyingToQuestionId === qa.id ? (
                            <div className="csd-review-form" style={{ marginTop: '15px', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                              <textarea 
                                value={answerContent}
                                onChange={(e) => setAnswerContent(e.target.value)}
                                placeholder="Cevabınızı yazın..."
                                style={{ width: '100%', height: '60px', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', resize: 'vertical', fontFamily: 'inherit', fontSize: '13px', boxSizing: 'border-box', marginBottom: '10px' }}
                              />
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button 
                                  onClick={() => { setReplyingToQuestionId(null); setAnswerContent(''); }}
                                  style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                                  disabled={isSubmittingAnswer}
                                >
                                  İptal
                                </button>
                                <button 
                                  onClick={() => submitAnswer(qa.id)}
                                  style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                                  disabled={isSubmittingAnswer}
                                >
                                  {isSubmittingAnswer ? 'Gönderiliyor...' : 'Gönder'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button 
                              className="csd-answer-btn" 
                              onClick={() => user ? setReplyingToQuestionId(qa.id) : openAuthModal()}
                            >
                              Cevap Ver
                            </button>
                          )}
                        </div>
                      </div>
                    )})
                  )}
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

