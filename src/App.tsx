import React, { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { UserProfile } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home as HomeIcon, 
  ChefHat, 
  Camera, 
  TrendingUp, 
  User as UserIcon,
  LogOut,
  Utensils,
  Zap,
  Award,
  Flame
} from 'lucide-react';

// Views
import HomeView from './views/HomeView';
import CookView from './views/CookView';
import AnalyzeView from './views/AnalyzeView';
import ProgressView from './views/ProgressView';
import ProfileView from './views/ProfileView';
import LoginView from './views/LoginView';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        // Listen for real-time updates
        const unsubDoc = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser(docSnap.data() as UserProfile);
          } else {
            // Initialize new user
            const newUser: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Chef',
              photoURL: firebaseUser.photoURL || '',
              xp: 0,
              level: 'Beginner',
              streak: 0,
              lastLogin: new Date().toISOString(),
              dailyChallengeCompleted: false,
            };
            setDoc(userRef, newUser);
            setUser(newUser);
          }
          setLoading(false);
        });

        return () => unsubDoc();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <ChefHat className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const renderView = () => {
    switch (activeTab) {
      case 'home': return <HomeView user={user} onNavigate={setActiveTab} />;
      case 'cook': return <CookView user={user} />;
      case 'analyze': return <AnalyzeView user={user} />;
      case 'progress': return <ProgressView user={user} />;
      case 'profile': return <ProfileView user={user} />;
      default: return <HomeView user={user} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="container max-w-md mx-auto px-4 pt-8"
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-white/10 px-6 py-4 z-50">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <NavButton 
            active={activeTab === 'home'} 
            onClick={() => setActiveTab('home')} 
            icon={<HomeIcon className="w-6 h-6" />} 
            label="Home" 
          />
          <NavButton 
            active={activeTab === 'cook'} 
            onClick={() => setActiveTab('cook')} 
            icon={<ChefHat className="w-6 h-6" />} 
            label="Cook" 
          />
          <NavButton 
            active={activeTab === 'analyze'} 
            onClick={() => setActiveTab('analyze')} 
            icon={<Camera className="w-6 h-6" />} 
            label="Analyze" 
          />
          <NavButton 
            active={activeTab === 'progress'} 
            onClick={() => setActiveTab('progress')} 
            icon={<TrendingUp className="w-6 h-6" />} 
            label="Progress" 
          />
          <NavButton 
            active={activeTab === 'profile'} 
            onClick={() => setActiveTab('profile')} 
            icon={<UserIcon className="w-6 h-6" />} 
            label="Profile" 
          />
        </div>
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all duration-200 ${active ? 'nav-item-active' : 'nav-item-inactive'}`}
    >
      {icon}
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
    </button>
  );
}
