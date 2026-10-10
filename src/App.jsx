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

const myoIcon = L.divIcon({
  className: "campus-marker myo-campus",
  html: `<div style="background:#8b5cf6; color:white; border-radius:50%; width:22px; height:22px; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 8px rgba(139,92,246,0.4); border: 2px solid white;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
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
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Flag } from 'lucide-react';

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
      const { data, error } = await supabase.from('universities').select('id, name, lat, lng, type, city, history, website, instagram_url, x_url, linkedin_url, parent_id');
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
  const [expandedAbout, setExpandedAbout] = useState(false);
  const [uniNews, setUniNews] = useState([]);
  const [isFetchingNews, setIsFetchingNews] = useState(false);
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
  const [isAnonymousReview, setIsAnonymousReview] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);



  useEffect(() => {
    setCampusDetailTab('info');
    setExpandedAbout(false);
    setExpandedUnits({});
    setCampusPrograms([]); // Reset programs when campus changes
    setProgramSearchQuery('');
    setExpandedProgramId(null);
  }, [selectedSubCampus?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedSubCampus) {
      const fetchNews = async () => {
        setIsFetchingNews(true);
        try {
          const parentUni = selectedSubCampus.parent_id 
            ? universities.find(u => u.id === selectedSubCampus.parent_id) 
            : null;
          const searchEntity = parentUni || selectedSubCampus;
          const uniName = searchEntity.universityName || searchEntity.name;
          const res = await fetch(`/api/news?q=${encodeURIComponent(uniName)}`);
          const data = await res.json();
          if (data.articles) {
            setUniNews(data.articles);
          } else {
            setUniNews([]);
          }
        } catch (error) {
          console.error('Haberler çekilemedi:', error);
          setUniNews([]);
        } finally {
          setIsFetchingNews(false);
        }
      };
      fetchNews();
    }
  }, [selectedSubCampus?.id, universities]);


  // Programs Fetch
  useEffect(() => {
    if (selectedSubCampus) {
      fetchCampusPrograms();
    }
  }, [selectedSubCampus?.id]);

  const fetchCampusPrograms = async () => {
    if (!selectedSubCampus) return;
    setIsFetchingCampusPrograms(true);
    if(typeof setIsFetchingMyos === 'function') setIsFetchingMyos(true);
    
    // 1. Önce tıklanan üniversitenin GERÇEK Supabase ID'sini bulalım (İsme göre)
    const uniName = selectedSubCampus.universityName || selectedSubCampus.name;
    const { data: realUniInfo, error: uniError } = await supabase
      .from('universiteler')
      .select('id')
      .ilike('isim', `%${uniName.replace(/\([^)]*\)/g, '').trim()}%`) // Parantezleri silip isme göre arıyoruz
      .single();

    if (uniError || !realUniInfo) {
       console.error("Supabase'de bu üniversite bulunamadı:", uniName);
       setIsFetchingCampusPrograms(false);
       if(typeof setIsFetchingMyos === 'function') setIsFetchingMyos(false);
       return;
    }

    const realSupabaseUniId = realUniInfo.id;

    // 2. Şimdi bu GERÇEK ID ile bölümleri çek
    const { data: bolumData, error: bolumError } = await supabase
      .from('bolumler').select('id, universite_id, isim, fakulte, puan, siralama, kontenjan')
      .eq('universite_id', realSupabaseUniId);
    
    if (bolumData) {
      setCampusPrograms(bolumData);
    } else if (bolumError) {
      console.error('Bölümler çekilirken hata:', bolumError);
    }

    // 3. MYO'ları Çek
      const { data: myoData, error: myoError } = await supabase
        .from('myolar').select('id, universite_id, isim, lat, lng, ilce')
        .eq('universite_id', realSupabaseUniId);
        
      if (myoData) {
        setActiveRelatedMyos(myoData.map(m => ({
           ...m,
           id: m.id,
           name: m.isim,
           type: m.tip || m.tipi || 'Meslek Yüksekokulu',
           latitude: m.lat,
           longitude: m.lng,
           district: m.ilce
        })));
      } else if (myoError) {
        console.error('MYOlar çekilirken hata:', myoError);
      }

      setIsFetchingCampusPrograms(false);
      if(typeof setIsFetchingMyos === 'function') setIsFetchingMyos(false);
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
      content: reviewContent,
      is_anonymous: isAnonymousReview
    }).select('*, profiles(full_name, avatar_url, university_name, department_name)').single();

    setIsSubmittingReview(false);
    
    if (error) {
      alert('Yorum gönderilirken hata oluştu: ' + error.message);
    } else {
      setIsReviewFormOpen(false);
      setReviewRating(0);
      setReviewContent('');
      setIsAnonymousReview(false);

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
  const [questionImage, setQuestionImage] = useState(null);
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
    if (!questionContent.trim() && !questionImage) {
      alert('Lütfen sorunuzu yazın veya bir fotoğraf ekleyin!');
      return;
    }
    setIsSubmittingQuestion(true);
    
    let imageUrl = null;
    if (questionImage) {
      const fileExt = questionImage.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('post_images')
        .upload(fileName, questionImage);
      
      if (uploadError) {
        alert('Fotoğraf yüklenirken hata oluştu: ' + uploadError.message);
        setIsSubmittingQuestion(false);
        return; // Stop insert
      }
      
      const { data: publicUrlData } = supabase.storage
        .from('post_images')
        .getPublicUrl(fileName);
      imageUrl = publicUrlData.publicUrl;
    }

    const { data, error } = await supabase.from('questions').insert({
      university_id: selectedSubCampus.id,
      user_id: user.id,
      content: questionContent,
      image_url: imageUrl
    }).select('*, profiles(full_name, avatar_url, university_name, department_name)').single();

    setIsSubmittingQuestion(false);
    
    if (error) {
      alert('Soru gönderilirken hata oluştu: ' + error.message);
    } else {
      setIsQuestionFormOpen(false);
      setQuestionContent('');
      setQuestionImage(null);
      const qImgInput = document.getElementById('question-image-input');
      if (qImgInput) qImgInput.value = '';

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
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [activePostMenu, setActivePostMenu] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInput, setCommentInput] = useState({});
  const [postLikes, setPostLikes] = useState({});
  const [postComments, setPostComments] = useState({});
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
              university_id: data.university_id || prev.university_id,
              university_id: data.university_id || prev.university_id,
              university_id: data.university_id || prev.university_id,
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
        const { data } = await supabase.from('bolumler').select('isim').ilike('isim', `%${value}%`).limit(15);
        if (data) {
          setDeptSuggestions([...new Set(data.map(d => d.isim))]);
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
          // 1. Parent ID bazlı filtreleme
          if (!showMyo) {
            if (university.parent_id) {
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

      // 3. Fallback: Eğer filtreleme sonucu boş dönerse, harita boş kalmasın diye en azından MYO ayarını koruyarak tümünü göster
      if (filtered.length === 0 && mapUniversities.length > 0) {
        return showMyo ? mapUniversities : mapUniversities.filter(u => !u.parent_id);
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

  const [activeRelatedMyos, setActiveRelatedMyos] = useState([]);
  const [isFetchingMyos, setIsFetchingMyos] = useState(false);

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
  const [newPostImage, setNewPostImage] = useState(null);
  const [isAnonymousPost, setIsAnonymousPost] = useState(false);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [campusTab, setCampusTab] = useState('feed');
  const [campusClubs, setCampusClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [clubEvents, setClubEvents] = useState([]);
  
  const [campusListings, setCampusListings] = useState([]);
  const [dailyMenu, setDailyMenu] = useState(null);
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [listingCategory, setListingCategory] = useState('');
  const [listingFilter, setListingFilter] = useState('Tümü');
  const [listingTitle, setListingTitle] = useState('');
  const [listingImage, setListingImage] = useState(null);
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
        const { data: posts } = await supabase.from('posts').select('*, profiles(full_name, avatar_url)').eq('user_id', viewingProfile.id).neq('is_anonymous', true).order('created_at', { ascending: false });
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
      .select('*, profiles(full_name, avatar_url, university_name, department_name), post_likes(count), post_comments(count)')
      .eq('university_name', userProfileData.university_name)
      .order('created_at', { ascending: false });
      
    if (data) {
      if (user) {
        const { data: myLikes } = await supabase.from('post_likes').select('post_id').eq('user_id', user.id);
        const myLikedPostIds = new Set((myLikes || []).map(l => l.post_id));
        
        const enhancedData = data.map(post => ({
          ...post,
          likes_count: post.post_likes?.[0]?.count || 0,
          comments_count: post.post_comments?.[0]?.count || 0,
          is_liked_by_me: myLikedPostIds.has(post.id)
        }));
        setCampusPosts(enhancedData);
      } else {
        const enhancedData = data.map(post => ({
          ...post,
          likes_count: post.post_likes?.[0]?.count || 0,
          comments_count: post.post_comments?.[0]?.count || 0,
          is_liked_by_me: false
        }));
        setCampusPosts(enhancedData);
      }
    }
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
    
    let imageUrl = null;
    if (listingImage) {
      const fileExt = listingImage.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('post_images')
        .upload(fileName, listingImage);
      
      if (uploadError) {
        alert('Fotoğraf yüklenirken hata oluştu: ' + uploadError.message);
        setIsSubmittingListing(false);
        return; // Stop insert
      }
      
      const { data: publicUrlData } = supabase.storage
        .from('post_images')
        .getPublicUrl(fileName);
      imageUrl = publicUrlData.publicUrl;
    }

    const { data, error } = await supabase.from('listings').insert({
      user_id: user.id,
      university_name: userProfileData.university_name,
      category: listingCategory,
      title: listingTitle,
      description: listingDescription,
      price: listingPrice ? parseFloat(listingPrice) : null,
      image_url: imageUrl
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
      setListingImage(null);
      const listImgInput = document.getElementById('listing-image-input');
      if (listImgInput) listImgInput.value = '';
    }
  };

  
  const handleLikePost = async (post) => {
    if (!user) return;
    
    // 1. Veritabanından GERÇEK durumu kontrol et
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .maybeSingle();
      
    const isActuallyLiked = !!existingLike;

    if (isActuallyLiked) {
      // Zaten beğenilmişse -> SİL
      setCampusPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes_count: Math.max(0, (p.likes_count || 1) - 1), is_liked_by_me: false } : p));
      
      const { error } = await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
      if (error) {
        console.error("Like delete error:", error);
        alert("Beğeni geri alınırken hata oluştu: " + error.message);
        // Rollback
        setCampusPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes_count: (p.likes_count || 0) + 1, is_liked_by_me: true } : p));
      }
    } else {
      // Beğenilmemişse -> EKLE
      setCampusPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes_count: (p.likes_count || 0) + 1, is_liked_by_me: true } : p));
      
      const { error } = await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id });
      if (error) {
        console.error("Like insert error:", error);
        alert("Beğenilirken hata oluştu: " + error.message);
        // Rollback
        setCampusPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes_count: Math.max(0, (p.likes_count || 1) - 1), is_liked_by_me: false } : p));
        return;
      }
      
      if (post.user_id !== user.id && !post.is_anonymous) {
        const { error: notifError } = await supabase.from('notifications').insert({
          user_id: post.user_id,
          actor_id: user.id,
          type: 'like',
          post_id: post.id,
          content: 'gönderinizi beğendi.'
        });
        if (notifError) console.error("Notification insert error:", notifError);
      }
    }
  };

  
  const handleNotificationClick = (notif) => {
    setNotificationsOpen(false);
    
    if (notif.post_id) {
      setMessagesOpen(false);
      setPreferenceOpen(false);
      setBrowseOpen(true);
      
      setTimeout(() => {
        const el = document.getElementById(`post-${notif.post_id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const originalBg = el.style.backgroundColor;
          el.style.backgroundColor = 'rgba(238, 242, 255, 0.8)'; // indigo-50
          setTimeout(() => {
            el.style.backgroundColor = originalBg;
          }, 1500);
        }
      }, 300);
    } else {
      setMessagesOpen(true);
    }
  };
