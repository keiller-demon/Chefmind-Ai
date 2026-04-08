import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ChefHat, 
  Clock, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  Loader2,
  Utensils,
  Plus,
  Sparkles,
  DollarSign,
  TrendingUp as TrendingUpIcon,
  X,
  Layout,
  Bookmark,
  FolderPlus
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { getCookingAdvice, generateRecipeFromIngredients, generateHotelMenu } from '../lib/gemini';
import { db } from '../lib/firebase';
import { doc, updateDoc, increment, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { Collection } from '../types';

export default function CookView({ user }: { user: UserProfile }) {
  const [queryStr, setQueryStr] = useState('');
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [mode, setMode] = useState<'coach' | 'generator' | 'hotel'>('coach');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [hotelTheme, setHotelTheme] = useState('');
  const [hotelResult, setHotelResult] = useState<any>(null);

  // Collections state
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

  const handleSearch = async () => {
    if (!queryStr.trim()) return;
    setLoading(true);
    try {
      const result = await getCookingAdvice(queryStr);
      setAdvice(result);
      setCurrentStep(0);
    } catch (error) {
      console.error("Failed to get advice", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecipe = async () => {
    if (!advice) return;
    try {
      await addDoc(collection(db, 'recipes'), {
        name: advice.recipeName,
        ingredients: advice.ingredients || [], // Generator has ingredients, coach might not in same format
        steps: advice.steps,
        authorId: user.uid,
        collectionId: selectedCollectionId,
        createdAt: new Date().toISOString(),
        difficulty: advice.difficulty || 'Medium',
        time: advice.time || '30 mins'
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

  const handleGenerateRecipe = async () => {
    if (ingredients.length === 0) return;
    setLoading(true);
    try {
      const result = await generateRecipeFromIngredients(ingredients);
      setAdvice(result);
      setCurrentStep(0);
    } catch (error) {
      console.error("Failed to generate recipe", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateHotel = async () => {
    if (!hotelTheme.trim()) return;
    setLoading(true);
    try {
      const result = await generateHotelMenu(hotelTheme);
      setHotelResult(result);
    } catch (error) {
      console.error("Failed to generate hotel menu", error);
    } finally {
      setLoading(false);
    }
  };

  const completeCooking = async () => {
    const xpGained = 10;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        xp: increment(xpGained)
      });
      await addDoc(collection(db, 'sessions'), {
        userId: user.uid,
        recipeName: advice.recipeName,
        xpGained,
        createdAt: new Date().toISOString()
      });
      setAdvice(null);
      setQueryStr('');
      setIngredients([]);
    } catch (error) {
      console.error("Failed to complete session", error);
    }
  };

  if (advice) {
    return (
      <div className="space-y-6">
        <button onClick={() => setAdvice(null)} className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <header>
          <div className="flex justify-between items-start">
            <h2 className="text-3xl font-bold gradient-text">{advice.recipeName}</h2>
            <Button variant="ghost" size="icon" onClick={() => setShowSaveDialog(true)} className="text-primary">
              <Bookmark className="w-6 h-6" />
            </Button>
          </div>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Step {currentStep + 1} of {advice.steps.length}</span>
            </div>
          </div>
        </header>

        {/* Save Recipe Dialog */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent className="bg-background border-white/10">
            <DialogHeader>
              <DialogTitle>Save Recipe</DialogTitle>
              <DialogDescription>Add this recipe to one of your collections.</DialogDescription>
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

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="chef-card min-h-[200px] flex flex-col justify-center"
            >
              <p className="text-xl font-medium leading-relaxed">
                {advice.steps[currentStep]}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1" 
            disabled={currentStep === 0}
            onClick={() => setCurrentStep(prev => prev - 1)}
          >
            Previous
          </Button>
          {currentStep < advice.steps.length - 1 ? (
            <Button className="flex-1" onClick={() => setCurrentStep(prev => prev + 1)}>
              Next Step
            </Button>
          ) : (
            <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={completeCooking}>
              Finish & Earn XP
            </Button>
          )}
        </div>

        {advice.proTips && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Zap className="w-5 h-5" />
              <h3 className="font-bold">Pro Tips</h3>
            </div>
            <div className="grid gap-2">
              {advice.proTips.map((tip: string, i: number) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {advice.commonMistakes && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-bold">Common Mistakes</h3>
            </div>
            <div className="grid gap-2">
              {advice.commonMistakes.map((mistake: string, i: number) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-sm">
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <span>{mistake}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  if (hotelResult) {
    return (
      <div className="space-y-6">
        <button onClick={() => setHotelResult(null)} className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <header>
          <h2 className="text-3xl font-bold gradient-text">{hotelTheme} Menu</h2>
          <p className="text-muted-foreground">AI-optimized for profitability and theme consistency.</p>
        </header>

        <section className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Utensils className="w-5 h-5 text-primary" />
            Menu Items
          </h3>
          <div className="grid gap-3">
            {hotelResult.menuItems.map((item: any, i: number) => (
              <div key={i} className="chef-card p-4 flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="font-bold">{item.name}</h4>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-green-500">{item.priceSuggestion}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            Combo Ideas
          </h3>
          <div className="grid gap-2">
            {hotelResult.comboIdeas.map((idea: string, i: number) => (
              <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 text-sm">
                {idea}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <TrendingUpIcon className="w-5 h-5 text-blue-400" />
            Profit Optimization
          </h3>
          <div className="grid gap-2">
            {hotelResult.profitTips.map((tip: string, i: number) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-sm">
                <DollarSign className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold gradient-text">Kitchen Tools</h2>
        <p className="text-muted-foreground">Choose your AI assistant mode.</p>
      </header>

      <Tabs defaultValue="coach" onValueChange={(v) => setMode(v as any)} className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-12 bg-white/5 p-1 rounded-xl">
          <TabsTrigger value="coach" className="rounded-lg data-[state=active]:bg-white/10">Coach</TabsTrigger>
          <TabsTrigger value="generator" className="rounded-lg data-[state=active]:bg-white/10">Gen</TabsTrigger>
          <TabsTrigger value="hotel" className="rounded-lg data-[state=active]:bg-white/10">Hotel</TabsTrigger>
        </TabsList>

        <TabsContent value="coach" className="mt-8 space-y-6">
          <div className="relative group">
            <Input 
              placeholder="What do you want to cook?" 
              value={queryStr}
              onChange={(e) => setQueryStr(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="h-16 pl-14 pr-6 rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 text-lg transition-all"
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={loading || !queryStr.trim()}
            className="w-full h-14 rounded-2xl text-lg font-bold flex gap-2"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ChefHat className="w-6 h-6" />}
            Start Coaching
          </Button>
        </TabsContent>

        <TabsContent value="generator" className="mt-8 space-y-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input 
                placeholder="Add ingredient (e.g. Tomato)" 
                value={currentIngredient}
                onChange={(e) => setCurrentIngredient(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (setIngredients([...ingredients, currentIngredient]), setCurrentIngredient(''))}
                className="h-14 rounded-2xl bg-white/5 border-white/10"
              />
              <Button 
                onClick={() => { if (currentIngredient) { setIngredients([...ingredients, currentIngredient]); setCurrentIngredient(''); } }}
                className="h-14 w-14 rounded-2xl"
              >
                <Plus className="w-6 h-6" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {ingredients.map((ing, i) => (
                <Badge key={i} variant="secondary" className="px-3 py-1 rounded-full flex items-center gap-2">
                  {ing}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setIngredients(ingredients.filter((_, idx) => idx !== i))} />
                </Badge>
              ))}
            </div>
          </div>
          <Button 
            onClick={handleGenerateRecipe} 
            disabled={loading || ingredients.length === 0}
            className="w-full h-14 rounded-2xl text-lg font-bold flex gap-2"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
            Generate Recipe
          </Button>
        </TabsContent>

        <TabsContent value="hotel" className="mt-8 space-y-6">
          <div className="space-y-4">
            <Input 
              placeholder="Restaurant Theme (e.g. Nepali Fusion)" 
              value={hotelTheme}
              onChange={(e) => setHotelTheme(e.target.value)}
              className="h-16 px-6 rounded-2xl bg-white/5 border-white/10 text-lg"
            />
          </div>
          <Button 
            onClick={handleGenerateHotel} 
            disabled={loading || !hotelTheme.trim()}
            className="w-full h-14 rounded-2xl text-lg font-bold flex gap-2"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Layout className="w-6 h-6" />}
            Generate Dashboard
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}

