import React, { useState, useEffect } from 'react';
import { UserProfile, Collection, Recipe } from '../types';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  Bookmark,
  ChevronLeft,
  Trash2,
  Edit2,
  Utensils,
  FolderOpen,
  Plus,
  Mail,
  ChefHat
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';

export default function ProfileView({ user }: { user: UserProfile }) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'profile' | 'collections' | 'recipes' | 'recipe_detail'>('profile');
  
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    const fetchCollections = async () => {
      const q = query(collection(db, 'collections'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      setCollections(snap.docs.map(d => ({ id: d.id, ...d.data() } as Collection)));
    };
    fetchCollections();
  }, [user.uid]);

  const fetchRecipes = async (collectionId: string) => {
    setLoading(true);
    const q = query(collection(db, 'recipes'), where('collectionId', '==', collectionId));
    const snap = await getDocs(q);
    setRecipes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Recipe)));
    setLoading(false);
  };

  const handleDeleteCollection = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this collection and all its recipes?")) return;
    try {
      await deleteDoc(doc(db, 'collections', id));
      setCollections(collections.filter(c => c.id !== id));
    } catch (error) {
      console.error("Failed to delete collection", error);
    }
  };

  const handleEditCollection = async () => {
    if (!editingCollection || !editName.trim()) return;
    try {
      await updateDoc(doc(db, 'collections', editingCollection.id), { name: editName });
      setCollections(collections.map(c => c.id === editingCollection.id ? { ...c, name: editName } : c));
      setShowEditDialog(false);
    } catch (error) {
      console.error("Failed to update collection", error);
    }
  };

  const handleDeleteRecipe = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this recipe?")) return;
    try {
      await deleteDoc(doc(db, 'recipes', id));
      setRecipes(recipes.filter(r => r.id !== id));
      if (selectedRecipe?.id === id) setView('recipes');
    } catch (error) {
      console.error("Failed to delete recipe", error);
    }
  };

  if (view === 'recipe_detail' && selectedRecipe) {
    return (
      <div className="space-y-6">
        <button onClick={() => setView('recipes')} className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
          <span>Back to {selectedCollection?.name}</span>
        </button>

        <header className="space-y-2">
          <div className="flex justify-between items-start">
            <h2 className="text-3xl font-bold">{selectedRecipe.name}</h2>
            <Button variant="ghost" size="icon" onClick={(e) => handleDeleteRecipe(selectedRecipe.id, e)} className="text-destructive hover:bg-destructive/10">
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex gap-3">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              {selectedRecipe.difficulty}
            </Badge>
            <Badge variant="outline" className="text-muted-foreground">
              {selectedRecipe.time}
            </Badge>
          </div>
        </header>

        <section className="chef-card space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Utensils className="w-5 h-5" />
            <h3 className="font-bold">Ingredients</h3>
          </div>
          <ul className="grid grid-cols-1 gap-2">
            {selectedRecipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                {ing}
              </li>
            ))}
          </ul>
        </section>

        <section className="chef-card space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <ChefHat className="w-5 h-5" />
            <h3 className="font-bold">Cooking Steps</h3>
          </div>
          <div className="space-y-6">
            {selectedRecipe.steps.map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0 border border-primary/20">
                  {i + 1}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pt-1">{step}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (view === 'recipes' && selectedCollection) {
    return (
      <div className="space-y-6">
        <button onClick={() => setView('collections')} className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Collections</span>
        </button>
        
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{selectedCollection.name}</h2>
          <Badge variant="outline">{recipes.length} Recipes</Badge>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground italic">Loading recipes...</div>
          ) : recipes.length === 0 ? (
            <div className="text-center py-12 chef-card border-dashed">
              <Utensils className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground">No recipes in this collection yet.</p>
            </div>
          ) : (
            recipes.map(recipe => (
              <div 
                key={recipe.id} 
                onClick={() => {
                  setSelectedRecipe(recipe);
                  setView('recipe_detail');
                }}
                className="chef-card flex justify-between items-center group cursor-pointer hover:border-primary/30"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <h4 className="font-bold">{recipe.name}</h4>
                    <p className="text-xs text-muted-foreground">{recipe.time} • {recipe.difficulty}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                    View
                  </Button>
                  <Button variant="ghost" size="icon" onClick={(e) => handleDeleteRecipe(recipe.id, e)} className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (view === 'collections') {
    return (
      <div className="space-y-6">
        <button onClick={() => setView('profile')} className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Profile</span>
        </button>

        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">My Collections</h2>
        </div>

        <div className="grid gap-4">
          {collections.length === 0 ? (
            <div className="text-center py-12 chef-card border-dashed">
              <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground">You haven't created any collections yet.</p>
              <p className="text-[10px] text-muted-foreground mt-2">Save a recipe in the Cook tab to create one!</p>
            </div>
          ) : (
            collections.map(col => (
              <div 
                key={col.id} 
                onClick={() => {
                  setSelectedCollection(col);
                  fetchRecipes(col.id);
                  setView('recipes');
                }}
                className="chef-card flex justify-between items-center cursor-pointer hover:border-primary/30"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Bookmark className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold">{col.name}</h4>
                    <p className="text-xs text-muted-foreground">Created {new Date(col.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCollection(col);
                      setEditName(col.name);
                      setShowEditDialog(true);
                    }}
                    className="text-muted-foreground hover:text-white"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => handleDeleteCollection(col.id, e)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="bg-background border-white/10">
            <DialogHeader>
              <DialogTitle>Edit Collection</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowEditDialog(false)}>Cancel</Button>
              <Button onClick={handleEditCollection}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col items-center text-center pt-4">
        <div className="relative mb-4">
          <Avatar className="w-24 h-24 border-4 border-white/10 shadow-2xl">
            <AvatarImage src={user.photoURL} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {user.displayName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-background border-4 border-background rounded-full flex items-center justify-center">
            <div className="w-full h-full bg-primary rounded-full flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>
        </div>
        <h2 className="text-2xl font-bold">{user.displayName}</h2>
        <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
          <Mail className="w-3 h-3" />
          <span>{user.email}</span>
        </div>
        <div className="mt-4">
          <span className="px-4 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest border border-primary/20">
            {user.level}
          </span>
        </div>
      </header>

      <div className="space-y-6">
        <section className="space-y-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">Library</h3>
          <div className="chef-card p-0 overflow-hidden divide-y divide-white/5">
            <ProfileItem 
              icon={<Bookmark className="w-5 h-5" />} 
              label="My Collections" 
              onClick={() => setView('collections')}
              badge={collections.length > 0 ? collections.length.toString() : undefined}
            />
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">Account</h3>
          <div className="chef-card p-0 overflow-hidden divide-y divide-white/5">
            <ProfileItem icon={<User className="w-5 h-5" />} label="Personal Info" />
            <ProfileItem icon={<Bell className="w-5 h-5" />} label="Notifications" badge="2" />
            <ProfileItem icon={<Shield className="w-5 h-5" />} label="Privacy & Security" />
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">Support</h3>
          <div className="chef-card p-0 overflow-hidden divide-y divide-white/5">
            <ProfileItem icon={<HelpCircle className="w-5 h-5" />} label="Help Center" />
            <ProfileItem icon={<Settings className="w-5 h-5" />} label="Settings" />
          </div>
        </section>

        <Button 
          variant="destructive" 
          onClick={() => signOut(auth)}
          className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </Button>
      </div>

      <footer className="text-center py-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">ChefMind AI v1.0.0</p>
      </footer>
    </div>
  );
}

function ProfileItem({ icon, label, badge, onClick }: { icon: React.ReactNode, label: string, badge?: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-4">
        <div className="text-muted-foreground">{icon}</div>
        <span className="font-medium text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
            {badge}
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </button>
  );
}