const toggleComments = async (postId) => {
    if (expandedComments[postId]) {
      setExpandedComments(prev => ({ ...prev, [postId]: false }));
    } else {
      setExpandedComments(prev => ({ ...prev, [postId]: true }));
      if (!postComments[postId]) {
        const { data } = await supabase.from('post_comments').select('*, profiles(full_name, avatar_url)').eq('post_id', postId).order('created_at', { ascending: true });
        if (data) {
          setPostComments(prev => ({ ...prev, [postId]: data }));
        }
      }
    }
  };

  const handlePostComment = async (postId, postOwnerId, isAnon) => {
    const content = commentInput[postId];
    if (!content || !content.trim() || !user) return;

    const { data, error } = await supabase.from('post_comments').insert({
      post_id: postId,
      user_id: user.id,
      content: content.trim()
    }).select('*, profiles(full_name, avatar_url)').single();

    if (error) {
      console.error("Comment insert error:", error);
      alert('Yorum gönderilemedi: ' + error.message);
      return;
    }

    if (data) {
      setPostComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), data]
      }));
      setCommentInput(prev => ({ ...prev, [postId]: '' }));
      setCampusPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p));
      
      if (postOwnerId !== user.id && !isAnon) {
        const { error: notifError } = await supabase.from('notifications').insert({
          user_id: postOwnerId,
          actor_id: user.id,
          type: 'comment',
          post_id: postId,
          content: 'gönderinize yorum yaptı.'
        });
        if (notifError) {
          console.error("Notification insert error (comment):", notifError);
          alert("Bildirim gönderilirken hata oluştu: " + notifError.message);
        }
      }
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Bu gönderiyi silmek istediğinize emin misiniz?")) return;
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (!error) {
      setCampusPosts(campusPosts.filter(p => p.id !== postId));
      setActivePostMenu(null);
    } else {
      alert("Silinirken hata oluştu: " + error.message);
    }
  };

  const handleSharePost = (postId) => {
    const link = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(link);
    alert('Bağlantı panoya kopyalandı!');
  };
