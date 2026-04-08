import React from 'react';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { motion } from 'motion/react';
import { ChefHat, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LoginView() {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-4 mx-auto glass">
          <ChefHat className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight gradient-text mb-2">ChefMind AI</h1>
        <p className="text-muted-foreground max-w-xs mx-auto">
          Your personal AI cooking coach. Master the art of cooking with gamified lessons and real-time feedback.
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-sm"
      >
        <Button 
          onClick={handleLogin}
          className="w-full h-14 text-lg font-semibold rounded-2xl flex items-center justify-center gap-3"
        >
          <LogIn className="w-5 h-5" />
          Continue with Google
        </Button>
      </motion.div>
    </div>
  );
}
