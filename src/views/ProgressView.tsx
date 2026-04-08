import React, { useState, useEffect } from 'react';
import { UserProfile, CookingSession } from '../types';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Award, 
  Zap, 
  Calendar,
  ChevronRight,
  Trophy,
  Target
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProgressView({ user }: { user: UserProfile }) {
  const [sessions, setSessions] = useState<CookingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const q = query(
          collection(db, 'sessions'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CookingSession));
        setSessions(data);
      } catch (error) {
        console.error("Failed to fetch sessions", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [user.uid]);

  const levels = [
    { name: 'Beginner', xp: 0 },
    { name: 'Home Cook', xp: 1000 },
    { name: 'Pro', xp: 5000 },
    { name: 'Master Chef', xp: 20000 }
  ];

  const currentLevelIndex = levels.findIndex(l => l.name === user.level);
  const nextLevel = levels[currentLevelIndex + 1];
  const progress = nextLevel ? ((user.xp - levels[currentLevelIndex].xp) / (nextLevel.xp - levels[currentLevelIndex].xp)) * 100 : 100;

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold gradient-text">Your Progress</h2>
        <p className="text-muted-foreground">Track your journey to culinary mastery.</p>
      </header>

      {/* Level Summary */}
      <section className="chef-card bg-gradient-to-br from-primary/10 to-transparent">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Trophy className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">{user.level}</h3>
            <p className="text-sm text-muted-foreground">{user.xp} Total XP</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-3" />
          {nextLevel && (
            <p className="text-[10px] text-muted-foreground text-right uppercase tracking-wider">
              {nextLevel.xp - user.xp} XP until {nextLevel.name}
            </p>
          )}
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={<Zap className="w-5 h-5 text-yellow-400" />} label="Total Sessions" value={sessions.length.toString()} />
        <StatCard icon={<Target className="w-5 h-5 text-blue-400" />} label="Daily Streak" value={user.streak.toString()} />
      </div>

      {/* Recent Activity */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          Recent Activity
        </h3>
        
        <div className="space-y-3">
          {loading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
          ) : sessions.length > 0 ? (
            sessions.map((session) => (
              <div key={session.id} className="chef-card p-4 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm">Cooking Session</h4>
                  <p className="text-xs text-muted-foreground">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-primary font-bold">+{session.xpGained} XP</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 chef-card border-dashed">
              <p className="text-muted-foreground text-sm">No activity yet. Start cooking!</p>
            </div>
          )}
        </div>
      </section>

      {/* Achievements (Placeholders) */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold">Achievements</h3>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          <AchievementBadge icon="🔥" label="3 Day Streak" locked={user.streak < 3} />
          <AchievementBadge icon="🍳" label="First Dish" locked={sessions.length === 0} />
          <AchievementBadge icon="⭐" label="5 Star Review" locked={true} />
          <AchievementBadge icon="🔪" label="Knife Master" locked={true} />
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="chef-card p-4 flex flex-col gap-2">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function AchievementBadge({ icon, label, locked }: { icon: string, label: string, locked: boolean }) {
  return (
    <div className={`flex-shrink-0 w-24 flex flex-col items-center gap-2 ${locked ? 'opacity-30 grayscale' : ''}`}>
      <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-3xl">
        {icon}
      </div>
      <span className="text-[10px] font-bold text-center leading-tight uppercase tracking-wider">{label}</span>
    </div>
  );
}