const submitCampusPost = async () => {
    if (!newPostContent.trim() && !newPostImage) return;
    setIsSubmittingPost(true);
    
    let imageUrl = null;
    if (newPostImage) {
      const fileExt = newPostImage.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('post_images')
        .upload(fileName, newPostImage);
      
      if (uploadError) {
        alert('Fotoğraf yüklenirken hata oluştu: ' + uploadError.message);
        setIsSubmittingPost(false);
        return; // Stop insert
      }
      
      const { data: publicUrlData } = supabase.storage
        .from('post_images')
        .getPublicUrl(fileName);
      imageUrl = publicUrlData.publicUrl;
    }
    
    const { data, error } = await supabase.from('posts').insert({
      user_id: user.id,
      university_name: userProfileData.university_name,
      content: newPostContent,
      is_anonymous: isAnonymousPost,
      category: campusTab === 'confessions' ? 'confessions' : 'feed',
      image_url: imageUrl
    }).select('*, profiles(full_name, avatar_url, university_name, department_name)').single();
    
    setIsSubmittingPost(false);
    if (error) {
      alert('Gönderi paylaşılırken hata oluştu: ' + error.message);
    } else {
      setNewPostContent('');
      setNewPostImage(null);
      const postImgInput = document.getElementById('post-image-input');
      if (postImgInput) postImgInput.value = '';
      setIsAnonymousPost(false);
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

  const displayUniversity = selectedSubCampus?.parent_id
    ? (universities.find(u => u.id === selectedSubCampus.parent_id) || selectedSubCampus)
    : selectedSubCampus;

  const isAnyModalOpen = (selectedUniversity !== null) || (selectedProgram !== null) || (selectedKyk !== null) || (filtersOpen === true) || (selectedSubCampus !== null) || (preferenceOpen === true) || (browseOpen === true) || (aboutOpen === true);
  return (
    <>
      <div className="relative w-screen h-screen overflow-hidden bg-slate-50 text-slate-800 font-sans">
        
        {/* ========================================
            FLOATING WIDGETS (Logo + Search + Filters)
        ======================================== */}
        <>
          {/* 1. Logo (Top Left) */}
          <div className="fixed top-4 left-4 z-[1000] bg-white/70 backdrop-blur-md shadow-sm border border-white/40 rounded-xl px-3 py-1.5 flex items-center gap-2 pointer-events-auto">
            <span className="text-xl">🎓</span>
            <span className="text-sm font-semibold !text-slate-900 hidden md:inline">Türkiye Üniversite Haritası</span>
          </div>

          {/* 2. Search & Filters (Top Center) */}
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-2 w-full max-w-[90%] md:max-w-md pointer-events-none">
            
            {/* Search Input Container */}
            <div className="pointer-events-auto w-full bg-white/80 backdrop-blur-xl shadow-md border border-white/50 rounded-full px-4 py-2 flex items-center relative">
              <input
                type="text"
                placeholder="🔍 Üniversite veya şehir ara..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="w-full bg-transparent outline-none text-sm text-slate-800"
              />
              {searchInput.trim().length > 1 && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-white/95 backdrop-blur-md rounded-xl shadow-xl z-[1001] max-h-72 overflow-y-auto border border-slate-100 p-2 text-left">
                  {loadingSupabaseSearch ? (
                    <div className="text-center text-slate-500 p-4">Arama sonuçları yükleniyor...</div>
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
                        className="px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer flex flex-col rounded-lg transition"
                      >
                        <strong className="text-sm text-slate-800">
                          {result.type === 'university' ? result.university.name : result.program.name}
                        </strong>
                        <span className="text-xs text-slate-500 mt-1">
                          {result.type === 'university' ? result.university.city : result.university.name}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-slate-500 p-4">Sonuç bulunamadı.</div>
                  )}
                </div>
              )}
            </div>

            {/* Filters Container */}
            <div className="flex flex-wrap justify-center gap-1.5 w-full pointer-events-auto">
                <button 
                  className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition shadow-sm border backdrop-blur-md ${showMyo ? 'bg-indigo-500/30 text-indigo-900 border-indigo-300/60' : 'bg-white/70 text-slate-700 border-white/40 hover:bg-white/90'}`}
                  onClick={() => setShowMyo(!showMyo)}>
                  🏢 Tüm MYO'ları Göster
                </button>
                <button 
                  className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition shadow-sm border backdrop-blur-md ${showKyk ? 'bg-rose-500/30 text-rose-900 border-rose-300/60' : 'bg-white/70 text-slate-700 border-white/40 hover:bg-white/90'}`}
                  onClick={() => setShowKyk(!showKyk)}>
                  🏠 KYK Yurtları
                </button>
                <button 
                  className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition shadow-sm border backdrop-blur-md ${globalFilters.type === 'devlet' ? 'bg-blue-500/30 text-blue-900 border-blue-300/60' : 'bg-white/70 text-slate-700 border-white/40 hover:bg-white/90'}`}
                  onClick={() => setGlobalFilters(prev => ({ ...prev, type: prev.type === 'devlet' ? 'all' : 'devlet' }))}>
                  Devlet
                </button>
                <button 
                  className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition shadow-sm border backdrop-blur-md ${globalFilters.type === 'vakif' ? 'bg-emerald-500/30 text-emerald-900 border-emerald-300/60' : 'bg-white/70 text-slate-700 border-white/40 hover:bg-white/90'}`}
                  onClick={() => setGlobalFilters(prev => ({ ...prev, type: prev.type === 'vakif' ? 'all' : 'vakif' }))}>
                  Vakıf
                </button>
                <button 
                  className="whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium bg-white/70 text-slate-700 border-white/40 shadow-sm hover:bg-white/90 transition border backdrop-blur-md"
                  onClick={() => setFiltersOpen(true)}>
                  ⚙ Detaylı Filtre
                </button>
            </div>
          </div>
        </>

      {/* ========================================
          FULLSCREEN MAP
      ======================================== */}
      <main className="absolute top-0 left-0 w-full h-full z-0">
        <MapContainer
            center={[
              39.0,
              35.0,
            ]}
            zoom={7}
            style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }}
          >
            <MapResizer isPanelOpen={isAnyModalOpen} />

            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
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
                    icon={university.parent_id ? myoIcon : (university.type === 'Ana Kampüs' ? mainCampusIcon : subCampusIcon)} 
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
                icon={activeCampusMarker.parent_id ? myoIcon : (activeCampusMarker.type === 'Ana Kampüs' ? mainCampusIcon : subCampusIcon)}
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
        {browseOpen && (
          <aside className="fixed right-4 top-[100px] bottom-[90px] w-[calc(100%-2rem)] md:w-full max-w-[420px] z-[1500] bg-white/60 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-transform">
            {viewingProfile ? (
              <>
                <div className="browse-panel-header p-2 md:p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.3)', background: 'transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => setViewingProfile(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>←</button>
                    <div style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '14px' }}>PROFİL</div>
                  </div>
                </div>
                <div className="overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']" style={{ padding: '24px 16px', flex: 1, background: 'transparent' }}>
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
                          <div key={post.id} className="bg-white/40 border border-white/50 backdrop-blur-md shadow-sm rounded-2xl p-4">
                            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#334155', whiteSpace: 'pre-wrap' }}>{post.content}</p>
                            {post.image_url && <img src={post.image_url} alt="Gönderi" style={{ width: '100%', maxHeight: '250px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} />}
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
                          <div key={listing.id} className="bg-white/40 border border-white/50 backdrop-blur-md shadow-sm rounded-2xl p-4">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <h4 className="break-words break-all whitespace-normal" style={{ margin: 0, fontSize: '14px', color: '#0f172a' }}>{listing.title}</h4>
                              <span style={{ fontSize: '11px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '6px', color: '#475569' }}>{listing.category}</span>
                            </div>
                            <p className="break-words break-all whitespace-normal" style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#64748b' }}>{listing.description}</p>
                              {listing.image_url && <div className="mt-2 mb-3"><img src={listing.image_url} alt="İlan" className="w-full max-h-48 object-cover rounded-lg border border-slate-200" /></div>}
                              <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-200/50">
  <button onClick={(e) => { e.stopPropagation(); setActiveChatUser({ id: listing.user_id, full_name: listing.profiles?.full_name, avatar_url: listing.profiles?.avatar_url, university_name: listing.university_name, department_name: listing.profiles?.department_name }); }} className="bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-4 py-2 rounded-xl transition-all border border-indigo-100/50 flex items-center gap-1.5 shadow-sm active:scale-95">
    <span>💬</span> Mesaj At
  </button>
  <div className="text-emerald-600 font-extrabold text-sm">
    {(listing.price !== null && listing.price !== undefined && Number(listing.price) > 0) ? `${Number(listing.price).toLocaleString('tr-TR')} ₺` : 'Ücretsiz'}
  </div>
</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : selectedClub ? (
              <>
                <div className="browse-panel-header p-2 md:p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.3)', background: 'transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => setSelectedClub(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>←</button>
                    <div>
                      <div className="detail-label" style={{ color: '#3b82f6' }}>KULÜP DETAYI</div>
                      <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>{selectedClub.name}</h2>
                    </div>
                  </div>
                </div>
                <div className="overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']" style={{ flex: 1, background: 'transparent' }}>
                  <div className="bg-white/40 border border-white/50 backdrop-blur-md shadow-sm rounded-2xl mb-5 p-4">
                    <p style={{ margin: 0, color: '#334155', fontSize: '15px', lineHeight: '1.6' }}>{selectedClub.description}</p>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '16px', color: '#0f172a', margin: 0 }}>Yaklaşan Etkinlikler</h3>
                  </div>
                  
                  {clubEvents.length === 0 ? (
                    <div className="bg-white/30 backdrop-blur-md rounded-2xl border border-white/40 border-dashed text-center p-10">
                      <div style={{ fontSize: '32px', marginBottom: '12px' }}>📅</div>
                      <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Yaklaşan etkinlik bulunmuyor, takipte kal!</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {clubEvents.map(ev => (
                        <div key={ev.id} className="bg-white/40 border border-white/50 border-l-4 border-l-blue-500 backdrop-blur-md shadow-sm rounded-xl p-4">
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
                <div className="relative flex flex-col items-center pt-8 pb-4 px-6 border-b border-gray-200/50">
                  <button className="absolute top-4 right-4 bg-gray-100/50 hover:bg-gray-200 rounded-full p-2 text-gray-500 transition-colors w-8 h-8 flex items-center justify-center" onClick={() => setBrowseOpen(false)}>
                    ✕
                  </button>
                  
                  <h2 className="text-xl font-extrabold text-slate-900 text-center drop-shadow-sm">
                    {userProfileData.university_name || 'Kampüs'}
                  </h2>
                  <span className="text-sm font-semibold text-slate-700 mt-1">
                    Üniversite Kampüsü
                  </span>
                  
                  {user && userProfileData.university_name && (
                    <div className="flex w-full bg-black/5 backdrop-blur-md p-1 rounded-xl mt-5">
                      <button onClick={() => { setCampusTab('feed'); setIsAnonymousPost(false); }} className={`flex-1 text-center py-2 text-sm font-medium rounded-xl transition-all ${campusTab === 'feed' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Akış</button>
                      <button onClick={() => { setCampusTab('confessions'); setIsAnonymousPost(true); }} className={`flex-1 text-center py-2 text-sm font-medium rounded-xl transition-all ${campusTab === 'confessions' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>İtiraflar</button>
                      <button onClick={() => setCampusTab('clubs')} className={`flex-1 text-center py-2 text-sm font-medium rounded-xl transition-all ${campusTab === 'clubs' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Kulüpler</button>
                      <button onClick={() => setCampusTab('listings')} className={`flex-1 text-center py-2 text-sm font-medium rounded-xl transition-all ${campusTab === 'listings' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Pano</button>
                    </div>
                  )}
                </div>

                <div className="overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']" style={{ flex: 1, background: 'transparent' }}>
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
                  ) : (campusTab === 'feed' || campusTab === 'confessions') ? (
                    <>
                      {campusTab === 'feed' && dailyMenu && (
                        <div style={{ background: '#ecfdf5', borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px', border: '1px solid #d1fae5', marginBottom: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                          <span style={{ fontSize: '24px', flexShrink: 0 }}>🍽️</span>
                          <div>
                            <h4 style={{ margin: '0 0 4px 0', color: '#065f46', fontSize: '15px' }}>Günün Menüsü</h4>
                            <p style={{ margin: 0, color: '#047857', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{dailyMenu.content}</p>
                          </div>
                        </div>
                      )}
                      <div className="campus-composer flex items-start gap-3 p-4 bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm mb-4 mx-4">
                        {userProfileData.avatar_url || user.user_metadata?.avatar_url ? (
                          <img src={userProfileData.avatar_url || user.user_metadata?.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full object-cover shrink-0" />
                        ) : (
                          <span className="bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shrink-0">👤</span>
                        )}
                        <div className="flex-1 flex flex-col w-full">
                          <textarea
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            placeholder={campusTab === 'confessions' ? "İçindekileri dök, tamamen anonimsin..." : "Kampüste neler oluyor?"}
                            className="w-full bg-transparent resize-none outline-none text-sm text-slate-800 placeholder:text-slate-500"
                            style={{ minHeight: '60px' }}
                          />
                          <div className="flex items-center w-full mt-2 pt-2 border-t border-white/40">
                            {campusTab === 'confessions' && (
                              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-500 mr-auto">
                                <input type="checkbox" checked={isAnonymousPost} onChange={e => setIsAnonymousPost(e.target.checked)} />
                                💬 Anonim Paylaş
                              </label>
                            )}
                            
                            <div className="flex items-center gap-2 mr-auto ml-2">
                              <label className="cursor-pointer flex items-center justify-center p-1 text-slate-400 hover:text-indigo-600 transition-colors" title="Fotoğraf Ekle">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <input id="post-image-input" type="file" accept="image/*" className="hidden" onChange={(e) => { if(e.target.files && e.target.files[0]) setNewPostImage(e.target.files[0]); }} />
                              </label>
                              {newPostImage && (
                                <div className="text-xs text-indigo-600 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded">
                                  <span className="truncate max-w-[100px]">{newPostImage.name}</span>
                                  <button onClick={() => { setNewPostImage(null); const el = document.getElementById('post-image-input'); if(el) el.value=''; }} className="hover:text-indigo-800 ml-1">×</button>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={submitCampusPost}
                              disabled={isSubmittingPost || (!newPostContent.trim() && !newPostImage)}
                              className={`bg-indigo-600 text-white px-5 py-1.5 rounded-full text-sm font-semibold hover:bg-indigo-700 transition-colors ml-auto ${(!newPostContent.trim() && !newPostImage) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {isSubmittingPost ? 'Paylaşılıyor...' : 'Paylaş'}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="campus-feed flex flex-col pb-4">
                        {campusPosts.filter(post => {
                          const postCat = post.category || (post.is_anonymous ? 'confessions' : 'feed');
                          return campusTab === 'confessions' ? postCat === 'confessions' : postCat === 'feed';
                        }).length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
                            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📝</div>
                            <p>Henüz kimse bir şey paylaşmadı.<br/>İlk paylaşan sen ol!</p>
                          </div>
                        ) : (
                          campusPosts.filter(post => {
                            const postCat = post.category || (post.is_anonymous ? 'confessions' : 'feed');
                            return campusTab === 'confessions' ? postCat === 'confessions' : postCat === 'feed';
                          }).map(post => (
                              <div id={`post-${post.id}`} key={post.id} className="campus-post-card flex flex-col p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm mb-3 mx-4" style={{ transition: 'background-color 1.5s ease' }}>
                                <div className="flex items-center gap-3 mb-2">
                                  <div className={`shrink-0 ${post.is_anonymous ? 'cursor-default' : 'cursor-pointer'}`} onClick={() => !post.is_anonymous && setViewingProfile({ id: post.user_id, full_name: post.profiles?.full_name, avatar_url: post.profiles?.avatar_url, university_name: post.university_name, department_name: post.profiles?.department_name })}>
                                    {post.is_anonymous ? (
                                      <span className="bg-slate-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl">👻</span>
                                    ) : post.profiles?.avatar_url ? (
                                      <img src={post.profiles.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                      <span className="bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-base font-bold">👤</span>
                                    )}
                                  </div>
                                  
                                  <div className="flex flex-col items-start text-left">
                                    <span className={`text-sm font-bold text-slate-900 ${post.is_anonymous ? 'cursor-default' : 'cursor-pointer'}`} onClick={() => !post.is_anonymous && setViewingProfile({ id: post.user_id, full_name: post.profiles?.full_name, avatar_url: post.profiles?.avatar_url, university_name: post.university_name, department_name: post.profiles?.department_name })}>
                                      {post.is_anonymous ? 'Anonim' : (post.profiles?.full_name || 'İsimsiz')}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                      {!post.is_anonymous && (
                                        <>{post.profiles?.department_name || post.university_name} • </>
                                      )}
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
                                </div>
                                <p className="text-sm text-slate-800 text-left leading-relaxed whitespace-pre-wrap break-words">{post.content}</p>
                                  {post.image_url && (
                                    <div className="mt-3 relative w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-50/50">
                                      <img src={post.image_url} alt="Gönderi" className="w-full max-h-96 object-contain" />
                                    </div>
                                  )}
<div className="flex justify-between items-center mt-2 pt-3 border-t border-slate-200/50">
                                    <div className="flex items-center gap-4">
                                      <button onClick={() => handleLikePost(post)} className={`flex items-center gap-1.5 transition-colors ${post.is_liked_by_me ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'}`}>
                                        <Heart size={18} className={post.is_liked_by_me ? 'fill-rose-500' : ''} />
                                        <span className="text-sm font-medium">{post.likes_count || 0}</span>
                                      </button>
                                      <button onClick={() => toggleComments(post.id)} className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-500 transition-colors">
                                        <MessageCircle size={18} />
                                        <span className="text-sm font-medium">{post.comments_count || (postComments[post.id]?.length || 0)}</span>
                                      </button>
                                      <button onClick={() => handleSharePost(post.id)} className="flex items-center gap-1.5 text-slate-500 hover:text-emerald-500 transition-colors">
                                        <Share2 size={18} />
                                      </button>
                                    </div>
                                    <div className="relative">
                                      <button onClick={() => setActivePostMenu(activePostMenu === post.id ? null : post.id)} className="text-slate-400 hover:text-slate-600 p-1">
                                        <MoreHorizontal size={20} />
                                      </button>
                                      {activePostMenu === post.id && (
                                        <div className="absolute right-0 bottom-full mb-2 w-36 bg-white border border-slate-100 shadow-xl rounded-xl overflow-hidden z-[2000] py-1 animate-in fade-in zoom-in duration-100">
                                          {post.user_id === user?.id ? (
                                            <button onClick={() => handleDeletePost(post.id)} className="w-full text-left px-4 py-2 text-sm text-rose-600 font-semibold hover:bg-rose-50 flex items-center gap-2">
                                              <Trash2 size={16} /> Sil
                                            </button>
                                          ) : (
                                            <button onClick={() => { alert('Gönderi bildirildi.'); setActivePostMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 font-semibold hover:bg-slate-50 flex items-center gap-2">
                                              <Flag size={16} /> Bildir
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {expandedComments[post.id] && (
                                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-3">
                                      {(postComments[post.id] || []).map(comment => (
                                        <div key={comment.id} className="flex gap-2">
                                          {comment.profiles?.avatar_url ? (
                                            <img src={comment.profiles.avatar_url} className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5" />
                                          ) : (
                                            <div className="w-6 h-6 rounded-full bg-slate-200 shrink-0 mt-0.5"></div>
                                          )}
                                          <div className="flex flex-col bg-slate-50/50 rounded-xl rounded-tl-sm px-3 py-2 text-sm border border-slate-100">
                                            <span className="font-semibold text-slate-800">{comment.profiles?.full_name || 'İsimsiz'}</span>
                                            <span className="text-slate-600 break-words">{comment.content}</span>
                                          </div>
                                        </div>
                                      ))}
                                      
                                      {(() => {
        const isQuestion = post.category === 'question' || post.category === 'questions';
        const userRole = (userProfileData.role || userProfileData.education_status || '').toLowerCase();
        const hasValidRole = ['student', 'alumni', 'öğrenci', 'mezun', 'ogrenci'].includes(userRole);
        
        // Strict matching based on ID if available, otherwise fallback to Name
        const hasUniversity = !!(userProfileData.university_id || userProfileData.university_name);
        const isSameUniversity = (userProfileData.university_id && post.university_id)
            ? String(userProfileData.university_id) === String(post.university_id)
            : userProfileData.university_name === post.university_name;
            
        if (isQuestion && !hasUniversity) {
            return (
              <div className="flex gap-2 items-center mt-1 w-full flex-col">
                <div className="w-full text-center py-2 px-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-semibold">
                  Cevap verebilmek için önce profilinizden üniversitenizi seçmelisiniz.
                </div>
                <button onClick={() => { setBrowseOpen(false); setPreferenceOpen(true); }} className="text-xs bg-indigo-600 text-white px-4 py-2 mt-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm">
                  Profilime Git
                </button>
              </div>
            );
        }

        const canCommentOnQuestion = !isQuestion || (hasValidRole && isSameUniversity);
        
        return (
          <div className="flex gap-2 items-center mt-1 w-full">
            {!canCommentOnQuestion ? (
              <div className="w-full text-center py-2 px-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-semibold">
                Bu soruya yalnızca bu üniversitenin öğrencileri ve mezunları cevap verebilir.
              </div>
            ) : (
              <>
                <input 
                  type="text" 
                  value={commentInput[post.id] || ''} 
                  onChange={(e) => setCommentInput(prev => ({ ...prev, [post.id]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') handlePostComment(post.id, post.user_id, post.is_anonymous); }}
                  placeholder="Yorum yaz..." 
                  className="flex-1 bg-white border border-slate-200 rounded-full px-4 py-1.5 text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
                <button onClick={() => handlePostComment(post.id, post.user_id, post.is_anonymous)} disabled={!(commentInput[post.id] || '').trim()} className="bg-indigo-600 text-white rounded-full p-1.5 shrink-0 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                </button>
              </>
            )}
          </div>
        );
    })()}
                                    </div>
                                  )}
                                </div>
                          ))
                        )}
                      </div>
                    </>
                  ) : campusTab === 'clubs' ? (
                    <div className="campus-clubs flex flex-col pb-4">
                      {campusClubs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🏆</div>
                          <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Kulüpler Çok Yakında</h3>
                          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>Üniversitene ait kulüpler çok yakında burada olacak.</p>
                        </div>
                      ) : (
                        campusClubs.map(club => (
                          <div key={club.id} className="bg-white/40 border border-white/50 backdrop-blur-md shadow-sm rounded-2xl p-4 mb-3 mx-4 flex items-center justify-between">
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
                    <div className="campus-listings flex flex-col pb-4">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px', paddingRight: '16px' }}>
                           <button onClick={() => setIsListingModalOpen(true)} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+ İlan Ver</button>
                        </div>

                        <div className="flex overflow-x-auto gap-2 pb-3 mb-2 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                          {['Tümü', 'Ev Arkadaşı', 'İkinci El', 'Ders Notu', 'Yol Arkadaşı', 'Kamp & Etkinlik', 'Yarı Zamanlı İş', 'Kayıp Eşya'].map(cat => (
                            <div 
                              key={cat} 
                              onClick={() => setListingFilter(cat)}
                              className={listingFilter === cat 
                                ? "whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-bold bg-indigo-600 text-white shadow-md transition-all cursor-pointer"
                                : "whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium bg-white/40 border border-white/50 text-slate-700 shadow-sm hover:bg-white/60 transition-all cursor-pointer"
                              }
                            >
                              {cat}
                            </div>
                          ))}
                        </div>
  
                        {(listingFilter === 'Tümü' ? campusListings : campusListings.filter(l => l.category === listingFilter)).length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📢</div>
                            <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Kampüs panosu şu an boş.</h3>
                            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>İlk ilanı sen ver!</p>
                          </div>
                      ) : (
                          (listingFilter === 'Tümü' ? campusListings : campusListings.filter(l => l.category === listingFilter)).map(listing => (
                            <div key={listing.id} className="bg-white/40 border border-white/50 backdrop-blur-md shadow-sm rounded-2xl p-4 mb-3 mx-4 relative">
                               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setViewingProfile({ id: listing.user_id, full_name: listing.profiles?.full_name, avatar_url: listing.profiles?.avatar_url, university_name: listing.university_name, department_name: listing.profiles?.department_name })}>
                                   {listing.profiles?.avatar_url ? (
                                      <img src={listing.profiles.avatar_url} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                                   ) : (
                                      <span style={{ background: '#3b82f6', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>👤</span>
                                   )}
                                   <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>{listing.profiles?.full_name || 'İsimsiz'}</span>
                                 </div>
                                 <span className="text-xs font-bold bg-indigo-100/80 text-indigo-700 px-2.5 py-1 rounded-md">{listing.category}</span>
                               </div>
                               <h4 className="break-words break-all whitespace-normal" style={{ margin: '0 0 6px 0', color: '#0f172a', fontSize: '16px' }}>{listing.title}</h4>
                               <p className="break-words break-all whitespace-normal" style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>{listing.description}</p>
                                 {listing.image_url && <div className="mt-3 mb-4"><img src={listing.image_url} alt="İlan" className="w-full max-h-64 object-cover rounded-xl border border-slate-200" /></div>}
                                 <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-200/50">
  <button onClick={(e) => { e.stopPropagation(); setActiveChatUser({ id: listing.user_id, full_name: listing.profiles?.full_name, avatar_url: listing.profiles?.avatar_url, university_name: listing.university_name, department_name: listing.profiles?.department_name }); }} className="bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-4 py-2 rounded-xl transition-all border border-indigo-100/50 flex items-center gap-1.5 shadow-sm active:scale-95">
    <span>💬</span> Mesaj At
  </button>
  <div className="text-emerald-600 font-extrabold text-sm">
    {(listing.price !== null && listing.price !== undefined && Number(listing.price) > 0) ? `${Number(listing.price).toLocaleString('tr-TR')} ₺` : 'Ücretsiz'}
  </div>
</div>
                            </div>
                          ))
                      )}
                    </div>
                  ) : null}
                </div>
              </>
            )}

            {isListingModalOpen && (
               <div className="absolute inset-0 z-[2000] flex items-start justify-center p-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                  <div className="relative w-full max-w-md mx-auto bg-white/85 backdrop-blur-3xl border border-white/60 rounded-3xl shadow-2xl p-6 z-[2000]">
                     <h3 className="text-xl font-extrabold text-slate-900 mb-6 text-left">İlan Ver</h3>
                     <button onClick={() => { setIsListingModalOpen(false); setListingImage(null); const el = document.getElementById('listing-image-input'); if(el) el.value=''; }} className="absolute top-4 right-4 bg-slate-100/50 hover:bg-slate-200/80 rounded-full p-2 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                     </button>
                     
                     <div className="flex flex-col gap-4">
                        <div>
                           <label className="block text-left text-sm font-semibold text-slate-700 mb-1.5">Kategori</label>
                           <select value={listingCategory} onChange={(e) => setListingCategory(e.target.value)} className="w-full bg-white/50 backdrop-blur-md border border-white/60 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm transition-all">
                              <option value="" disabled>Kategori Seçin</option>
                              <option value="Ev Arkadaşı">Ev / Oda Arkadaşı</option>
                              <option value="İkinci El">İkinci El Eşya</option>
                              <option value="Ders Notu">Ders Notu / Kitap</option>
                              <option value="Yol Arkadaşı">Yol Arkadaşı (Araç Paylaşımı)</option>
                              <option value="Kamp & Etkinlik">Kamp & Etkinlik</option>
                              <option value="Yarı Zamanlı İş">Yarı Zamanlı İş</option>
                              <option value="Kayıp Eşya">Kayıp Eşya</option>
                              <option value="Diğer">Diğer</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-left text-sm font-semibold text-slate-700 mb-1.5">Başlık</label>
                           <input maxLength={50} value={listingTitle} onChange={(e) => setListingTitle(e.target.value)} placeholder="Örn: 2. El Temiz Çalışma Masası" className="w-full bg-white/50 backdrop-blur-md border border-white/60 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm transition-all" />
                        </div>
                        <div>
                           <label className="block text-left text-sm font-semibold text-slate-700 mb-1.5">Açıklama</label>
                           <textarea maxLength={300} value={listingDescription} onChange={(e) => setListingDescription(e.target.value)} placeholder="İlan detayları..." rows={4} className="w-full bg-white/50 backdrop-blur-md border border-white/60 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm transition-all resize-none" />
                        </div>
                        <div>
                           <label className="block text-left text-sm font-semibold text-slate-700 mb-1.5">Fiyat (₺) - Opsiyonel</label>
                           <input type="number" min="0" max="999999" onKeyDown={(e) => ["e", "E", "+", "-", ",", "."].includes(e.key) && e.preventDefault()} onPaste={(e) => e.preventDefault()} value={listingPrice} onChange={(e) => { const val = e.target.value; if (val === "" || (Number(val) >= 0 && Number(val) <= 999999)) { setListingPrice(val); } }} placeholder="Örn: 500" className="w-full bg-white/50 backdrop-blur-md border border-white/60 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm transition-all" />
                        </div>
                          <div>
                             <label className="block text-left text-sm font-semibold text-slate-700 mb-1.5 mt-2">Fotoğraf Ekle</label>
                             <div className="flex items-center gap-3">
                               <label className="cursor-pointer bg-white/50 backdrop-blur-md border border-white/60 rounded-xl px-4 py-3 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors w-full shadow-sm">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                 </svg>
                                 <span className="text-sm font-semibold">{listingImage ? 'Değiştir' : 'Görsel Seç'}</span>
                                 <input id="listing-image-input" type="file" accept="image/*" className="hidden" onChange={(e) => { if(e.target.files && e.target.files[0]) setListingImage(e.target.files[0]); }} />
                               </label>
                               {listingImage && (
                                 <div className="flex items-center bg-indigo-50 px-3 py-3 rounded-xl border border-indigo-100 max-w-[50%] shadow-sm">
                                   <span className="text-xs text-indigo-700 font-medium truncate mr-2">{listingImage.name}</span>
                                   <button onClick={() => { setListingImage(null); const el = document.getElementById('listing-image-input'); if(el) el.value=''; }} className="text-indigo-400 hover:text-indigo-700 font-bold ml-auto p-1">×</button>
                                 </div>
                               )}
                             </div>
                          </div>
                        <button onClick={submitListing} disabled={isSubmittingListing || !listingCategory || !listingTitle.trim() || !listingDescription.trim()} className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-3.5 rounded-xl shadow-md transition-colors mt-4 ${(!listingCategory || !listingTitle.trim() || !listingDescription.trim() || isSubmittingListing) ? "opacity-50 cursor-not-allowed" : ""}`}>
                           {isSubmittingListing ? 'Ekleniyor...' : 'İlanı Yayınla'}
                        </button>
                     </div>
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
            className="fixed right-4 top-20 bottom-28 w-full max-w-sm sm:max-w-md bg-white/85 backdrop-blur-3xl border border-white/60 rounded-3xl shadow-2xl flex flex-col z-[1500] overflow-hidden"
            onTouchStart={e => e.stopPropagation()}
            onTouchMove={e => e.stopPropagation()}
            onWheel={e => e.stopPropagation()}
          >
            {/* ── DİNAMİK BAŞLIK VE KAPAT BUTONU ── */}
            <div className="flex justify-between items-start shrink-0 border-b border-slate-200/60 p-5 md:p-6">
              <div className="flex-1 pr-4">
                <h2 className="text-base sm:text-lg font-extrabold !text-slate-900 leading-snug tracking-tight" style={{ color: "#0f172a" }}>
                  {selectedSubCampus.name}
                </h2>
                {selectedSubCampus.parent_id && displayUniversity && (
                  <div className="text-sm text-slate-500 mb-2 flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    Bağlı olduğu kurum: <strong className="text-slate-700">{displayUniversity.name}</strong>
                  </div>
                )}
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <span className={`inline-block px-2.5 py-1 border rounded-full text-xs font-semibold mt-1 ${(selectedSubCampus.type === 'Ana Kampüs' || selectedSubCampus.type === 'Ana KampǬs' || selectedSubCampus.isMain) ? 'bg-amber-50 text-amber-700 border-amber-200/60' : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'}`}>
                      {(selectedSubCampus.type === 'Ana Kampüs' || selectedSubCampus.type === 'Ana KampǬs' || selectedSubCampus.isMain) ? 'Ana Kampüs' : 'Alt Yerleşke'}
                    </span>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedSubCampus(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors shrink-0"
              >
                ✕
              </button>
            </div>

            {/* ── TAB BAR ── */}
            <div className="flex items-center gap-1 p-2 bg-slate-100/70 rounded-2xl mx-4 my-2 overflow-x-auto hide-scrollbar shrink-0">
              {[
                { key: 'info',    label: 'Bilgi',            icon: 'ℹ️' },
                { key: 'units',   label: 'Bölümler',         icon: '📚' },
                { key: 'campuses',label: 'Yerleşkeler',      icon: '🏢' },
                { key: 'reviews', label: 'Değerlendirmeler', icon: '⭐' },
                { key: 'qa',      label: 'Soru & Cevap',     icon: '💬' },
              ].map(tab => (
                <button
                  key={tab.key}
                  className={`${campusDetailTab === tab.key ? 'bg-white text-indigo-600 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900 font-medium'} rounded-xl py-2 px-3 text-xs flex items-center gap-1.5 transition-all whitespace-nowrap min-w-max`}
                  onClick={() => setCampusDetailTab(tab.key)}
                >
                  <span>{tab.icon}</span> <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* ── TAB İÇERİKLERİ ── */}
            <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] flex flex-col gap-4">

              {/* ━━ BİLGİ ━━ */}
              {campusDetailTab === 'info' && (
                <div className="flex flex-col gap-4">
                  
                  {/* Açık Adres ve Koordinatlar Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/60 border border-white/80 rounded-2xl shadow-sm text-xs">
                      <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold border-b border-slate-100 pb-2"><span>🗺️</span><h4>Açık Adres</h4></div>
                      <p className="text-sm text-slate-600">
                        {selectedSubCampus.address ||
                          [selectedSubCampus.district, selectedSubCampus.city].filter(Boolean).join(', ') ||
                          'Adres bilgisi mevcut değil'}
                      </p>
                    </div>
                    {selectedSubCampus.latitude && (
                      <div className="p-4 bg-white/60 border border-white/80 rounded-2xl shadow-sm text-xs">
                        <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold border-b border-slate-100 pb-2"><span>📍</span><h4>Koordinatlar</h4></div>
                        <p className="text-sm text-slate-600 font-mono">
                          {Number(selectedSubCampus.latitude).toFixed(6)}, {Number(selectedSubCampus.longitude).toFixed(6)}
                        </p>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${selectedSubCampus.latitude},${selectedSubCampus.longitude}`}
                          target="_blank" rel="noreferrer"
                          className="mt-3 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                          Yol Tarifi Al
                        </a>
                      </div>
                    )}
                  </div>

                  {/* ── SOSYAL MEDYA ── */}
                  <div className="p-4 bg-white/60 border border-white/80 rounded-2xl shadow-sm text-xs">
                    <div className="flex items-center gap-2 mb-3 text-slate-800 font-bold border-b border-slate-100 pb-2"><span>🌐</span><h4>Sosyal Medya & Web</h4></div>
                    <div className="flex gap-2 flex-wrap">
                      <a
                        href={displayUniversity?.instagram_url || `https://www.instagram.com/${(displayUniversity?.universityName || displayUniversity?.name || '').replace(/\s+/g, '').toLowerCase()}`}
                        target="_blank" rel="noreferrer"
                        className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-medium hover:bg-slate-800 transition-all flex items-center gap-1.5"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                        Instagram
                      </a>
                      <a
                        href={displayUniversity?.x_url || `https://x.com/${(displayUniversity?.universityName || displayUniversity?.name || '').replace(/\s+/g, '').toLowerCase()}`}
                        target="_blank" rel="noreferrer"
                        className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-medium hover:bg-slate-800 transition-all flex items-center gap-1.5"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        X
                      </a>
                      <a
                        href={displayUniversity?.linkedin_url || `https://www.linkedin.com/school/${(displayUniversity?.universityName || displayUniversity?.name || '').replace(/\s+/g, '-').toLowerCase()}`}
                        target="_blank" rel="noreferrer"
                        className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-medium hover:bg-slate-800 transition-all flex items-center gap-1.5"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        LinkedIn
                      </a>
                      <a
                        href={displayUniversity?.website || `https://www.${(displayUniversity?.universityName || displayUniversity?.name || '').replace(/\s+/g, '').replace(/ü/g,'u').replace(/ö/g,'o').replace(/ş/g,'s').replace(/ç/g,'c').replace(/ğ/g,'g').replace(/ı/g,'i').replace(/İ/g,'i').replace(/Ü/g,'u').replace(/Ö/g,'o').replace(/Ş/g,'s').replace(/Ç/g,'c').replace(/Ğ/g,'g').toLowerCase()}.edu.tr`}
                        target="_blank" rel="noreferrer"
                        className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-medium hover:bg-slate-800 transition-all flex items-center gap-1.5"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                        Web Sitesi
                      </a>
                    </div>
                  </div>

                  {/* ── TARİHÇE / HAKKINDA ── */}
                  <div className="p-4 bg-white/60 border border-white/80 rounded-2xl shadow-sm text-xs">
                    <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold border-b border-slate-100 pb-2"><span>🏛️</span><h4>Tarihçe & Hakkında</h4></div>
                    <div>
                      <p className={`text-sm text-slate-600 leading-relaxed transition-all duration-300 ${expandedAbout ? '' : 'line-clamp-3'}`}>
                        {displayUniversity?.history ? (
                          displayUniversity.history
                        ) : (
                          `${displayUniversity?.universityName || displayUniversity?.name} Türkiye'nin önde gelen yükseköğretim kurumlarından biridir. Köklü akademik geçmişi ve modern eğitim anlayışıyla ulusal ve uluslararası alanda tanınan üniversite, geniş kampüs alanlarında binlerce öğrenciye eğitim vermektedir. Araştırma odaklı yapısı, güçlü akademik kadrosu ve sanayi iş birlikleri ile mezunlarına güçlü kariyer fırsatları sunmaktadır.`
                        )}
                      </p>
                      <button
                        onClick={() => setExpandedAbout(!expandedAbout)}
                        className="text-blue-600 text-sm font-semibold mt-2 flex items-center gap-1 hover:text-blue-700"
                      >
                        {expandedAbout ? '▲ Kısalt' : '▼ Devamını Oku'}
                      </button>
                    </div>
                  </div>

                  {/* ── SON HABERLER / DUYURULAR ── */}
                  <div className="p-4 bg-white/60 border border-white/80 rounded-2xl shadow-sm text-xs">
                    <div className="flex items-center gap-2 mb-3 text-slate-800 font-bold border-b border-slate-100 pb-2"><span>📰</span><h4>Üniversiteden Haberler</h4></div>
                    <div className="flex flex-col gap-3">
                      {isFetchingNews ? (
                         <div className="text-center text-slate-500 py-4">Haberler yükleniyor...</div>
                      ) : uniNews.length > 0 ? (
                        uniNews.map((news, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-lg hover:shadow-md hover:border-slate-200 transition-all">
                            <div className="flex-1 min-w-0">
                              <h5 className="text-sm font-semibold text-slate-800 leading-snug mb-1">{news.title}</h5>
                              <span className="text-xs text-slate-400">
                                {new Date(news.pubDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </span>
                            </div>
                            <a href={news.link} target="_blank" rel="noreferrer" className="shrink-0 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors">
                              Habere Git →
                            </a>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-slate-500 py-2">Haber bulunamadı.</div>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* ━━ BÖLÜMLER ━━ */}
              {campusDetailTab === 'units' && (
                <div className="flex flex-col flex-1 min-h-0 h-full mt-2">
                  
                  {/* Sticky Search Bar */}
                  <div className="shrink-0 sticky top-0 z-10">
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
                      className="w-full bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm placeholder:text-slate-400 mb-3 shrink-0"
                    />
                  </div>

                  {/* Scrollable List Area */}
                  <div className="flex-1 overflow-y-auto p-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] flex flex-col">
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
    // 1 & 2: Kampüs Tipi Ayrımı (MYO vs Ana Kampüs)
    if (activeCampusFilterId && String(activeCampusFilterId) !== String(selectedSubCampus?.id)) {
        // Durum 1: Bir MYO Seçilmiş
        const activeMyo = activeRelatedMyos.find(m => String(m.id) === String(activeCampusFilterId));
        if (activeMyo && p.fakulte !== activeMyo.isim) {
            return false;
        }
    } else {
        // Durum 2: Ana Kampüs Seçilmiş (veya filtre yok)
        // Fakülte isminde 'meslek' veya 'myo' geçenleri (yani MYO bölümlerini) gizle
        const fakulteIsmi = (p.fakulte || '').toLocaleLowerCase('tr-TR');
        if (fakulteIsmi.includes('meslek') || fakulteIsmi.includes('myo')) {
            return false;
        }
    }
    
    // 3. Sağ Panel İçi Arama
    return (p.isim || '').toLocaleLowerCase('tr-TR').includes(programSearchQuery.toLocaleLowerCase('tr-TR'));
});
                          if (filtered.length === 0) {
                          return <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', padding: '20px' }}>Aradığınız kriterlere uygun program bulunamadı.</p>;
                        }
                        return filtered.map((p, idx) => {
                            const sirala = p.siralama || p.sirala;
                            const puan = p.puan;
                            const kontenjan = p.kontenjan;

                            return (
                              <div 
                                key={idx} 
                                className="flex flex-col p-2.5 mb-2 bg-white/80 hover:bg-white border border-slate-200/60 rounded-xl shadow-sm transition-all cursor-pointer group"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  let target = null;
                                  if (p.campus_id) {
                                    target = universities.find(u => String(u.id) === String(p.campus_id));
                                  }
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
                                    if (target && target.id) {
                                      setTimeout(() => {
                                        const marker = markerRefs.current[target.id];
                                        if (marker) marker.openPopup();
                                      }, 400); 
                                    }
                                  }
                                }}
                              >
                                
                                {/* ÜST SATIR (Bölüm Adı ve Yıldız) */}
                                <div className="flex items-start justify-between">
                                  <span className="text-sm font-semibold text-slate-800 flex-1 pr-2 leading-tight">
                                    {p.isim}
                                  </span>
                                  <button 
                                    className="text-slate-300 hover:text-amber-400 cursor-pointer p-1 transition-colors group-hover:text-amber-200 active:scale-90" 
                                    onClick={(e) => { e.stopPropagation(); /* Favorite Logic */ }}
                                  >
                                    ⭐
                                  </button>
                                </div>

                                {/* ETİKETLER ALANI */}
                                <div className="flex flex-wrap gap-1 mt-1 mb-1.5">
                                  <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[9px] font-bold">
                                    {(p.isim || '').toLocaleLowerCase('tr-TR').includes('önlisans') || (p.fakulte || '').toLocaleLowerCase('tr-TR').includes('meslek') ? 'Önlisans • 2 Yıl' : 'Lisans • 4 Yıl'}
                                  </span>
                                  {false && (
                                    <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[9px] font-bold">
                                      
                                    </span>
                                  )}
                                  {p.fakulte && (
                                    <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[9px] font-bold truncate max-w-[140px]">
                                      {p.fakulte}
                                    </span>
                                  )}
                                </div>

                                {/* BİLGİ SATIRI (Kontenjan, Sıralama, Puan) */}
                                <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded-lg border border-slate-100/80 mt-0.5">
                                  
                                  {/* KONTENJAN */}
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-bold text-slate-400">KONT:</span>
                                    <span className="text-[10px] font-extrabold text-slate-800">{kontenjan || '-'}</span>
                                  </div>

                                  {/* SIRALAMA */}
                                  <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2">
                                    <span className="text-[9px] font-bold text-slate-400">SIRA:</span>
                                    <span className="text-[10px] font-extrabold text-slate-800">
                                      {sirala ? Number(sirala).toLocaleString('tr-TR') : '-'}
                                    </span>
                                  </div>

                                  {/* PUAN */}
                                  <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2">
                                    <span className="text-[9px] font-bold text-slate-400">PUAN:</span>
                                    <span className="text-[10px] font-extrabold text-slate-800">
                                      {puan ? Number(puan).toLocaleString('tr-TR') : '-'}
                                    </span>
                                  </div>
                                </div>
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
                            <span style={{ fontWeight: '500', color: '#1e293b', fontSize: '14px' }}>{myo.isim}</span>
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
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#64748b' }}>
                          <input type="checkbox" checked={isAnonymousReview} onChange={e => setIsAnonymousReview(e.target.checked)} />
                          👻 Anonim
                        </label>
                        <div style={{ display: 'flex', gap: '10px' }}>
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
                            {review.is_anonymous ? (
                              <span className="csd-review-avatar" style={{ background: '#64748b', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🎭</span>
                            ) : review.profiles?.avatar_url ? (
                              <img src={review.profiles.avatar_url} alt="Avatar" className="csd-review-avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                            ) : (
                              <span className="csd-review-avatar" style={{ background: '#3b82f6', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', flexShrink: 0 }}>
                                👤
                              </span>
                            )}
                            <div className="csd-review-meta" style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                <span className="csd-review-author" style={{ fontWeight: 'bold', color: '#0f172a' }}>{review.is_anonymous ? 'Anonim' : review.profiles?.full_name}</span>
                                <span className="csd-review-date" style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(review.created_at).toLocaleDateString('tr-TR')}</span>
                              </div>
                              {(!review.is_anonymous && (review.profiles?.university_name || review.profiles?.department_name)) && (
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
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '13px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Fotoğraf
                            <input id="question-image-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { if(e.target.files && e.target.files[0]) setQuestionImage(e.target.files[0]); }} />
                          </label>
                          {questionImage && (
                            <div style={{ fontSize: '11px', color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '4px', background: '#eef2ff', padding: '2px 6px', borderRadius: '4px' }}>
                              <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{questionImage.name}</span>
                              <button onClick={() => { setQuestionImage(null); const el = document.getElementById('question-image-input'); if(el) el.value=''; }} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: '#4f46e5' }}>×</button>
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          onClick={() => { setIsQuestionFormOpen(false); setQuestionImage(null); const el = document.getElementById('question-image-input'); if(el) el.value=''; }}
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
                            <p className="csd-qa-question-text" style={{ margin: '0 0 10px 0', whiteSpace: 'pre-wrap' }}>{qa.content}</p>
                              {qa.image_url && <img src={qa.image_url} alt="Soru" style={{ width: '100%', maxHeight: '250px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px', border: '1px solid #e2e8f0' }} />}
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
          <>
            <div className="fixed bottom-28 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl bg-white/85 backdrop-blur-3xl border border-white/60 rounded-3xl shadow-2xl flex flex-col max-h-[70vh] z-[2000] overflow-hidden pointer-events-auto">
              
              <div className="flex justify-between items-center p-6 border-b border-slate-200/60">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  🔔 Bildirimler
                </h2>
                <button onClick={() => setNotificationsOpen(false)} className="bg-slate-100/50 hover:bg-slate-200/80 rounded-full p-2 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>

              <div className="overflow-y-auto p-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] flex-1">
                {!user ? (
                  <div className="text-center p-10 text-slate-500 font-medium">Bildirimleri görmek için giriş yapmalısınız.</div>
                ) : notifications.length === 0 ? (
                  <div className="text-center p-10 text-slate-500 font-medium">Henüz hiçbir bildiriminiz yok.</div>
                ) : (
                  <div className="flex flex-col">
                    {notifications.map((notif, idx) => (
                      <div key={idx} onClick={() => handleNotificationClick(notif)} className={`flex items-start gap-4 p-4 mx-2 my-1 rounded-2xl hover:bg-slate-100/50 cursor-pointer active:scale-[0.98] transition-all ${!notif.is_read ? 'bg-indigo-50/50' : ''}`}>
                        {notif.actorProfile?.avatar_url ? (
                          <img src={notif.actorProfile.avatar_url} className="w-10 h-10 rounded-full object-cover shadow-sm shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center text-lg font-bold shadow-sm shrink-0">👤</div>
                        )}
                        <div className="flex flex-col flex-1">
                          <p className="text-sm text-slate-800 text-left">
                            <span className="font-bold text-slate-900">{notif.actorProfile?.full_name || 'Bir kullanıcı'}</span> {notif.content}
                          </p>
                          <div className="text-xs text-slate-500 mt-1.5 text-left font-medium">
                            {new Date(notif.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
            </div>
          </>
        )}

      {messagesOpen && !activeChatUser && (
          <>
            <div className="fixed bottom-28 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl bg-white/85 backdrop-blur-3xl border border-white/60 rounded-3xl shadow-2xl flex flex-col max-h-[70vh] z-[2000] overflow-hidden pointer-events-auto">
              
              <div className="flex justify-between items-center p-6 border-b border-slate-200/60">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  💬 Mesajlar
                </h2>
                <button onClick={() => setMessagesOpen(false)} className="bg-slate-100/50 hover:bg-slate-200/80 rounded-full p-2 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>

              <div className="overflow-y-auto p-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] flex-1">
                {!user ? (
                  <div className="text-center p-10 text-slate-500 font-medium">Mesajları görmek için giriş yapmalısınız.</div>
                ) : inbox.length === 0 ? (
                  <div className="text-center p-10 text-slate-500 font-medium">Henüz hiçbir mesajınız yok.</div>
                ) : (
                  <div className="flex flex-col">
                    {inbox.map((conv, idx) => (
                      <div key={idx} onClick={() => setActiveChatUser(conv.otherUser)} className="flex items-center gap-4 p-4 mx-2 my-1 rounded-2xl hover:bg-slate-100/50 transition-colors cursor-pointer active:scale-[0.98]">
                        {conv.otherUser.avatar_url ? (
                          <img src={conv.otherUser.avatar_url} className="w-12 h-12 rounded-full object-cover shadow-sm shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xl font-bold shadow-sm shrink-0">👤</div>
                        )}
                        <div className="flex flex-col flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 text-left truncate">{conv.otherUser.full_name || 'İsimsiz'}</h4>
                          <p className="text-xs text-slate-600 text-left truncate mt-0.5">
                            {conv.latestMessage.sender_id === user?.id ? 'Siz: ' : ''}{conv.latestMessage.content}
                          </p>
                        </div>
                        <div className="text-xs text-slate-400 whitespace-nowrap ml-2 font-medium">
                          {new Date(conv.latestMessage.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
            </div>
          </>
        )}

      {preferenceOpen && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl bg-white/85 backdrop-blur-3xl border border-white/60 rounded-3xl shadow-2xl flex flex-col max-h-[80vh] z-[2000] overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-slate-200/60">
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                👤 Profilim
              </h2>
              <button onClick={() => setPreferenceOpen(false)} className="bg-slate-100/50 hover:bg-slate-200/80 rounded-full p-2 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          
          <div className="overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] flex-1 flex flex-col gap-6">
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
              <div className="flex flex-col gap-6 w-full">
                {!isEditingProfile ? (
                  // DISPLAY MODE
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <img src={userProfileData.avatar_url || user.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} alt="Avatar" className="w-16 h-16 rounded-full border-2 border-white/50 object-cover shadow-sm shrink-0" />
                          <div className="flex flex-col">
                            <h3 className="text-lg font-bold text-slate-900 m-0">{userProfileData.full_name || user.user_metadata?.full_name || user.email?.split('@')[0]}</h3>
                            <p className="text-sm text-slate-600 m-0">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setIsEditingProfile(true)} className="bg-slate-100/50 hover:bg-slate-200/80 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95">Düzenle</button>
                          <button onClick={() => window.confirm('Çıkış yapmak istiyor musunuz?') && signOut()} className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95">Çıkış</button>
                        </div>
                      </div>

                    {userProfileData.bio || userProfileData.education_status ? (
                        <div className="p-5 bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl shadow-sm flex flex-col gap-3 mt-4">
                          {userProfileData.bio && (
                            <div className="text-sm text-slate-700 italic border-l-4 border-indigo-400 pl-3">
                              {userProfileData.bio}
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="px-3 py-1.5 bg-white/60 text-indigo-800 text-xs font-bold rounded-lg border border-indigo-100 shadow-sm">🎓 {userProfileData.education_status || 'Belirtilmedi'}</span>
                            {(userProfileData.education_status === 'Okuyor' || userProfileData.education_status === 'Mezun') && userProfileData.university_name && (
                              <span className="px-3 py-1.5 bg-white/60 text-indigo-800 text-xs font-bold rounded-lg border border-indigo-100 shadow-sm">🏫 {userProfileData.university_name}</span>
                            )}
                            {(userProfileData.education_status === 'Okuyor' || userProfileData.education_status === 'Mezun') && userProfileData.department_name && (
                              <span className="px-3 py-1.5 bg-white/60 text-indigo-800 text-xs font-bold rounded-lg border border-indigo-100 shadow-sm">🔬 {userProfileData.department_name}</span>
                            )}
                            {userProfileData.education_status === 'Lise' && userProfileData.targetRank && (
                              <span className="px-3 py-1.5 bg-white/60 text-indigo-800 text-xs font-bold rounded-lg border border-indigo-100 shadow-sm">🎯 Hedef Sıra: {userProfileData.targetRank}</span>
                            )}
                            {userProfileData.education_status === 'Lise' && userProfileData.targetScore && (
                              <span className="px-3 py-1.5 bg-white/60 text-indigo-800 text-xs font-bold rounded-lg border border-indigo-100 shadow-sm">💯 Puan: {userProfileData.targetScore}</span>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    // EDIT MODE
                  <div className="flex flex-col gap-4">
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

            {/* --- ACTIVE LISTINGS --- */}
              <div className="mt-2">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Aktif İlanlarım</h3>
                {campusListings.filter(l => l.user_id === user?.id).length === 0 ? (
                  <div className="bg-white/40 border border-white/50 rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="text-4xl mb-3">🪧</span>
                    <h4 className="text-sm font-bold text-slate-800 mb-1">Henüz ilanınız yok</h4>
                    <p className="text-xs text-slate-500">Panoda yayınladığınız ilanlar burada görünür.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {campusListings.filter(l => l.user_id === user?.id).map((listing, idx) => (
                      <div key={idx} className="bg-white/60 border border-white/50 backdrop-blur-md shadow-sm rounded-2xl p-4 flex flex-col gap-2 relative">
                         <div className="flex justify-between items-start">
                           <h4 className="font-bold text-sm text-slate-900 break-words pr-2">{listing.title}</h4>
                           <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md shrink-0">{listing.category}</span>
                         </div>
                         <p className="text-xs text-slate-600 line-clamp-2 break-words">{listing.description}</p>
                           {listing.image_url && <div className="mt-2 mb-2"><img src={listing.image_url} alt="İlan" className="w-full max-h-32 object-cover rounded-lg border border-slate-200" /></div>}
                           <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200/50">
                           <span className="text-[10px] text-slate-400 font-medium">{new Date(listing.created_at).toLocaleDateString('tr-TR')}</span>
                           <div className="text-emerald-600 font-extrabold text-xs">
                             {(listing.price !== null && listing.price !== undefined && Number(listing.price) > 0) ? `${Number(listing.price).toLocaleString('tr-TR')} ₺` : 'Ücretsiz'}
                           </div>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
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

      {/* FLOATING GLASS DOCK */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex items-center justify-around w-[90%] max-w-[400px] bg-white/70 backdrop-blur-xl shadow-2xl border border-white/50 rounded-full px-6 py-3 pointer-events-auto transition-all">
        <button type="button" onClick={openBrowse} className={`flex flex-col items-center p-1 transition-all hover:scale-110 ${browseOpen ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-500'}`}>
          <span className="text-xl mb-0.5">🌍</span>
          <span className="text-[10px] font-bold">Kampüs</span>
        </button>
        <button type="button" onClick={openNotifications} className={`relative flex flex-col items-center p-1 transition-all hover:scale-110 ${notificationsOpen ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-500'}`}>
          <span className="text-xl mb-0.5">🔔</span>
          <span className="text-[10px] font-bold">Bildirimler</span>
          {notifications.filter(n => !n.is_read).length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm border border-white">
              {notifications.filter(n => !n.is_read).length}
            </span>
          )}
        </button>
        <button type="button" onClick={openMessages} className={`relative flex flex-col items-center p-1 transition-all hover:scale-110 ${messagesOpen ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-500'}`}>
            {unreadMessageCount > 0 && (
              <span className="absolute -top-1 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10 animate-bounce">
                {unreadMessageCount}
              </span>
            )}
            <span className="text-xl mb-0.5">💬</span>
            <span className="text-[10px] font-bold">Mesajlar</span>
          </button>
        <button type="button" onClick={() => toggleFloatingPanel("favorites")} className={`flex flex-col items-center p-1 transition-all hover:scale-110 ${preferenceOpen ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-500'}`}>
          <span className="text-xl mb-0.5">👤</span>
          <span className="text-[10px] font-bold">Profilim</span>
        </button>
      </nav>
    </div>

      {/* ========================================
          ROOT-LEVEL INDEPENDENT CHAT MODAL
      ======================================== */}
      {activeChatUser && (
          <div className="fixed bottom-28 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl bg-white/85 backdrop-blur-3xl border border-white/60 rounded-3xl shadow-2xl flex flex-col h-[70vh] z-[2000] overflow-hidden">
            
            <div className="flex items-center gap-3 p-4 border-b border-slate-200/60 bg-white/40">
              <button onClick={() => setActiveChatUser(null)} className="text-slate-500 hover:text-slate-700 transition-colors p-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <div className="flex items-center gap-3">
                {activeChatUser.avatar_url ? (
                  <img src={activeChatUser.avatar_url} className="w-10 h-10 rounded-full object-cover shadow-sm shrink-0" />
                ) : (
                  <span className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-bold shadow-sm shrink-0">👤</span>
                )}
                <div className="flex flex-col">
                  <h2 className="text-base font-bold text-slate-900">{activeChatUser.full_name || 'İsimsiz'}</h2>
                  <div className="text-xs text-slate-500 font-medium">Sohbet</div>
                </div>
              </div>
            </div>
  
            <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] flex flex-col gap-3">
              {chatMessages.length === 0 ? (
                <div className="text-center mt-10 text-slate-500 font-medium text-sm">Sohbeti başlatın...</div>
              ) : (
                chatMessages.map(msg => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                      <div style={{ background: isMe ? '#4f46e5' : '#f1f5f9', color: isMe ? '#fff' : '#0f172a', padding: '10px 14px', borderRadius: '16px', borderBottomRightRadius: isMe ? '4px' : '16px', borderBottomLeftRadius: !isMe ? '4px' : '16px', fontSize: '14px', lineHeight: '1.4' }} className="shadow-sm">
                        {msg.content}
                      </div>
                      <div style={{ fontSize: '10px', marginTop: '4px', textAlign: isMe ? 'right' : 'left' }} className="text-slate-400 font-medium">
                        {new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={chatEndRef} />
            </div>
  
            <div className="p-3 border-t border-slate-200/60 bg-white/50 backdrop-blur-md flex items-center gap-2">
              <input
                value={newMessageContent}
                onChange={e => setNewMessageContent(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                placeholder="Mesaj yaz..."
                className="flex-1 bg-white/70 border border-white/60 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
              />
              <button onClick={sendMessage} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-5 py-2.5 rounded-full shadow-md transition-colors">Gönder</button>
            </div>
          </div>
        )}

    </>
  );
}

export default App;


