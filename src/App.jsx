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

function MapResizer({ isPanelOpen }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);
    return () => clearTimeout(timer);
  }, [map, isPanelOpen]);
  return null;
}

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
    if (selectedSubCampus) {
      fetchCampusPrograms();
    }
  }, [selectedSubCampus?.id]);

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
      .select('*, profiles(full_name, avatar_url, university_name, department_name)')
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
    }).select('*, profiles(full_name, avatar_url, university_name, department_name)').single();

    setIsSubmittingReview(false);
    
    if (error) {
      alert('Yorum gönderilirken hata oluştu: ' + error.message);
    } else {
      setIsReviewFormOpen(false);
      setReviewRating(0);
      setReviewContent('');

      // Optimistic UI fallback if join didn't return profile
      const newReview = data;
      if (newReview && !newReview.profiles) {
        newReview.profiles = {
          full_name: userProfileData.full_name || user.user_metadata?.full_name,
          avatar_url: userProfileData.avatar_url || user.user_metadata?.avatar_url,
          university_name: userProfileData.university_name,
          department_name: userProfileData.department_name
        };
      }
      
      setRealReviews([newReview, ...realReviews]);
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
      .select('*, profiles(full_name, avatar_url, university_name, department_name), answers(*, profiles(full_name, avatar_url, university_name, department_name))')
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
    }).select('*, profiles(full_name, avatar_url, university_name, department_name)').single();

    setIsSubmittingQuestion(false);
    
    if (error) {
      alert('Soru gönderilirken hata oluştu: ' + error.message);
    } else {
      setIsQuestionFormOpen(false);
      setQuestionContent('');

      // Optimistic UI fallback
      const newQuestion = data;
      if (newQuestion && !newQuestion.profiles) {
        newQuestion.profiles = {
          full_name: userProfileData.full_name || user.user_metadata?.full_name,
          avatar_url: userProfileData.avatar_url || user.user_metadata?.avatar_url,
          university_name: userProfileData.university_name,
          department_name: userProfileData.department_name
        };
      }

      setRealQuestions([{...newQuestion, answers: []}, ...realQuestions]);
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
    }).select('*, profiles(full_name, avatar_url, university_name, department_name)').single();

    setIsSubmittingAnswer(false);
    
    if (error) {
      alert('Cevap gönderilirken hata oluştu: ' + error.message);
    } else {
      setReplyingToQuestionId(null);
      setAnswerContent('');
      
      const newAnswer = data;
      if (newAnswer && !newAnswer.profiles) {
        newAnswer.profiles = {
          full_name: userProfileData.full_name || user.user_metadata?.full_name,
          avatar_url: userProfileData.avatar_url || user.user_metadata?.avatar_url,
          university_name: userProfileData.university_name,
          department_name: userProfileData.department_name
        };
      }
      
      setRealQuestions(prev => prev.map(q => {
         if (q.id === questionId) {
             return { ...q, answers: [...(q.answers || []), newAnswer] };
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

  const [globalFilters, setGlobalFilters] = useState({ 
    type: 'all', 
    level: 'all',
    scoreType: 'all',
    scholarship: 'all',
    keyword: ''
  });

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

  const [aboutOpen, setAboutOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [inbox, setInbox] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const [browseOpen, setBrowseOpen] =
    useState(false);

  const [comparisonOpen, setComparisonOpen] =
    useState(false);

  const [favorites, setFavorites] =
    useState([]);

  const [favoritesLoaded, setFavoritesLoaded] =
    useState(false);
    
  // --- PROFIL / AUTH STATES ---
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  
  const [userProfileData, setUserProfileData] = useState({ 
    targetRank: "", 
    targetScore: "",
    full_name: "",
    bio: "",
    education_status: "Lise",
    university_name: "",
    department_name: "",
    avatar_url: ""
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [deptSuggestions, setDeptSuggestions] = useState([]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
        if (error) throw error;
        alert("Kayıt başarılı! Lütfen e-postanızı doğrulayın.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
        if (error) throw error;
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };
  
  useEffect(() => {
    const savedProfile = localStorage.getItem("yok-atlas-user-profile");
    if (savedProfile) {
      try { setUserProfileData(prev => ({ ...prev, ...JSON.parse(savedProfile) })); } catch(e){}
    }
  }, []);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
          setUserProfileData(prev => ({ 
            ...prev, 
            full_name: data.full_name || prev.full_name,
            bio: data.bio || prev.bio,
            education_status: data.education_status || prev.education_status,
            university_name: data.university_name || prev.university_name,
            department_name: data.department_name || prev.department_name,
            targetRank: data.target_rank || prev.targetRank,
            targetScore: data.target_score || prev.targetScore,
            avatar_url: data.avatar_url || prev.avatar_url
          }));
        }
      };
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        const { data: notifs } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
        if (notifs) {
          const actorIds = [...new Set(notifs.map(n => n.actor_id))];
          if (actorIds.length > 0) {
            const { data: profs } = await supabase.from('profiles').select('*').in('id', actorIds);
            const merged = notifs.map(n => ({
              ...n,
              actorProfile: profs?.find(p => p.id === n.actor_id) || { full_name: 'Bir kullanıcı' }
            }));
            setNotifications(merged);
          } else {
            setNotifications(notifs);
          }
        }
      };
      fetchNotifications();

      const notifChannel = supabase
        .channel('realtime-notifications')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications', 
          filter: `user_id=eq.${user.id}` 
        }, async (payload) => {
          const { data: actorProfile } = await supabase.from('profiles').select('*').eq('id', payload.new.actor_id).maybeSingle();
          const newNotif = { 
            ...payload.new, 
            actorProfile: actorProfile || { full_name: 'Bir kullanıcı' } 
          };
          setNotifications(prev => {
            if (prev.find(n => n.id === newNotif.id)) return prev;
            return [newNotif, ...prev];
          });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(notifChannel);
      };
    }
  }, [user]);
  
  const updateProfileData = (field, value) => {
    const newData = { ...userProfileData, [field]: value };
    setUserProfileData(newData);
    localStorage.setItem("yok-atlas-user-profile", JSON.stringify(newData));

    // If searching department
    if (field === 'department_name' && value.length > 2) {
      const fetchDepts = async () => {
        const { data } = await supabase.from('programs').select('name').ilike('name', `%${value}%`).limit(15);
        if (data) {
          setDeptSuggestions([...new Set(data.map(d => d.name))]);
        }
      };
      fetchDepts();
    } else if (field === 'department_name' && value.length <= 2) {
      setDeptSuggestions([]);
    }
  };

  const uploadAvatar = async (event) => {
    try {
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      setAuthLoading(true);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      updateProfileData('avatar_url', publicUrlData.publicUrl);
    } catch (error) {
      console.error("Avatar yükleme hatası:", error);
      alert("Profil fotoğrafı yüklenirken hata oluştu.");
    } finally {
      setAuthLoading(false);
    }
  };

  const saveProfileToDb = async () => {
    if (!user) return;
    setAuthLoading(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: userProfileData.full_name,
        bio: userProfileData.bio,
        education_status: userProfileData.education_status,
        university_name: userProfileData.university_name,
        department_name: userProfileData.department_name,
        target_rank: userProfileData.targetRank,
        target_score: userProfileData.targetScore,
        avatar_url: userProfileData.avatar_url,
        updated_at: new Date()
      }, {
        onConflict: 'id'
      });
      if (error) throw error;
      setIsEditingProfile(false);
    } catch (err) {
      console.error("Profil güncellenirken hata:", err);
      alert("Profil güncellenirken bir hata oluştu: " + err.message);
    } finally {
      setAuthLoading(false);
    }
  };
  // ----------------------------

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
    setMessagesOpen(false);
    setNotificationsOpen(false);

    if (panel === "filters") setFiltersOpen(!isOpen);
    else if (panel === "favorites") setPreferenceOpen(!isOpen);
  };

  const goHome = () => {
    setFiltersOpen(false);
    setPreferenceOpen(false);
    setAboutOpen(false);
    setBrowseOpen(false);
    setMessagesOpen(false);
    setNotificationsOpen(false);
    setSelectedProgram(null);
    setSelectedUniversity(null);
  };

  const openAbout = () => {
    setFiltersOpen(false);
    setPreferenceOpen(false);
    setBrowseOpen(false);
    setMessagesOpen(false);
    setNotificationsOpen(false);
    setAboutOpen((open) => !open);
  };

  const openBrowse = () => {
    setFiltersOpen(false);
    setPreferenceOpen(false);
    setAboutOpen(false);
    setMessagesOpen(false);
    setNotificationsOpen(false);
    setBrowseOpen(true);
  };

  const openMessages = () => {
    setFiltersOpen(false);
    setPreferenceOpen(false);
    setAboutOpen(false);
    setBrowseOpen(false);
    setNotificationsOpen(false);
    setMessagesOpen(true);
  };

  const markNotificationsAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
  };

  const openNotifications = () => {
    setFiltersOpen(false);
    setPreferenceOpen(false);
    setAboutOpen(false);
    setBrowseOpen(false);
    setMessagesOpen(false);
    setNotificationsOpen(true);
    markNotificationsAsRead();
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

  const markerRefs = useRef({});
  const [activeCampusFilterId, setActiveCampusFilterId] = useState(null);
  const [clusterPopupData, setClusterPopupData] = useState(null);
  const [activeCampusMarker, setActiveCampusMarker] = useState(null);

  useEffect(() => {
    setActiveCampusFilterId(null);
    setActiveCampusMarker(null);
    if (selectedSubCampus) {
      setMapFocus({
        latitude: Number(selectedSubCampus.lat || selectedSubCampus.latitude),
        longitude: Number(selectedSubCampus.lng || selectedSubCampus.longitude),
        zoom: 11
      });
    }
  }, [selectedSubCampus?.id]);

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

  const [supabaseSearchPrograms, setSupabaseSearchPrograms] = useState([]);
  const [loadingSupabaseSearch, setLoadingSupabaseSearch] = useState(false);

  useEffect(() => {
    const fetchSupabasePrograms = async () => {
      const query = search.trim();
      if (query.length < 3) {
        setSupabaseSearchPrograms([]);
        return;
      }
      
      setLoadingSupabaseSearch(true);
      try {
        const { data, error } = await supabase
          .from('programs')
          .select('*')
          .ilike('name', `%${query}%`)
          .limit(40);
          
        if (data && !error) {
          setSupabaseSearchPrograms(data);
        }
      } catch (err) {
        console.error("Supabase search error:", err);
      } finally {
        setLoadingSupabaseSearch(false);
      }
    };

    const timer = setTimeout(() => {
      fetchSupabasePrograms();
    }, 400); // debounce

    return () => clearTimeout(timer);
  }, [search]);

  // ==================================================
  // BASE UNIVERSITY FILTER
  // ==================================================

  const baseFilteredUniversities =
    useMemo(() => {
      const filtered = mapUniversities.filter(
        (university) => {
          // 1. İsim bazlı Ana Kampüs filtrelemesi
          if (!showMyo) {
            const upperName = (university.name || '').toLocaleUpperCase('tr-TR');
            if (!upperName.includes('ÜNİVERSİTESİ')) {
              return false;
            }
          }

          const cityMatch =
            cityFilter === "Tümü" ||
            sameCity(
              university.city,
              cityFilter
            );

          const typeMatch = globalFilters.type === 'all' || 
            (globalFilters.type === 'vakif' && (university.name || '').toLocaleLowerCase('tr-TR').includes('vakıf')) ||
            (globalFilters.type === 'devlet' && !(university.name || '').toLocaleLowerCase('tr-TR').includes('vakıf'));

          return (
            cityMatch &&
            typeMatch
          );
        }
      );

      // 3. Fallback: Eğer filtreleme sonucu boş dönerse, harita boş kalmasın diye tümünü göster
      if (filtered.length === 0 && mapUniversities.length > 0) {
        return mapUniversities;
      }

      return filtered;
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

          const typeMatch = globalFilters.type === 'all' || 
            (globalFilters.type === 'vakif' && (university.name || '').toLocaleLowerCase('tr-TR').includes('vakıf')) ||
            (globalFilters.type === 'devlet' && !(university.name || '').toLocaleLowerCase('tr-TR').includes('vakıf'));

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
       const exactCampus = campuses.find(c => String(c.id) === String(program.campus_id));
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

      if (supabaseSearchPrograms && supabaseSearchPrograms.length > 0) {
        for (const program of supabaseSearchPrograms) {
          const university = universityMap.get(String(program.university_id));
          if (!university) {
            continue;
          }
          const programName = normalize(program.name);
          const universityName = normalize(university.name);
          let score = 90;
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

  const activeRelatedMyos = useMemo(() => {
    if (!selectedSubCampus || !campusPrograms) return [];
    
    // 1. Extract unique campus_ids from the fetched programs of the selected university
    const uniqueCampusIds = new Set();
    campusPrograms.forEach(p => {
      if (p.campus_id) {
        uniqueCampusIds.add(String(p.campus_id));
      }
    });

    // 2. Filter global universities list to match these unique campus_ids
    return universities.filter(u => 
      uniqueCampusIds.has(String(u.id)) && 
      u.id !== selectedSubCampus.id && 
      (Number.isFinite(Number(u.lat)) || Number.isFinite(Number(u.latitude)))
    );
  }, [selectedSubCampus, universities, campusPrograms]);

  const displayedUniversities = useMemo(() => {
    // Odak Modu: Bir üniversite seçiliyse haritada sadece o ve MYO'ları kalsın
    if (selectedSubCampus) {
      const correctUniId = selectedSubCampus.universityId || selectedSubCampus.id;
      const actualMainCampus = universities.find(u => u.id === correctUniId) || selectedSubCampus;
      
      const focusList = [actualMainCampus];
      
      if (selectedSubCampus.id !== actualMainCampus.id) {
        focusList.push(selectedSubCampus);
      }
      
      for (const myo of activeRelatedMyos) {
        if (myo.id !== actualMainCampus.id && myo.id !== selectedSubCampus.id) {
          focusList.push(myo);
        }
      }
      return focusList;
    }

    // Normal Mod: Tüm üniversiteler
    const base = filteredUniversities;
    const final = [...base];
    for (const myo of activeRelatedMyos) {
      if (!base.find(u => u.id === myo.id)) {
        final.push(myo);
      }
    }
    return final;
  }, [selectedSubCampus, filteredUniversities, activeRelatedMyos, universities]);

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
          favorites.map(
            (program) =>
              String(
                program.code
              )
          )
        ),
      [favorites]
    );

  const isInFavorites =
    (program) =>
      preferenceCodes.has(
        String(program.code)
      );

  const addToFavorites = async (program) => {
    const normalized = normalizeProgram(program);

    setFavorites((current) => {
      const exists = current.some((item) => String(item.code) === String(normalized.code));
      if (exists) {
        if (user) {
          supabase.from('favorites').delete().match({ user_id: user.id, program_id: normalized.code }).then();
        }
        return current.filter((item) => String(item.code) !== String(normalized.code));
      }

      if (current.length >= 24) {
        alert("En fazla 24 tercih ekleyebilirsiniz.");
        return current;
      }

      if (user) {
        supabase.from('favorites').insert({ user_id: user.id, program_id: normalized.code, program_data: normalized }).then();
      }
      return [...current, normalized];
    });
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

      setFavorites((current) => {
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

  const removeFromFavorites =
    (code) => {
      setFavorites(
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

      setFavorites(
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
      setFavorites(
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
          "yok-atlas-favorites"
        );

      if (saved) {
        const parsed = JSON.parse(saved);

        setFavorites(
          Array.isArray(parsed)
            ? parsed.slice(0, 24)
            : []
        );
      }
    } catch {
      // boş bırak
    } finally {
      setFavoritesLoaded(true);
    }
  }, []);
  
  useEffect(() => {
    if (user && favoritesLoaded) {
      const fetchSupabaseFavorites = async () => {
        const { data, error } = await supabase.from('favorites').select('program_data').eq('user_id', user.id);
        if (!error && data) {
          // Merge local favorites with supabase or just override? Better to override with DB
          if (data.length > 0) {
             setFavorites(data.map(d => d.program_data));
          }
        }
      };
      fetchSupabaseFavorites();
    }
  }, [user, favoritesLoaded]);

  useEffect(() => {
    if (!favoritesLoaded) {
      return;
    }

    try {
      localStorage.setItem(
        "yok-atlas-favorites",
        JSON.stringify(
          favorites
        )
      );
    } catch {
      // boş bırak
    }
  }, [favorites, favoritesLoaded]);

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
  // --- KAMPÜS FEED YAPISI ---
  const [campusPosts, setCampusPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [campusTab, setCampusTab] = useState('feed');
  const [campusClubs, setCampusClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [clubEvents, setClubEvents] = useState([]);
  
  const [campusListings, setCampusListings] = useState([]);
  const [dailyMenu, setDailyMenu] = useState(null);
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [listingCategory, setListingCategory] = useState('İkinci El');
  const [listingTitle, setListingTitle] = useState('');
  const [listingDescription, setListingDescription] = useState('');
  const [listingPrice, setListingPrice] = useState('');
  const [isSubmittingListing, setIsSubmittingListing] = useState(false);

  const [viewingProfile, setViewingProfile] = useState(null);
  const [profileContent, setProfileContent] = useState({ posts: [], listings: [] });
  
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageContent, setNewMessageContent] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (messagesOpen && user) {
      const fetchInbox = async () => {
        const { data: msgs } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false });
        if (msgs) {
          const convos = {};
          msgs.forEach(m => {
            const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
            if (!convos[otherId]) convos[otherId] = m;
          });
          const otherIds = Object.keys(convos);
          if (otherIds.length > 0) {
            const { data: profs } = await supabase.from('profiles').select('*').in('id', otherIds);
            const merged = otherIds.map(id => ({
              otherUser: profs?.find(p => p.id === id) || { id, full_name: 'Bilinmiyor' },
              latestMessage: convos[id]
            })).sort((a, b) => new Date(b.latestMessage.created_at) - new Date(a.latestMessage.created_at));
            setInbox(merged);
          } else {
            setInbox([]);
          }
        }
      };
      fetchInbox();
    }
  }, [messagesOpen, user]);

  useEffect(() => {
    if (viewingProfile) {
      const fetchProfileContent = async () => {
        const { data: posts } = await supabase.from('posts').select('*, profiles(full_name, avatar_url)').eq('user_id', viewingProfile.id).order('created_at', { ascending: false });
        const { data: listings } = await supabase.from('listings').select('*, profiles(full_name, avatar_url)').eq('user_id', viewingProfile.id).order('created_at', { ascending: false });
        setProfileContent({ posts: posts || [], listings: listings || [] });
      };
      fetchProfileContent();
    }
  }, [viewingProfile]);

  useEffect(() => {
    if (activeChatUser) {
      const fetchMessages = async () => {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${activeChatUser.id}),and(sender_id.eq.${activeChatUser.id},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });
        if (data) setChatMessages(data);
      };
      fetchMessages();

      const channel = supabase
        .channel('realtime-messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          const newMsg = payload.new;
          if (
            (newMsg.sender_id === activeChatUser.id && newMsg.receiver_id === user.id) ||
            (newMsg.sender_id === user.id && newMsg.receiver_id === activeChatUser.id)
          ) {
            setChatMessages(prev => {
              if (prev.find(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [activeChatUser, user]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const sendMessage = async () => {
    if (!newMessageContent.trim() || !activeChatUser) return;
    const tempId = crypto.randomUUID();
    const tempMsg = {
      id: tempId,
      sender_id: user.id,
      receiver_id: activeChatUser.id,
      content: newMessageContent.trim(),
      created_at: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, tempMsg]);
    const contentToSend = newMessageContent.trim();
    setNewMessageContent('');
    
    await supabase.from('messages').insert({
      id: tempId,
      sender_id: user.id,
      receiver_id: activeChatUser.id,
      content: contentToSend
    });
    
    await supabase.from('notifications').insert({
      user_id: activeChatUser.id,
      actor_id: user.id,
      type: 'message',
      content: 'sana yeni bir mesaj gönderdi.'
    });
  };

  useEffect(() => {
    if (selectedClub) {
      const getEvents = async () => {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('club_id', selectedClub.id)
          .order('event_date', { ascending: true });
        if (data) setClubEvents(data);
      };
      getEvents();
    } else {
      setClubEvents([]);
    }
  }, [selectedClub]);

  const fetchDailyMenu = async () => {
    if (!userProfileData.university_name) return;
    const offset = new Date().getTimezoneOffset() * 60000;
    const todayLocal = new Date(Date.now() - offset).toISOString().split('T')[0];
    
    const { data } = await supabase
      .from('dining_menus')
      .select('*')
      .eq('university_name', userProfileData.university_name)
      .eq('menu_date', todayLocal)
      .maybeSingle();
      
    if (data) setDailyMenu(data);
    else setDailyMenu(null);
  };

  const fetchCampusListings = async () => {
    if (!userProfileData.university_name) return;
    const { data, error } = await supabase
      .from('listings')
      .select('*, profiles(full_name, avatar_url)')
      .eq('university_name', userProfileData.university_name)
      .order('created_at', { ascending: false });
    if (data) setCampusListings(data);
  };

  const fetchCampusPosts = async () => {
    if (!userProfileData.university_name) return;
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(full_name, avatar_url, university_name, department_name)')
      .eq('university_name', userProfileData.university_name)
      .order('created_at', { ascending: false });
    if (data) setCampusPosts(data);
  };

  const fetchCampusClubs = async () => {
    if (!userProfileData.university_name) return;
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('university_name', userProfileData.university_name);
    if (data) setCampusClubs(data);
  };

  useEffect(() => {
    if (browseOpen && userProfileData.university_name) {
      fetchCampusPosts();
      fetchCampusClubs();
      fetchCampusListings();
      fetchDailyMenu();
    }
  }, [browseOpen, userProfileData.university_name]);

  const submitListing = async () => {
    if (!listingTitle.trim() || !listingDescription.trim()) return;
    setIsSubmittingListing(true);
    const { data, error } = await supabase.from('listings').insert({
      user_id: user.id,
      university_name: userProfileData.university_name,
      category: listingCategory,
      title: listingTitle,
      description: listingDescription,
      price: listingPrice ? parseFloat(listingPrice) : null
    }).select('*, profiles(full_name, avatar_url)').single();

    setIsSubmittingListing(false);
    if (error) {
      alert('İlan eklenirken hata oluştu: ' + error.message);
    } else {
      const newListing = data;
      if (newListing && !newListing.profiles) {
        newListing.profiles = {
          full_name: userProfileData.full_name || user.user_metadata?.full_name,
          avatar_url: userProfileData.avatar_url || user.user_metadata?.avatar_url
        };
      }
      setCampusListings([newListing, ...campusListings]);
      setIsListingModalOpen(false);
      setListingTitle('');
      setListingDescription('');
      setListingPrice('');
      setListingCategory('İkinci El');
    }
  };

  const submitCampusPost = async () => {
    if (!newPostContent.trim()) return;
    setIsSubmittingPost(true);
    const { data, error } = await supabase.from('posts').insert({
      user_id: user.id,
      university_name: userProfileData.university_name,
      content: newPostContent
    }).select('*, profiles(full_name, avatar_url, university_name, department_name)').single();
    
    setIsSubmittingPost(false);
    if (error) {
      alert('Gönderi paylaşılırken hata oluştu: ' + error.message);
    } else {
      setNewPostContent('');
      const newPost = data;
      if (newPost && !newPost.profiles) {
        newPost.profiles = {
          full_name: userProfileData.full_name || user.user_metadata?.full_name,
          avatar_url: userProfileData.avatar_url || user.user_metadata?.avatar_url,
          university_name: userProfileData.university_name,
          department_name: userProfileData.department_name
        };
      }
      setCampusPosts([newPost, ...campusPosts]);
    }
  };

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
              {user && (
                <>
                  <div style={{ position: 'relative' }}>
                    <button onClick={openNotifications} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} title="Bildirimler">
                      🔔
                    </button>
                    {notifications.filter(n => !n.is_read).length > 0 && (
                      <span style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 'bold', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {notifications.filter(n => !n.is_read).length}
                      </span>
                    )}
                  </div>
                  <button onClick={openMessages} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} title="Mesajlar">
                    💬
                  </button>
                </>
              )}
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
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder="🔍 Üniversite, bölüm veya şehir ara..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              style={{ width: '100%', height: '44px', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '0 16px', background: '#f1f5f9', color: '#334155', outline: 'none', fontSize: '16px' }}
            />
            {searchInput.trim().length > 1 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 1000, maxHeight: '300px', overflowY: 'auto', marginTop: '8px' }}>
                {loadingSupabaseSearch ? (
                  <div style={{ textAlign: 'center', color: '#64748b' }}>Arama sonuçları yükleniyor...</div>
                ) : visibleSearchResults.length > 0 ? (
                  visibleSearchResults.map((result, i) => (
                    <div 
                      key={i}
                      onClick={() => {
                        setSearchInput("");
                        setSearch("");
                        if (result.type === "university") {
                           setSelectedSubCampus(result.university);
                           setMapFocus({ latitude: Number(result.university.lat || result.university.latitude), longitude: Number(result.university.lng || result.university.longitude), zoom: 11 });
                        } else {
                           setSelectedSubCampus(result.university);
                           const tLat = result.program.latitude || result.university.lat || result.university.latitude;
                           const tLng = result.program.longitude || result.university.lng || result.university.longitude;
                           setMapFocus({ latitude: Number(tLat), longitude: Number(tLng), zoom: 14 });
                           setActiveCampusFilterId(result.program.campus_id || null);
                        }
                      }}
                      style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                    >
                      <strong style={{ fontSize: '14px', color: '#1e293b' }}>
                        {result.type === 'university' ? result.university.name : result.program.name}
                      </strong>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {result.type === 'university' ? result.university.city : result.university.name}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', color: '#64748b' }}>Sonuç bulunamadı.</div>
                )}
              </div>
            )}
          </div>
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
              🏠 KYK Yurtları
            </button>

            <button 
              className={`pill-btn ${globalFilters.type === 'devlet' ? 'active' : ''}`}
              onClick={() => setGlobalFilters(prev => ({ ...prev, type: prev.type === 'devlet' ? 'all' : 'devlet' }))}>
              Devlet
            </button>

            <button 
              className={`pill-btn ${globalFilters.type === 'vakif' ? 'active' : ''}`}
              onClick={() => setGlobalFilters(prev => ({ ...prev, type: prev.type === 'vakif' ? 'all' : 'vakif' }))}>
              Vakıf
            </button>

            <button 
              className={`pill-btn ${globalFilters.level === 'lisans' ? 'active' : ''}`}
              onClick={() => setGlobalFilters(prev => ({ ...prev, level: prev.level === 'lisans' ? 'all' : 'lisans' }))}>
              Lisans
            </button>

            <button 
              className={`pill-btn ${globalFilters.level === 'onlisans' ? 'active' : ''}`}
              onClick={() => setGlobalFilters(prev => ({ ...prev, level: prev.level === 'onlisans' ? 'all' : 'onlisans' }))}>
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
            <MapResizer isPanelOpen={isAnyModalOpen} />

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
              <>
                <MarkerClusterGroup
                  chunkedLoading={true}
                  maxClusterRadius={70}
                  spiderfyOnMaxZoom={false}
                  showCoverageOnHover={false}
                  zoomToBoundsOnClick={true}
                  onClick={(e) => {
                    const cluster = e.layer;
                    const childMarkers = cluster.getAllChildMarkers();
                    const map = cluster._map || (childMarkers[0] && childMarkers[0]._map);
                    if (!map) return;
                    
                    const currentZoom = map.getZoom();
                    const maxZoom = map.getMaxZoom() || 18;
                    const bounds = cluster.getBounds();
                    const isPointCluster = bounds.getNorthEast().equals(bounds.getSouthWest());

                    if (currentZoom >= maxZoom || isPointCluster) {
                      // Kütüphanenin varsayılan davranışını durdur
                      L.DomEvent.stopPropagation(e.originalEvent || e);
                      
                      const uniIds = childMarkers.map(m => m.universityId).filter(Boolean);
                      if (uniIds.length > 0) {
                        setClusterPopupData({
                          latlng: [e.latlng.lat, e.latlng.lng],
                          universityIds: uniIds
                        });
                      }
                    }
                  }}
                >
                {displayedUniversities.map(university => (
                   <Marker 
                      ref={(r) => { 
                        if (r) { 
                          markerRefs.current[university.id] = r; 
                          r.universityId = university.id; 
                        } 
                      }}
                      key={university.id} 
                      position={[Number(university.latitude || university.lat), Number(university.longitude || university.lng)]} 
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
            {clusterPopupData && (
              <Popup 
                position={clusterPopupData.latlng} 
                onClose={() => setClusterPopupData(null)}
                minWidth={250}
                autoPan={true}
                autoPanPaddingTopLeft={[0, 250]}
              >
                <div className="campus-popup" style={{ textAlign: 'center', padding: '5px' }}>
                  <h3 style={{ marginBottom: '10px', fontSize: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', color: '#0f172a' }}>Bu Konumdaki Yerleşkeler</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                    {clusterPopupData.universityIds.map(id => {
                      const u = displayedUniversities.find(un => un.id === id);
                      if (!u) return null;
                      return (
                        <button 
                          key={id}
                          onClick={() => {
                            setClusterPopupData(null);
                            setSelectedSubCampus(u);
                          }}
                          style={{ padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', width: '100%' }}
                        >
                          <strong style={{ display: 'block', fontSize: '13px', color: '#1e293b', marginBottom: '2px', lineHeight: '1.2' }}>{u.name}</strong>
                          <small style={{ color: '#64748b', fontSize: '11px', fontWeight: '500' }}>{u.type === 'Ana Kampüs' ? '📍 Ana Kampüs' : '🏢 Alt Yerleşke'}</small>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Popup>
            )}
            </>
          )}

        
          {showKyk && (
              <MarkerClusterGroup
                chunkedLoading={true}
                maxClusterRadius={50}
                spiderfyOnMaxZoom={false}
                showCoverageOnHover={false}
                zoomToBoundsOnClick={true}
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

            {activeCampusMarker && (
              <Marker 
                key={`active-campus-${activeCampusMarker.id}`}
                position={[Number(activeCampusMarker.lat || activeCampusMarker.latitude), Number(activeCampusMarker.lng || activeCampusMarker.longitude)]}
                icon={activeCampusMarker.type === 'Ana Kampüs' ? mainCampusIcon : subCampusIcon}
                ref={(r) => { if (r) markerRefs.current[activeCampusMarker.id] = r; }}
                eventHandlers={{ click: () => setSelectedSubCampus(activeCampusMarker) }}
              >
                <Tooltip direction="top" offset={[0, -18]} opacity={0.95} sticky>
                   <span className="university-tooltip"><strong>{activeCampusMarker.city}</strong><br/>{activeCampusMarker.name}</span>
                </Tooltip>
                <Popup autoPan={true} autoPanPaddingTopLeft={[0, 250]} autoPanPaddingBottomRight={[0, 20]} minWidth={240} maxWidth={300}>
                   <div className="campus-popup" style={{ textAlign: 'center', padding: '5px' }}>
                     <div className="detail-label" style={{ fontSize: '10px', color: '#6366f1', fontWeight: 'bold' }}>
                       {activeCampusMarker.type === 'Ana Kampüs' ? "ANA YERLEŞKE" : "ALT YERLEŞKE"}
                     </div>
                     <h3 style={{ margin: '5px 0', fontSize: '14px' }}>{activeCampusMarker.name}</h3>
                     <p style={{ margin: '0', fontSize: '12px', color: '#64748b' }}>{activeCampusMarker.city}</p>
                     <button 
                       style={{ marginTop: '10px', background: '#2563eb', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                       className="open-university-button"
                       onClick={(e) => { e.stopPropagation(); setSelectedSubCampus(activeCampusMarker); }}
                     >
                       Detayları Gör
                     </button>
                   </div>
                </Popup>
              </Marker>
            )}

</MapContainer>
        </div>
        {browseOpen && (
          <aside className="browse-panel" style={{ display: 'flex', flexDirection: 'column' }}>
            {viewingProfile ? (
              <>
                <div className="browse-panel-header p-2 md:p-4" style={{ borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => setViewingProfile(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>←</button>
                    <div style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '14px' }}>PROFİL</div>
                  </div>
                </div>
                <div style={{ padding: '24px 16px', flex: 1, overflowY: 'auto', background: '#f8fafc' }}>
                  <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    {viewingProfile.avatar_url ? (
                      <img src={viewingProfile.avatar_url} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 12px' }} />
                    ) : (
                      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', margin: '0 auto 12px' }}>👤</div>
                    )}
                    <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#0f172a' }}>{viewingProfile.full_name || 'İsimsiz'}</h2>
                    <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '14px' }}>{viewingProfile.department_name || viewingProfile.university_name}</p>
                    {user && user.id !== viewingProfile.id && (
                      <button onClick={() => setActiveChatUser(viewingProfile)} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(59,130,246,0.3)' }}>💬 Mesaj Gönder</button>
                    )}
                  </div>
                  
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '16px' }}>Gönderileri</h3>
                    {profileContent.posts.length === 0 ? (
                      <div style={{ color: '#64748b', fontSize: '14px', textAlign: 'center' }}>Henüz gönderi paylaşmamış.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {profileContent.posts.map(post => (
                          <div key={post.id} style={{ background: '#fff', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#334155' }}>{post.content}</p>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(post.created_at).toLocaleDateString('tr-TR')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 style={{ fontSize: '16px', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '16px' }}>İlanları</h3>
                    {profileContent.listings.length === 0 ? (
                      <div style={{ color: '#64748b', fontSize: '14px', textAlign: 'center' }}>Henüz ilan vermemiş.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {profileContent.listings.map(listing => (
                          <div key={listing.id} style={{ background: '#fff', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <h4 style={{ margin: 0, fontSize: '14px', color: '#0f172a' }}>{listing.title}</h4>
                              <span style={{ fontSize: '11px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '6px', color: '#475569' }}>{listing.category}</span>
                            </div>
                            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#64748b' }}>{listing.description}</p>
                            {listing.price && <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#10b981' }}>{listing.price} ₺</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : selectedClub ? (
              <>
                <div className="browse-panel-header p-2 md:p-4" style={{ borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => setSelectedClub(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>←</button>
                    <div>
                      <div className="detail-label" style={{ color: '#3b82f6' }}>KULÜP DETAYI</div>
                      <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>{selectedClub.name}</h2>
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc' }}>
                  <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                    <p style={{ margin: 0, color: '#334155', fontSize: '15px', lineHeight: '1.6' }}>{selectedClub.description}</p>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '16px', color: '#0f172a', margin: 0 }}>Yaklaşan Etkinlikler</h3>
                  </div>
                  
                  {clubEvents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                      <div style={{ fontSize: '32px', marginBottom: '12px' }}>📅</div>
                      <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Yaklaşan etkinlik bulunmuyor, takipte kal!</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {clubEvents.map(ev => (
                        <div key={ev.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #3b82f6' }}>
                          <h4 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '15px' }}>{ev.name}</h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '8px', fontSize: '12px', color: '#64748b' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>🕒 {new Date(ev.event_date).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>📍 {ev.location}</span>
                          </div>
                          {ev.description && (
                            <p style={{ margin: '8px 0 0 0', color: '#475569', fontSize: '13px', lineHeight: '1.5' }}>{ev.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="browse-panel-header p-2 md:p-4" style={{ borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <div className="detail-label" style={{ color: '#3b82f6' }}>KAMPÜS</div>
                      <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>
                        {userProfileData.university_name || 'Kampüs'}
                      </h2>
                    </div>
                    <button className="close-button" onClick={() => setBrowseOpen(false)}>×</button>
                  </div>
                  
                  {user && userProfileData.university_name && (
                    <div style={{ display: 'flex' }}>
                      <button onClick={() => setCampusTab('feed')} style={{ flex: 1, padding: '12px 0', background: 'none', border: 'none', borderBottom: campusTab === 'feed' ? '2px solid #3b82f6' : '2px solid transparent', color: campusTab === 'feed' ? '#3b82f6' : '#64748b', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', fontSize: '15px' }}>Akış</button>
                      <button onClick={() => setCampusTab('clubs')} style={{ flex: 1, padding: '12px 0', background: 'none', border: 'none', borderBottom: campusTab === 'clubs' ? '2px solid #3b82f6' : '2px solid transparent', color: campusTab === 'clubs' ? '#3b82f6' : '#64748b', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', fontSize: '15px' }}>Kulüpler</button>
                      <button onClick={() => setCampusTab('listings')} style={{ flex: 1, padding: '12px 0', background: 'none', border: 'none', borderBottom: campusTab === 'listings' ? '2px solid #3b82f6' : '2px solid transparent', color: campusTab === 'listings' ? '#3b82f6' : '#64748b', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', fontSize: '15px' }}>Pano</button>
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc' }}>
                  {!user ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔒</div>
                      <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Giriş Yapmalısınız</h3>
                      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>Kampüsünüzdeki gönderileri görmek ve paylaşım yapmak için lütfen giriş yapın.</p>
                      <button onClick={openAuthModal} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Giriş Yap</button>
                    </div>
                  ) : !userProfileData.university_name ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <div style={{ fontSize: '40px', marginBottom: '16px' }}>🎓</div>
                      <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Üniversitenizi Belirleyin</h3>
                      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>Kampüs akışına katılmak için Profilim sekmesinden okuduğunuz veya mezun olduğunuz üniversiteyi seçmelisiniz.</p>
                      <button onClick={() => { setBrowseOpen(false); setPreferenceOpen(true); }} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Profilimi Düzenle</button>
                    </div>
                  ) : campusTab === 'feed' ? (
                    <>
                      {dailyMenu && (
                        <div style={{ background: '#ecfdf5', borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px', border: '1px solid #d1fae5', marginBottom: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                          <span style={{ fontSize: '24px', flexShrink: 0 }}>🍽️</span>
                          <div>
                            <h4 style={{ margin: '0 0 4px 0', color: '#065f46', fontSize: '15px' }}>Günün Menüsü</h4>
                            <p style={{ margin: 0, color: '#047857', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{dailyMenu.content}</p>
                          </div>
                        </div>
                      )}
                      <div className="campus-composer" style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          {userProfileData.avatar_url || user.user_metadata?.avatar_url ? (
                            <img src={userProfileData.avatar_url || user.user_metadata?.avatar_url} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                          ) : (
                            <span style={{ background: '#3b82f6', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold', flexShrink: 0 }}>👤</span>
                          )}
                          <textarea
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            placeholder="Kampüste neler oluyor?"
                            style={{ flex: 1, border: 'none', background: 'transparent', resize: 'none', fontSize: '15px', color: '#334155', minHeight: '60px', padding: '8px 0', outline: 'none' }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                          <button onClick={submitCampusPost} disabled={isSubmittingPost || !newPostContent.trim()} style={{ background: newPostContent.trim() ? '#3b82f6' : '#cbd5e1', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '20px', cursor: newPostContent.trim() ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '14px', transition: 'background 0.2s' }}>
                            {isSubmittingPost ? 'Paylaşılıyor...' : 'Paylaş'}
                          </button>
                        </div>
                      </div>

                      <div className="campus-feed" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {campusPosts.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
                            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌱</div>
                            <p>Henüz kimse bir şey paylaşmadı.<br/>İlk paylaşan sen ol!</p>
                          </div>
                        ) : (
                          campusPosts.map(post => (
                            <div key={post.id} className="campus-post-card" style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                                <div style={{ cursor: 'pointer' }} onClick={() => setViewingProfile({ id: post.user_id, full_name: post.profiles?.full_name, avatar_url: post.profiles?.avatar_url, university_name: post.university_name, department_name: post.profiles?.department_name })}>
                                  {post.profiles?.avatar_url ? (
                                    <img src={post.profiles.avatar_url} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                  ) : (
                                    <span style={{ background: '#3b82f6', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold', flexShrink: 0 }}>👤</span>
                                  )}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                    <strong onClick={() => setViewingProfile({ id: post.user_id, full_name: post.profiles?.full_name, avatar_url: post.profiles?.avatar_url, university_name: post.university_name, department_name: post.profiles?.department_name })} style={{ color: '#0f172a', fontSize: '15px', cursor: 'pointer' }}>{post.profiles?.full_name || 'İsimsiz'}</strong>
                                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                                      {(() => {
                                        const diff = Date.now() - new Date(post.created_at).getTime();
                                        const minutes = Math.floor(diff / 60000);
                                        if (minutes < 1) return 'Az önce';
                                        if (minutes < 60) return `${minutes}d`;
                                        const hours = Math.floor(minutes / 60);
                                        if (hours < 24) return `${hours}s`;
                                        return `${Math.floor(hours / 24)}g`;
                                      })()}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: '12px', color: '#64748b' }}>{post.profiles?.department_name || post.university_name}</span>
                                </div>
                              </div>
                              <p style={{ margin: '0 0 12px 0', color: '#334155', fontSize: '15px', lineHeight: '1.5', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{post.content}</p>
                              <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                                <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px', padding: '4px 8px', borderRadius: '6px' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                  <span style={{ fontSize: '16px' }}>♡</span> {post.likes_count || 0}
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  ) : campusTab === 'clubs' ? (
                    <div className="campus-clubs" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {campusClubs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🏆</div>
                          <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Kulüpler Çok Yakında</h3>
                          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>Üniversitene ait kulüpler çok yakında burada olacak.</p>
                        </div>
                      ) : (
                        campusClubs.map(club => (
                          <div key={club.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            <div>
                              <h4 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '16px' }}>{club.name}</h4>
                              <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>{club.description}</p>
                            </div>
                            <button onClick={() => setSelectedClub(club)} style={{ background: '#eff6ff', color: '#3b82f6', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'} onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}>İncele</button>
                          </div>
                        ))
                      )}
                    </div>
                  ) : campusTab === 'listings' ? (
                    <div className="campus-listings" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                         <button onClick={() => setIsListingModalOpen(true)} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+ İlan Ver</button>
                      </div>

                      {campusListings.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📢</div>
                            <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Kampüs panosu şu an boş.</h3>
                            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>İlk ilanı sen ver!</p>
                          </div>
                      ) : (
                          campusListings.map(listing => (
                            <div key={listing.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', position: 'relative' }}>
                               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setViewingProfile({ id: listing.user_id, full_name: listing.profiles?.full_name, avatar_url: listing.profiles?.avatar_url, university_name: listing.university_name, department_name: listing.profiles?.department_name })}>
                                   {listing.profiles?.avatar_url ? (
                                      <img src={listing.profiles.avatar_url} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                                   ) : (
                                      <span style={{ background: '#3b82f6', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>👤</span>
                                   )}
                                   <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>{listing.profiles?.full_name || 'İsimsiz'}</span>
                                 </div>
                                 <span style={{ background: listing.category === 'İkinci El' ? '#dcfce7' : listing.category === 'Ev/Oda' ? '#dbeafe' : '#fef3c7', color: listing.category === 'İkinci El' ? '#166534' : listing.category === 'Ev/Oda' ? '#1e40af' : '#b45309', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>{listing.category}</span>
                               </div>
                               <h4 style={{ margin: '0 0 6px 0', color: '#0f172a', fontSize: '16px' }}>{listing.title}</h4>
                               <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>{listing.description}</p>
                               {listing.price !== null && listing.price !== undefined && (
                                 <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#10b981', fontSize: '16px' }}>
                                    {listing.price} ₺
                                 </div>
                               )}
                            </div>
                          ))
                      )}
                    </div>
                  ) : null}
                </div>
              </>
            )}

            {isListingModalOpen && (
               <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                  <div style={{ background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, color: '#0f172a' }}>İlan Ver</h3>
                        <button onClick={() => setIsListingModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>×</button>
                     </div>
                     
                     <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Kategori</label>
                        <select value={listingCategory} onChange={(e) => setListingCategory(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}>
                           <option value="İkinci El">İkinci El Eşya</option>
                           <option value="Ev/Oda">Ev Arkadaşı / Kiralık Oda</option>
                           <option value="Ders/Not">Özel Ders / Ders Notu</option>
                           <option value="Diğer">Diğer</option>
                        </select>
                     </div>
                     <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Başlık</label>
                        <input value={listingTitle} onChange={(e) => setListingTitle(e.target.value)} placeholder="Örn: 2. El Temiz Çalışma Masası" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                     </div>
                     <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Açıklama</label>
                        <textarea value={listingDescription} onChange={(e) => setListingDescription(e.target.value)} placeholder="İlan detayları..." rows={4} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', resize: 'none' }} />
                     </div>
                     <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Fiyat (₺) - Opsiyonel</label>
                        <input type="number" value={listingPrice} onChange={(e) => setListingPrice(e.target.value)} placeholder="Örn: 500" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                     </div>
                     <button onClick={submitListing} disabled={isSubmittingListing || !listingTitle.trim() || !listingDescription.trim()} style={{ background: listingTitle.trim() && listingDescription.trim() ? '#3b82f6' : '#cbd5e1', color: '#fff', padding: '12px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: listingTitle.trim() && listingDescription.trim() ? 'pointer' : 'not-allowed' }}>
                        {isSubmittingListing ? 'Ekleniyor...' : 'İlanı Yayınla'}
                     </button>
                  </div>
               </div>
            )}
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


            <div className="university-panel-header p-2 md:p-4">
              <div className="detail-label">ÜNİVERSİTE</div>
              <h2 className="text-lg md:text-2xl" style={{ margin: '4px 0 5px', lineHeight: 1.12 }}>{selectedUniversity.name}</h2>
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

                    <div className="university-action-bar overflow-x-auto whitespace-nowrap scrollbar-hide" style={{ display: 'flex', flexWrap: 'nowrap', gap: '8px', paddingBottom: '4px' }}>
                      <button
                        type="button"
                        className="university-action-button preference"
                        onClick={() => {
                          setSelectedProgram(null);
                          setPreferenceOpen(true);
                          setFiltersOpen(false);
                        }}
                      >
                        ⭐ Tercih Listem <b>{favorites.length}</b>
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
                                  className={isInFavorites(normalized) ? "program-add-button added" : "program-add-button"}
                                  onClick={() => addToFavorites(normalized)}
                                  title={isInFavorites(normalized) ? "Tercih listesinde" : "Tercih listesine ekle"}
                                >
                                  {isInFavorites(normalized) ? "✓" : "⭐"}
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
                  isInFavorites(
                    selectedProgram
                  )
                    ? "primary-detail-button added"
                    : "primary-detail-button"
                }

                onClick={() =>
                  addToFavorites(
                    selectedProgram
                  )
                }
              >
                {
                  isInFavorites(
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
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '15px' }}>
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
      <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
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
            <div className="csd-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0, borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
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
                    {activeCampusFilterId && (
                      <div style={{ marginBottom: '8px', padding: '8px 12px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: '600' }}>Sadece {mapUniversities.find(u => u.id === activeCampusFilterId)?.name || 'seçili yerleşke'} bölümleri gösteriliyor</span>
                        <button onClick={() => setActiveCampusFilterId(null)} style={{ background: 'none', border: 'none', color: '#1e40af', cursor: 'pointer', fontSize: '18px', padding: 0, lineHeight: 1 }}>&times;</button>
                      </div>
                    )}
                    <input 
                      type="text" 
                      placeholder="Bu üniversitede program ara..." 
                      value={programSearchQuery}
                      onChange={(e) => setProgramSearchQuery(e.target.value)}
                      style={{ width: '100%', padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', background: '#f8fafc', color: '#1e293b' }}
                    />
                  </div>

                  {/* Scrollable List Area */}
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {isFetchingCampusPrograms ? (
                      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                        <div className="spinner" style={{ margin: '0 auto 16px', width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        <h4 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '15px' }}>Veriler Çekiliyor</h4>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>
                          Bölüm and program verileri yükleniyor...
                        </p>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                      </div>
                    ) : campusPrograms && campusPrograms.length > 0 ? (
                        (() => {
                            const filtered = campusPrograms.filter(p => {
                              // Kampüs eşleşmesi
                              if (activeCampusFilterId && String(p.campus_id) !== String(activeCampusFilterId)) return false;
                              
                              // Eğitim Düzeyi (Lisans/Önlisans)
                              if (globalFilters.level !== 'all') {
                                const level = (p.degree_level || p.programName || p.name || "").toLocaleLowerCase('tr-TR');
                                if (globalFilters.level === 'lisans' && (!level.includes('lisans') || level.includes('önlisans') || level.includes('onlisans'))) return false;
                                if (globalFilters.level === 'onlisans' && !level.includes('önlisans') && !level.includes('onlisans')) return false;
                              }

                              // Puan Türü
                              if (globalFilters.scoreType !== 'all') {
                                const scoreT = (p.score_type || p.scoreType || "").toUpperCase();
                                if (scoreT !== globalFilters.scoreType) return false;
                              }

                              // Burs Durumu
                              if (globalFilters.type === 'vakif' && globalFilters.scholarship !== 'all') {
                                const progName = (p.name || "").toLocaleLowerCase('tr-TR');
                                const burs = globalFilters.scholarship.toLocaleLowerCase('tr-TR');
                                if (!progName.includes(burs) && !(burs === 'ücretli' && progName.includes('ucretli'))) return false;
                              }

                              // Başarı Sırası (Min/Max Rank)
                              const rank = parseInt(p.success_rank_2023 || p.successRank, 10);
                              if (!isNaN(rank)) {
                                if (minRank !== "" && rank < parseInt(minRank, 10)) return false;
                                if (maxRank !== "" && rank > parseInt(maxRank, 10)) return false;
                              }

                              // Bölüm Arama Keyword (Modal'dan)
                              if (globalFilters.keyword.trim().length > 0) {
                                if (!(p.name || '').toLocaleLowerCase('tr-TR').includes(globalFilters.keyword.trim().toLocaleLowerCase('tr-TR'))) return false;
                              }

                              // Sağ Panel İçi Arama
                              return (p.name || '').toLocaleLowerCase('tr-TR').includes(programSearchQuery.toLocaleLowerCase('tr-TR'));
                            });
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
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isExpanded ? '#f8fafc' : '#fff' }}
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
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        let target = null;
                                        if (p.campus_id) {
                                          target = universities.find(u => String(u.id) === String(p.campus_id));
                                        }
                                        // Sadece yerleşke bulunamazsa veya koordinatı sıfır/undefined ise ana kampüse düş
                                        if (!target || (!target.lat && !target.latitude)) {
                                          target = universities.find(u => String(u.id) === String(p.university_id));
                                        }
                                        if (!target || (!target.lat && !target.latitude)) {
                                          target = selectedSubCampus;
                                        }
                                        
                                        const lat = target?.lat || target?.latitude;
                                        const lng = target?.lng || target?.longitude;
                                        
                                        if (lat && lng) {
                                          setActiveCampusMarker(target);
                                          setMapFocus({ latitude: Number(lat), longitude: Number(lng), zoom: 16 });
                                          // Sadece popup'ı aç, selected state'ini (sağ paneli) ezme!
                                          if (target && target.id) {
                                            setTimeout(() => {
                                              const marker = markerRefs.current[target.id];
                                              if (marker) marker.openPopup();
                                            }, 400); 
                                          }
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
                  <div className="csd-card">
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '15px' }}>Bağlı Alt Yerleşkeler / MYO'lar</h3>
                    {isFetchingCampusPrograms ? (
                      <div className="csd-empty" style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#3b82f6', fontSize: '15px' }}>Yükleniyor...</h4>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>Yerleşke bilgileri sorgulanıyor.</p>
                      </div>
                    ) : activeRelatedMyos.length === 0 ? (
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
                        {activeRelatedMyos.map(myo => (
                          <button
                            key={myo.id}
                            style={{ textAlign: 'left', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            onClick={() => {
                              setActiveCampusMarker(myo);
                              setMapFocus({ latitude: Number(myo.lat || myo.latitude), longitude: Number(myo.lng || myo.longitude), zoom: 15 });
                              setActiveCampusFilterId(myo.id);
                              setCampusDetailTab('units');
                              // Ayrıca seçilen MYO pininin popup'ını aç
                              setTimeout(() => {
                                const marker = markerRefs.current[myo.id];
                                if (marker) marker.openPopup();
                              }, 400);
                            }}
                          >
                            <span style={{ fontWeight: '500', color: '#1e293b', fontSize: '14px' }}>{myo.name}</span>
                            <span style={{ fontSize: '12px', color: '#3b82f6', background: '#eff6ff', padding: '4px 10px', borderRadius: '12px', whiteSpace: 'nowrap', marginLeft: '8px' }}>Bölümleri Gör</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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
                          <div className="csd-review-top" style={{ alignItems: 'flex-start' }}>
                            {review.profiles?.avatar_url ? (
                              <img src={review.profiles.avatar_url} alt="Avatar" className="csd-review-avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                            ) : (
                              <span className="csd-review-avatar" style={{ background: '#3b82f6', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', flexShrink: 0 }}>
                                👤
                              </span>
                            )}
                            <div className="csd-review-meta" style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                <span className="csd-review-author" style={{ fontWeight: 'bold', color: '#0f172a' }}>{review.profiles?.full_name }</span>
                                <span className="csd-review-date" style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(review.created_at).toLocaleDateString('tr-TR')}</span>
                              </div>
                              {(review.profiles?.university_name || review.profiles?.department_name) && (
                                <span style={{ fontSize: '11px', color: '#3b82f6', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>
                                  {review.profiles?.university_name} {review.profiles?.department_name && `- ${review.profiles?.department_name}`}
                                </span>
                              )}
                            </div>
                            <div className="csd-review-stars">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i} style={{ color: i < review.rating ? '#f59e0b' : '#e2e8f0', fontSize: '15px' }}>★  </span>
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
                            <p className="csd-qa-question-text" style={{ margin: '0 0 10px 0' }}>{qa.content}</p>
                            <div className="csd-qa-meta" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                {qa.profiles?.avatar_url ? (
                                  <img src={qa.profiles.avatar_url} alt="Avatar" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                  <span style={{ background: '#3b82f6', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>👤</span>
                                )}
                                <span className="csd-qa-author" style={{ fontWeight: 'bold', color: '#0f172a' }}>{qa.profiles?.full_name }</span>
                                <span className="csd-qa-date" style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(qa.created_at).toLocaleDateString('tr-TR')}</span>
                              </div>
                              {(qa.profiles?.university_name || qa.profiles?.department_name) && (
                                <span style={{ fontSize: '11px', color: '#3b82f6', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', width: 'fit-content', marginLeft: '32px' }}>
                                  {qa.profiles?.university_name} {qa.profiles?.department_name && `- ${qa.profiles?.department_name}`}
                                </span>
                              )}
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
                                  <div className="csd-answer-author" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                                      {ans.profiles?.avatar_url ? (
                                        <img src={ans.profiles.avatar_url} alt="Avatar" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                                      ) : (
                                        <span style={{ background: '#3b82f6', color: 'white', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', flexShrink: 0 }}>👤</span>
                                      )}
                                      <strong style={{ color: '#0f172a' }}>{ans.profiles?.full_name }</strong>
                                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(ans.created_at).toLocaleDateString('tr-TR')}</span>
                                    </div>
                                    {(ans.profiles?.university_name || ans.profiles?.department_name) && (
                                      <span style={{ fontSize: '10px', color: '#3b82f6', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', width: 'fit-content', marginLeft: '26px' }}>
                                        {ans.profiles?.university_name} {ans.profiles?.department_name && `- ${ans.profiles?.department_name}`}
                                      </span>
                                    )}
                                  </div>
                                  <p className="csd-answer-text" style={{ margin: '0 0 0 26px' }}>{ans.content}</p>
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
          FİLTRELER MODALI
      ======================================== */}
      {filtersOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', animation: 'fadeIn 0.2s ease-out' }} onClick={() => setFiltersOpen(false)}>
          <div className="p-2 md:p-4" style={{ background: '#fff', width: '100%', maxHeight: '85vh', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)', pointerEvents: 'auto', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>⚙️</span> Filtreler
              </h2>
              <button onClick={() => setFiltersOpen(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '16px', color: '#64748b', transition: 'background 0.2s' }}>
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {/* Program Adı / Keyword */}
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bölüm Ara</h3>
                <input
                  type="text"
                  placeholder="Sadece Belirli Bir Bölümü Haritada Göster..."
                  value={globalFilters.keyword}
                  onChange={(e) => setGlobalFilters(prev => ({ ...prev, keyword: e.target.value }))}
                  style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '2px solid #e2e8f0', outline: 'none', fontSize: '15px', color: '#1e293b' }}
                />
              </div>

              {/* Kurum Tipi */}
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Üniversite Tipi</h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => setGlobalFilters(prev => ({ ...prev, type: prev.type === 'devlet' ? 'all' : 'devlet', scholarship: prev.type === 'devlet' ? prev.scholarship : 'all' }))}
                    style={{ flex: 1, padding: '14px', borderRadius: '16px', border: globalFilters.type === 'devlet' ? '2px solid #3b82f6' : '2px solid #e2e8f0', background: globalFilters.type === 'devlet' ? '#eff6ff' : '#fff', color: globalFilters.type === 'devlet' ? '#1d4ed8' : '#64748b', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                    🏛️ Devlet
                  </button>
                  <button 
                    onClick={() => setGlobalFilters(prev => ({ ...prev, type: prev.type === 'vakif' ? 'all' : 'vakif' }))}
                    style={{ flex: 1, padding: '14px', borderRadius: '16px', border: globalFilters.type === 'vakif' ? '2px solid #3b82f6' : '2px solid #e2e8f0', background: globalFilters.type === 'vakif' ? '#eff6ff' : '#fff', color: globalFilters.type === 'vakif' ? '#1d4ed8' : '#64748b', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                    🏢 Vakıf
                  </button>
                </div>
              </div>

              {/* Burs Durumu (Dinamik - Sadece Vakıf) */}
              <div style={{ overflow: 'hidden', transition: 'all 0.3s ease-in-out', maxHeight: globalFilters.type === 'vakif' ? '200px' : '0', opacity: globalFilters.type === 'vakif' ? 1 : 0, marginTop: globalFilters.type === 'vakif' ? '0' : '-28px', pointerEvents: globalFilters.type === 'vakif' ? 'auto' : 'none' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Burs Durumu</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['Tam Burslu', '%50 İndirimli', 'Ücretli'].map((burs) => (
                    <button 
                      key={burs}
                      onClick={() => setGlobalFilters(prev => ({ ...prev, scholarship: prev.scholarship === burs ? 'all' : burs }))}
                      style={{ flex: 1, minWidth: '100px', padding: '12px 4px', borderRadius: '16px', border: globalFilters.scholarship === burs ? '2px solid #3b82f6' : '2px solid #e2e8f0', background: globalFilters.scholarship === burs ? '#eff6ff' : '#fff', color: globalFilters.scholarship === burs ? '#1d4ed8' : '#64748b', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', fontSize: '13px' }}>
                      {burs}
                    </button>
                  ))}
                </div>
              </div>

              {/* Eğitim Düzeyi */}
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Eğitim Düzeyi</h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => setGlobalFilters(prev => ({ ...prev, level: prev.level === 'lisans' ? 'all' : 'lisans' }))}
                    style={{ flex: 1, padding: '14px', borderRadius: '16px', border: globalFilters.level === 'lisans' ? '2px solid #3b82f6' : '2px solid #e2e8f0', background: globalFilters.level === 'lisans' ? '#eff6ff' : '#fff', color: globalFilters.level === 'lisans' ? '#1d4ed8' : '#64748b', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                    🎓 Lisans
                  </button>
                  <button 
                    onClick={() => setGlobalFilters(prev => ({ ...prev, level: prev.level === 'onlisans' ? 'all' : 'onlisans' }))}
                    style={{ flex: 1, padding: '14px', borderRadius: '16px', border: globalFilters.level === 'onlisans' ? '2px solid #3b82f6' : '2px solid #e2e8f0', background: globalFilters.level === 'onlisans' ? '#eff6ff' : '#fff', color: globalFilters.level === 'onlisans' ? '#1d4ed8' : '#64748b', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                    📘 Önlisans
                  </button>
                </div>
              </div>

              {/* Puan Türü */}
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Puan Türü</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['SAY', 'EA', 'SÖZ', 'DİL', 'TYT'].map((pTuru) => (
                    <button 
                      key={pTuru}
                      onClick={() => setGlobalFilters(prev => ({ ...prev, scoreType: prev.scoreType === pTuru ? 'all' : pTuru }))}
                      style={{ flex: 1, minWidth: '45px', padding: '12px 4px', borderRadius: '16px', border: globalFilters.scoreType === pTuru ? '2px solid #3b82f6' : '2px solid #e2e8f0', background: globalFilters.scoreType === pTuru ? '#eff6ff' : '#fff', color: globalFilters.scoreType === pTuru ? '#1d4ed8' : '#64748b', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', fontSize: '14px' }}>
                      {pTuru}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Başarı Sırası / Range Slider */}
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Başarı Sırası Aralığı</h3>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input 
                    type="number" 
                    placeholder="Min Sıra (Örn: 1000)" 
                    value={minRank} 
                    onChange={(e) => setMinRank(e.target.value)} 
                    style={{ flex: 1, padding: '14px', borderRadius: '16px', border: '2px solid #e2e8f0', outline: 'none', fontSize: '14px', width: '100%', color: '#1e293b' }} 
                  />
                  <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>-</span>
                  <input 
                    type="number" 
                    placeholder="Max Sıra (Örn: 50000)" 
                    value={maxRank} 
                    onChange={(e) => setMaxRank(e.target.value)} 
                    style={{ flex: 1, padding: '14px', borderRadius: '16px', border: '2px solid #e2e8f0', outline: 'none', fontSize: '14px', width: '100%', color: '#1e293b' }} 
                  />
                </div>
              </div>

              {/* Harita Görünümleri */}
              <div>
                 <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Harita Görünümleri</h3>
                 <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
                    <button 
                      onClick={() => setShowMyo(!showMyo)}
                      style={{ borderRadius: '16px', border: showMyo ? '2px solid #3b82f6' : '2px solid #e2e8f0', background: showMyo ? '#eff6ff' : '#fff', color: showMyo ? '#1d4ed8' : '#475569', fontWeight: '600', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🏢 Tüm MYO'ları Haritada Göster</span>
                      <span style={{ fontSize: '13px', background: showMyo ? '#3b82f6' : '#e2e8f0', color: showMyo ? '#fff' : '#64748b', padding: '4px 10px', borderRadius: '12px' }}>{showMyo ? 'AÇIK' : 'KAPALI'}</span>
                    </button>
                    <button 
                      onClick={() => setShowKyk(!showKyk)}
                      style={{ borderRadius: '16px', border: showKyk ? '2px solid #3b82f6' : '2px solid #e2e8f0', background: showKyk ? '#eff6ff' : '#fff', color: showKyk ? '#1d4ed8' : '#475569', fontWeight: '600', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🏠 KYK Yurtlarını Haritada Göster</span>
                      <span style={{ fontSize: '13px', background: showKyk ? '#3b82f6' : '#e2e8f0', color: showKyk ? '#fff' : '#64748b', padding: '4px 10px', borderRadius: '12px' }}>{showKyk ? 'AÇIK' : 'KAPALI'}</span>
                    </button>
                 </div>
              </div>
            </div>

            <div style={{ marginTop: '32px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <button 
                onClick={() => setFiltersOpen(false)}
                style={{ width: '100%', background: '#0f172a', color: '#fff', fontSize: '16px', fontWeight: 'bold', borderRadius: '16px', cursor: 'pointer', border: 'none', boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.2)', transition: 'transform 0.1s' }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                Sonuçları Uygula ve Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================
          PROFIL VE TERCİH LİSTESİ
      ======================================== */}
      {/* ========================================
          MESSAGES DRAWER
      ======================================== */}
      {/* ========================================
          NOTIFICATIONS DRAWER
      ======================================== */}
      {notificationsOpen && (
        <aside className="preference-drawer" style={{ display: 'flex', flexDirection: 'column', background: '#fff', zIndex: 3000 }}>
          <div className="preference-header p-2 md:p-4" style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', margin: 0 }}>
                🔔 Bildirimler
              </h2>
            </div>
            <button className="close-button" onClick={() => setNotificationsOpen(false)}>×</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {!user ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>Bildirimleri görmek için giriş yapmalısınız.</div>
            ) : notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>Henüz hiçbir bildiriminiz yok.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {notifications.map((notif, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #e2e8f0', background: notif.is_read ? 'transparent' : '#f0f9ff' }}>
                    {notif.actorProfile?.avatar_url ? (
                      <img src={notif.actorProfile.avatar_url} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold' }}>👤</div>
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '14px', color: '#0f172a', lineHeight: '1.4' }}>
                        <span style={{ fontWeight: 'bold' }}>{notif.actorProfile?.full_name || 'Bir kullanıcı'}</span> {notif.content}
                      </p>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                        {new Date(notif.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      )}

      {messagesOpen && !activeChatUser && (
        <aside style={{ position: 'fixed', bottom: 0, left: 0, right: 0, top: '15%', display: 'flex', flexDirection: 'column', backgroundColor: '#fff', zIndex: 9999, borderTopLeftRadius: '24px', borderTopRightRadius: '24px', overflow: 'hidden', boxShadow: '0 -4px 10px rgba(0,0,0,0.1)' }}>
          <>
            <div className="preference-header p-2 md:p-4" style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', margin: 0 }}>
                    💬 Mesajlar
                  </h2>
                </div>
                <button className="close-button" onClick={() => setMessagesOpen(false)}>×</button>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {!user ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>Mesajları görmek için giriş yapmalısınız.</div>
                ) : inbox.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>Henüz hiçbir mesajınız yok.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {inbox.map((conv, idx) => (
                      <div key={idx} onClick={() => setActiveChatUser(conv.otherUser)} style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #e2e8f0', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        {conv.otherUser.avatar_url ? (
                          <img src={conv.otherUser.avatar_url} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>👤</div>
                        )}
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.otherUser.full_name || 'İsimsiz'}</h4>
                          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {conv.latestMessage.sender_id === user.id ? 'Siz: ' : ''}{conv.latestMessage.content}
                          </p>
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                          {new Date(conv.latestMessage.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
        </aside>
      )}

      {preferenceOpen && (
        <aside className="preference-drawer" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="preference-header p-2 md:p-4" style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', margin: 0 }}>
                👤 Profilim
              </h2>
            </div>
            <button className="close-button" onClick={() => setPreferenceOpen(false)}>✕</button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
            {!user ? (
              // --- AUTH FORM (LOGGED OUT) ---
              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
                  {isSignUp ? "Yeni Hesap Oluştur" : "Hesabınıza Giriş Yapın"}
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
                  {isSignUp ? "Profil oluşturarak tercihlerinizi buluta kaydedin." : "Tercihlerinize erişmek için giriş yapın."}
                </p>
                
                <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <input 
                    type="email" 
                    placeholder="E-posta adresiniz" 
                    value={authEmail} 
                    onChange={(e) => setAuthEmail(e.target.value)} 
                    style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px' }} 
                    required 
                  />
                  <input 
                    type="password" 
                    placeholder="Şifreniz" 
                    value={authPassword} 
                    onChange={(e) => setAuthPassword(e.target.value)} 
                    style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px' }} 
                    required 
                  />
                  {authError && <div style={{ color: '#ef4444', fontSize: '13px' }}>{authError}</div>}
                  <button type="submit" disabled={authLoading} style={{ background: '#3b82f6', color: '#fff', padding: '12px', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', border: 'none', cursor: 'pointer' }}>
                    {authLoading ? "Bekleniyor..." : (isSignUp ? "Kayıt Ol" : "Giriş Yap")}
                  </button>
                </form>
                <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
                  {isSignUp ? "Zaten hesabınız var mı?" : "Hesabınız yok mu?"}
                  <button type="button" onClick={() => setIsSignUp(!isSignUp)} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 'bold', marginLeft: '4px', cursor: 'pointer' }}>
                    {isSignUp ? "Giriş Yap" : "Kayıt Ol"}
                  </button>
                </div>
              </div>
            ) : (
              // --- PROFILE DASHBOARD (LOGGED IN) ---
              <div style={{ padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px', background: '#fff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                {!isEditingProfile ? (
                  // DISPLAY MODE
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <img src={userProfileData.avatar_url || user.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} alt="Avatar" style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid #e2e8f0', objectFit: 'cover' }} />
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#0f172a' }}>{userProfileData.full_name || user.user_metadata?.full_name || user.email?.split('@')[0]}</h3>
                          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{user.email}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setIsEditingProfile(true)} style={{ background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', color: '#475569', transition: 'background 0.2s' }}>Düzenle</button>
                        <button onClick={() => window.confirm('Çıkış yapmak istiyor musunuz?') && signOut()} style={{ background: '#fee2e2', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', color: '#ef4444', transition: 'background 0.2s' }}>Çıkış</button>
                      </div>
                    </div>

                    {userProfileData.bio && (
                      <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', fontSize: '13px', color: '#334155', lineHeight: '1.6', borderLeft: '4px solid #3b82f6' }}>
                        {userProfileData.bio}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>🎓 {userProfileData.education_status || 'Belirtilmedi'}</span>
                      {(userProfileData.education_status === 'Okuyor' || userProfileData.education_status === 'Mezun') && userProfileData.university_name && (
                        <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>🏛️ {userProfileData.university_name}</span>
                      )}
                      {(userProfileData.education_status === 'Okuyor' || userProfileData.education_status === 'Mezun') && userProfileData.department_name && (
                        <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>📘 {userProfileData.department_name}</span>
                      )}
                      {userProfileData.education_status === 'Lise' && userProfileData.targetRank && (
                        <span style={{ background: '#fce7f3', color: '#be185d', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>🎯 Hedef Sıra: {userProfileData.targetRank}</span>
                      )}
                      {userProfileData.education_status === 'Lise' && userProfileData.targetScore && (
                        <span style={{ background: '#fce7f3', color: '#be185d', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>⭐ Puan: {userProfileData.targetScore}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  // EDIT MODE
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>Profili Düzenle</h3>
                      <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '6px 12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <img src={userProfileData.avatar_url || user.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                        <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 'bold' }}>Fotoğraf Yükle</span>
                        <input type="file" accept="image/*" onChange={uploadAvatar} style={{ display: 'none' }} />
                      </label>
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Ad Soyad</label>
                      <input type="text" value={userProfileData.full_name} onChange={(e) => updateProfileData('full_name', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} placeholder="Adınız Soyadınız" />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Hakkımda / İlgi Alanlarım</label>
                      <textarea value={userProfileData.bio} onChange={(e) => updateProfileData('bio', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', minHeight: '80px', resize: 'vertical', outline: 'none' }} placeholder="Kendinizi ve ilgi alanlarınızı kısaca anlatın..."></textarea>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Eğitim Durumu</label>
                      <select value={userProfileData.education_status} onChange={(e) => updateProfileData('education_status', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff', outline: 'none' }}>
                        <option value="Lise">Lise (Hazırlanıyor)</option>
                        <option value="Okuyor">Üniversite Okuyor</option>
                        <option value="Mezun">Üniversite Mezunu</option>
                        <option value="Çalışıyor">Çalışıyor</option>
                      </select>
                    </div>

                    {(userProfileData.education_status === 'Okuyor' || userProfileData.education_status === 'Mezun') && (
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Üniversite Adı</label>
                          <input type="text" list="university-suggestions" value={userProfileData.university_name} onChange={(e) => updateProfileData('university_name', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} placeholder="Örn: ODTÜ" />
                          <datalist id="university-suggestions">
                            {universities.map(u => <option key={u.id} value={u.name} />)}
                          </datalist>
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Bölüm Adı</label>
                          <input type="text" list="department-suggestions" value={userProfileData.department_name} onChange={(e) => updateProfileData('department_name', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} placeholder="Örn: Bilgisayar Müh." />
                          <datalist id="department-suggestions">
                            {deptSuggestions.map((d, i) => <option key={i} value={d} />)}
                          </datalist>
                        </div>
                      </div>
                    )}

                    {userProfileData.education_status === 'Lise' && (
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Hedef Sıralama</label>
                          <input type="number" value={userProfileData.targetRank} onChange={(e) => updateProfileData('targetRank', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} placeholder="Örn: 50000" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Hedef Puan</label>
                          <input type="number" value={userProfileData.targetScore} onChange={(e) => updateProfileData('targetScore', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} placeholder="Örn: 450" />
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      <button onClick={saveProfileToDb} disabled={authLoading} style={{ flex: 1, background: '#3b82f6', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', transition: 'background 0.2s' }}>
                        {authLoading ? 'Kaydediliyor...' : 'Kaydet'}
                      </button>
                      <button onClick={() => setIsEditingProfile(false)} style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', transition: 'background 0.2s' }}>
                        İptal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --- FAVORITES LIST --- */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#334155', margin: 0 }}>⭐ Tercih Listem ({favorites.length}/24)</h3>
              {favorites.length > 0 && (
                <button onClick={() => { setFavorites([]); setComparisonPrograms([]); }} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Temizle
                </button>
              )}
            </div>

            {favorites.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎯</div>
                <h4 style={{ fontSize: '15px', color: '#475569', margin: '0 0 8px 0' }}>Henüz tercih eklenmedi</h4>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Haritadan veya sağ panelden bölümlerin yanındaki yıldıza tıklayarak listenizi oluşturabilirsiniz.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '24px' }}>
                {favorites.map((program, index) => (
                  <div key={program.code} style={{ display: 'flex', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <div style={{ background: '#f1f5f9', color: '#64748b', fontWeight: 'bold', padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #e2e8f0', fontSize: '14px' }}>
                      {index + 1}
                    </div>
                    <button 
                      style={{ flex: 1, padding: '12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                      onClick={() => {
                        const university = universityMap.get(program.universityId);
                        if (university) {
                          openProgram(program, university);
                          setPreferenceOpen(false);
                        }
                      }}
                    >
                      <strong style={{ display: 'block', fontSize: '14px', color: '#0f172a', marginBottom: '4px', lineHeight: '1.3' }}>
                        {program.name || program.programName || program.birimAdi || "Program"}
                      </strong>
                      <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                        {program.universityName || program.university || "-"}
                      </span>
                      <div style={{ display: 'inline-block', background: '#eff6ff', color: '#3b82f6', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                        {program.scoreType || program.puanTuru || "-"} • TBS: {formatNumber(program.successRank ?? program.basariSirasi)}
                      </div>
                    </button>
                    <button 
                      onClick={() => addToFavorites(program)}
                      style={{ width: '40px', background: '#fff', border: 'none', borderLeft: '1px solid #e2e8f0', color: '#ef4444', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
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
          <span style={{fontSize: '20px', marginBottom: '2px'}}>🌍</span>
          <span>Kampüs</span>
        </button>
        <button type="button" onClick={openNotifications} style={{ position: 'relative' }}>
          <span style={{fontSize: '20px', marginBottom: '2px'}}>🔔</span>
          <span>Bildirimler</span>
          {notifications.filter(n => !n.is_read).length > 0 && (
            <span style={{ position: 'absolute', top: '4px', right: '14px', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 'bold', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {notifications.filter(n => !n.is_read).length}
            </span>
          )}
        </button>
        <button type="button" onClick={openMessages}>
          <span style={{fontSize: '20px', marginBottom: '2px'}}>💬</span>
          <span>Mesajlar</span>
        </button>
        <button type="button" onClick={() => toggleFloatingPanel("favorites")}>
          <span style={{fontSize: '20px', marginBottom: '2px'}}>👤</span>
          <span>Profilim</span>
        </button>
        <button type="button" onClick={() => setFiltersOpen(true)}>
          <span style={{fontSize: '20px', marginBottom: '2px'}}>⚡</span>
          <span>Filtreler</span>
        </button>
      </nav>

      {/* ========================================
          ROOT-LEVEL INDEPENDENT CHAT MODAL
      ======================================== */}
      {activeChatUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, backgroundColor: '#fff', display: 'flex', flexDirection: 'column', height: '100dvh' }}>
          
          <div style={{ flexShrink: 0, borderBottom: '1px solid #eaeaea', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => setActiveChatUser(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>←</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {activeChatUser.avatar_url ? (
                <img src={activeChatUser.avatar_url} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <span style={{ background: '#3b82f6', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>👤</span>
              )}
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>{activeChatUser.full_name || 'İsimsiz'}</h2>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Sohbet</div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {chatMessages.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: '20px', color: '#94a3b8', fontSize: '14px' }}>Sohbeti başlatın...</div>
            ) : (
              chatMessages.map(msg => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                    <div style={{ background: isMe ? '#3b82f6' : '#e2e8f0', color: isMe ? '#fff' : '#0f172a', padding: '10px 14px', borderRadius: '16px', borderBottomRightRadius: isMe ? '4px' : '16px', borderBottomLeftRadius: !isMe ? '4px' : '16px', fontSize: '14px', lineHeight: '1.4' }}>
                      {msg.content}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', textAlign: isMe ? 'right' : 'left' }}>
                      {new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )
              })
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={{ flexShrink: 0, padding: '16px', borderTop: '1px solid #eaeaea', backgroundColor: '#fff', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', display: 'flex', gap: '8px' }}>
            <input
              value={newMessageContent}
              onChange={e => setNewMessageContent(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
              placeholder="Mesaj yaz..."
              style={{ flex: 1, padding: '10px 14px', borderRadius: '20px', border: '1px solid #cbd5e1', outline: 'none' }}
            />
            <button onClick={sendMessage} disabled={!newMessageContent.trim()} style={{ background: newMessageContent.trim() ? '#3b82f6' : '#cbd5e1', color: '#fff', border: 'none', padding: '0 16px', borderRadius: '20px', fontWeight: 'bold', cursor: newMessageContent.trim() ? 'pointer' : 'not-allowed' }}>Gönder</button>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;


