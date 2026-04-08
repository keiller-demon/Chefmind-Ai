import React, { useState, useEffect } from 'react';
import { UserProfile, Challenge } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Zap, 
  Award, 
  ArrowRight, 
  Play, 
  Search,
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  X
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment, arrayUnion } from 'firebase/firestore';

export default function HomeView({ user, onNavigate }: { user: UserProfile, onNavigate: (tab: string) => void }) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [showChallengeDetail, setShowChallengeDetail] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    const fetchDailyChallenge = async () => {
      const today = new Date().toISOString().split('T')[0];
      const q = query(collection(db, 'challenges'), where('date', '==', today));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setChallenge({ id: snap.docs[0].id, ...snap.docs[0].data() } as Challenge);
      } else {
        // Fallback challenge if none in DB
        setChallenge({
          id: 'default-omelette',
          title: 'Perfect Omelette',
          description: 'Master the French technique for a silky, smooth omelette.',
          xpBonus: 50,
          date: today,
          difficulty: 'Medium'
        });
      }
    };
    fetchDailyChallenge();
  }, []);

  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCompleteChallenge = async () => {
    if (!challenge) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        xp: increment(challenge.xpBonus),
        dailyChallengeCompleted: true,
        completedChallenges: arrayUnion(challenge.id)
      });
      setShowChallengeDetail(false);
      setIsTimerRunning(false);
    } catch (error) {
      console.error("Failed to complete challenge", error);
    }
  };

  const nextLevelXP = 1000;
  const progress = (user.xp / nextLevelXP) * 100;

  return (
    <div className="space-y-8">
      {/* ... header ... */}
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Welcome, {user.displayName?.split(' ')[0]}!</h2>
          <p className="text-muted-foreground text-sm">Ready to level up your skills?</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-bold">{user.streak}</span>
          </div>
          <div className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-bold">{user.xp}</span>
          </div>
        </div>
      </header>

      {/* Level Progress */}
      <section className="chef-card">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            <span className="font-bold">{user.level}</span>
          </div>
          <span className="text-xs text-muted-foreground uppercase tracking-widest">Level 1</span>
        </div>
        <Progress value={progress} className="h-2 mb-2" />
        <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
          <span>{user.xp} XP</span>
          <span>{nextLevelXP} XP to Home Cook</span>
        </div>
      </section>

      {/* Daily Challenge */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Daily Challenge</h3>
          {user.dailyChallengeCompleted ? (
            <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10">
              Completed
            </Badge>
          ) : (
            <Badge variant="outline" className="text-orange-500 border-orange-500/30 bg-orange-500/10">
              +{challenge?.xpBonus || 50} XP
            </Badge>
          )}
        </div>
        <Card className={`bg-gradient-to-br from-orange-500/20 to-transparent border-white/10 overflow-hidden ${user.dailyChallengeCompleted ? 'opacity-50' : ''}`}>
          <CardContent className="p-0">
            <div className="p-6 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-lg mb-1">{challenge?.title || 'Loading...'}</h4>
                <p className="text-sm text-muted-foreground">{challenge?.description || 'Fetching today\'s task'}</p>
              </div>
              <button 
                onClick={() => !user.dailyChallengeCompleted && setShowChallengeDetail(true)}
                disabled={user.dailyChallengeCompleted}
                className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
              >
                {user.dailyChallengeCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
              </button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Challenge Detail Modal */}
      <AnimatePresence>
        {showChallengeDetail && challenge && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="chef-card w-full max-w-sm space-y-6 relative"
            >
              <button 
                onClick={() => setShowChallengeDetail(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center space-y-2">
                <Badge variant="outline" className="text-orange-500 border-orange-500/30">Daily Challenge</Badge>
                <h3 className="text-2xl font-bold">{challenge.title}</h3>
                <p className="text-muted-foreground text-sm">{challenge.description}</p>
              </div>

              <div className="flex justify-center py-4">
                <div className="text-4xl font-mono font-bold tracking-tighter flex items-center gap-3">
                  <Clock className="w-8 h-8 text-primary" />
                  {formatTime(timer)}
                </div>
              </div>

              <div className="space-y-3">
                {!isTimerRunning ? (
                  <Button className="w-full h-14 rounded-2xl text-lg font-bold" onClick={() => setIsTimerRunning(true)}>
                    Start Challenge
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 h-14 rounded-2xl" onClick={() => setIsTimerRunning(false)}>
                      Pause
                    </Button>
                    <Button className="flex-1 h-14 rounded-2xl bg-green-600 hover:bg-green-700 font-bold" onClick={handleCompleteChallenge}>
                      Complete
                    </Button>
                  </div>
                )}
                <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest">
                  Take a photo of your dish after completion to earn extra XP!
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      <section className="grid grid-cols-2 gap-4">
        <QuickActionCard 
          icon={<Search className="w-6 h-6" />} 
          title="Recipe Generator" 
          desc="AI-powered ideas"
          color="bg-blue-500/10 text-blue-400"
          onClick={() => onNavigate('cook')}
        />
        <QuickActionCard 
          icon={<UtensilsCrossed className="w-6 h-6" />} 
          title="Skill Lessons" 
          desc="Knife skills & more"
          color="bg-purple-500/10 text-purple-400"
          onClick={() => onNavigate('cook')}
        />
      </section>
    </div>
  );
}

function QuickActionCard({ icon, title, desc, color, onClick }: { icon: React.ReactNode, title: string, desc: string, color: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="chef-card text-left flex flex-col gap-4 p-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-sm">{title}</h4>
        <p className="text-[10px] text-muted-foreground leading-tight">{desc}</p>
      </div>
    </button>
  );
}

