export type Level = 'Beginner' | 'Home Cook' | 'Pro' | 'Master Chef';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  xp: number;
  level: Level;
  streak: number;
  lastLogin: string;
  dailyChallengeCompleted: boolean;
  completedChallenges?: string[]; // IDs of completed challenges
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  steps: string[];
  time: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  authorId: string;
  createdAt: string;
  collectionId?: string;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  xpBonus: number;
  date: string;
  difficulty: string;
}

export interface DishAnalysis {
  id: string;
  userId: string;
  imageUrl: string;
  dishName: string;
  rating: number;
  feedback: string;
  platingSuggestions: string;
  textureAdvice: string;
  calories: number;
  nutrients: {
    protein: string;
    carbs: string;
    fats: string;
  };
  ingredients: string[];
  perfectSteps: string[];
  createdAt: string;
}

export interface CookingSession {
  id: string;
  userId: string;
  recipeId?: string;
  xpGained: number;
  createdAt: string;
}
