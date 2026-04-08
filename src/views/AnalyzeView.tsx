import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { motion } from 'motion/react';
import { 
  Camera, 
  Upload, 
  Star, 
  Sparkles, 
  Layout, 
  Droplets,
  Loader2,
  CheckCircle2,
  X,
  Zap,
  Bookmark,
  Plus,
  ChefHat,
  Utensils
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { analyzeDish } from '../lib/gemini';
import { db } from '../lib/firebase';
import { doc, updateDoc, increment, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { Collection } from '../types';

export default function AnalyzeView({ user }: { user: UserProfile }) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Collections state for saving
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      const q = query(collection(db, 'collections'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      setCollections(snap.docs.map(d => ({ id: d.id, ...d.data() } as Collection)));
    };
    fetchCollections();
  }, [user.uid]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    try {
      // Remove data:image/jpeg;base64, prefix
      const base64 = image.split(',')[1];
      const analysis = await analyzeDish(base64);
      setResult(analysis);

      // Award XP
      const xpGained = 20;
      await updateDoc(doc(db, 'users', user.uid), {
        xp: increment(xpGained)
      });

      // Save analysis
      await addDoc(collection(db, 'analyses'), {
        userId: user.uid,
        imageUrl: image,
        ...analysis,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
  };

  const handleSaveRecipe = async () => {
    if (!result) return;
    try {
      await addDoc(collection(db, 'recipes'), {
        name: result.dishName,
        ingredients: result.ingredients,
        steps: result.perfectSteps,
        authorId: user.uid,
        collectionId: selectedCollectionId,
        createdAt: new Date().toISOString(),
        difficulty: 'Medium',
        time: '30 mins'
      });
      setShowSaveDialog(false);
    } catch (error) {
      console.error("Failed to save recipe", error);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    try {
      const docRef = await addDoc(collection(db, 'collections'), {
        userId: user.uid,
        name: newCollectionName,
        createdAt: new Date().toISOString()
      });
      const newCol = { id: docRef.id, userId: user.uid, name: newCollectionName, createdAt: new Date().toISOString() };
      setCollections([...collections, newCol]);
      setSelectedCollectionId(docRef.id);
      setNewCollectionName('');
    } catch (error) {
      console.error("Failed to create collection", error);
    }
  };

  if (result) {
    return (
      <div className="space-y-6">
        <header className="flex justify-between items-center">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold">{result.dishName}</h2>
            <p className="text-xs text-muted-foreground">Chef's Review</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => setShowSaveDialog(true)} className="text-primary">
              <Bookmark className="w-6 h-6" />
            </Button>
            <button onClick={reset} className="p-2 rounded-full hover:bg-white/10">
              <X className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Save Recipe Dialog */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent className="bg-background border-white/10">
            <DialogHeader>
              <DialogTitle>Save as Recipe</DialogTitle>
              <DialogDescription>Save the identified recipe to your collections.</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Select Collection</label>
                <div className="grid gap-2 max-h-[200px] overflow-y-auto pr-2">
                  {collections.map(col => (
                    <button
                      key={col.id}
                      onClick={() => setSelectedCollectionId(col.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${selectedCollectionId === col.id ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'}`}
                    >
                      <span className="font-medium">{col.name}</span>
                      {selectedCollectionId === col.id && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Or Create New</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Collection name" 
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    className="bg-white/5 border-white/10"
                  />
                  <Button variant="outline" size="icon" onClick={handleCreateCollection}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveRecipe} disabled={!selectedCollectionId}>Save Recipe</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="relative rounded-3xl overflow-hidden aspect-square glass">
          <img src={image!} alt="Your dish" className="w-full h-full object-cover" />
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 border border-white/10">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span className="text-xl font-bold">{result.rating}/10</span>
          </div>
        </div>

        <section className="chef-card space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-bold">Presentation Feedback</h3>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            {result.feedback}
          </p>
        </section>

        <div className="grid grid-cols-2 gap-4">
          <div className="chef-card p-4 space-y-2">
            <div className="flex items-center gap-2 text-blue-400">
              <Layout className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Plating</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-tight">{result.platingSuggestions}</p>
          </div>
          <div className="chef-card p-4 space-y-2">
            <div className="flex items-center gap-2 text-orange-400">
              <Droplets className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Texture</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-tight">{result.textureAdvice}</p>
          </div>
        </div>

        <section className="chef-card space-y-4">
          <div className="flex items-center gap-2 text-yellow-500">
            <Utensils className="w-5 h-5" />
            <h3 className="font-bold">Detected Ingredients</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.ingredients.map((ing: string, i: number) => (
              <Badge key={i} variant="secondary" className="bg-white/5 border-white/10">{ing}</Badge>
            ))}
          </div>
        </section>

        <section className="chef-card space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <ChefHat className="w-5 h-5" />
            <h3 className="font-bold">How to Cook Perfectly</h3>
          </div>
          <div className="space-y-4">
            {result.perfectSteps.map((step: string, i: number) => (
              <div key={i} className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="chef-card space-y-4 bg-green-500/5 border-green-500/10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-green-400">
              <Zap className="w-5 h-5" />
              <h3 className="font-bold">Nutritional Estimate</h3>
            </div>
            <Badge variant="outline" className="text-green-400 border-green-400/30 bg-green-400/10">
              ~{result.calories} kcal
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-xl bg-white/5 border border-white/10">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Protein</p>
              <p className="text-sm font-bold">{result.nutrients.protein}</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-white/5 border border-white/10">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Carbs</p>
              <p className="text-sm font-bold">{result.nutrients.carbs}</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-white/5 border border-white/10">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Fats</p>
              <p className="text-sm font-bold">{result.nutrients.fats}</p>
            </div>
          </div>
        </section>

        <Button onClick={reset} className="w-full h-14 rounded-2xl">
          Analyze Another Dish
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold gradient-text">Dish Analyzer</h2>
        <p className="text-muted-foreground">Upload a photo of your creation for a professional critique.</p>
      </header>

      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`relative aspect-square rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/5 transition-all overflow-hidden ${image ? 'border-none' : ''}`}
      >
        {image ? (
          <img src={image} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <>
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
              <Camera className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-bold">Tap to upload</p>
              <p className="text-xs text-muted-foreground">JPEG, PNG up to 5MB</p>
            </div>
          </>
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          accept="image/*" 
          className="hidden" 
        />
      </div>

      <div className="space-y-4">
        <Button 
          onClick={handleAnalyze} 
          disabled={!image || loading}
          className="w-full h-16 rounded-2xl text-lg font-bold flex gap-2"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
          Analyze My Dish (+20 XP)
        </Button>
        
        {image && !loading && (
          <Button variant="ghost" onClick={() => setImage(null)} className="w-full text-muted-foreground">
            Remove Photo
          </Button>
        )}
      </div>

      <section className="chef-card bg-primary/5 border-primary/10">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-bold text-sm">How it works</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Our AI analyzes color balance, plating structure, and visual texture to give you pro-level feedback.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
