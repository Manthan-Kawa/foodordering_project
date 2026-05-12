import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  createUserWithEmailAndPassword,
  signOut,
  signInWithEmailAndPassword
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useUserStore } from "../src/store/userStore";

const firebaseConfig = {
    apiKey: "AIzaSyDktR9hJvFKzIn1vkvIUQoAFxL4iEACevk",
    authDomain: "pop-n-dine-v2.firebaseapp.com",
    projectId: "pop-n-dine-v2",
    storageBucket: "pop-n-dine-v2.firebasestorage.app",
    messagingSenderId: "832061527237",
    appId: "1:832061527237:web:f4bfa72016753e89fdccac",
    measurementId: "G-5NP42621T5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
const provider = new GoogleAuthProvider();

// Google Sign-In
export const signInWithGoogle = async () => {
  try {
    console.log("Starting Google Sign-In...");
    const result = await signInWithPopup(auth, provider);
    console.log("Google Sign-In successful, user:", result.user.email);
    const userData = await handleUserData(result.user);
    console.log("User data saved successfully");
    return userData;
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
};

// Email/Password Sign-Up
export const manualSignUp = async (
  email: string, 
  password: string, 
  name: string, 
  imageFile: File | null
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return await handleUserData(userCredential.user, name, imageFile, password);
  } catch (error) {
    console.error("Manual Sign-Up Error:", error);
    throw error;
  }
};

// Email/Password Login
export const manualLogin = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // First try to get existing user data
    const existingUserData = await getUserDocument(userCredential.user.uid);
    
    // If found, use that data instead of creating new
    if (existingUserData) {
      useUserStore.getState().setUser(existingUserData);
      return existingUserData;
    }
    
    // Only create new data if no existing record found
    return await handleUserData(userCredential.user);
  } catch (error) {
    console.error("Login Error:", error);
    throw error;
  }
};

// Common user data handling
const handleUserData = async (user: any, name?: string, imageFile?: File | null, password?: string) => {
  try {
    console.log("Handling user data for:", user.uid);
    
    // First try to get existing data with timeout
    const existingData = await Promise.race([
      getUserDocument(user.uid),
      new Promise(resolve => setTimeout(() => resolve(null), 3000))
    ]);
    console.log("Existing data:", existingData);
    
    let imageUrl = user.photoURL || "https://via.placeholder.com/100";
    
    if (imageFile) {
      try {
        const storageRef = ref(storage, `profile_images/${user.uid}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
        console.log("Image uploaded successfully");
      } catch (imageError) {
        console.error("Image upload error:", imageError);
      }
    }

    const userName = (existingData as any)?.name || name || user.displayName || "User";

    const userData = {
      uid: user.uid,
      email: user.email || "",
      name: userName,
      image: (existingData as any)?.image || imageUrl,
      phone: (existingData as any)?.phone || "",
      createdAt: (existingData as any)?.createdAt || new Date(),
      authProvider: user.providerData?.[0]?.providerId || "password",
      ...(password && { password })
    };

    const collectionName = userData.authProvider === "google.com" 
      ? "google_logins" 
      : "manual_logins";

    // Attempt Firestore write with timeout, but don't wait forever
    Promise.race([
      (async () => {
        const userRef = doc(db, collectionName, user.uid);
        await setDoc(userRef, userData, { merge: true });
        console.log("User data saved to Firestore");
      })(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Write timeout")), 3000))
    ]).catch(err => console.warn("Firestore write warning:", err));

    useUserStore.getState().setUser(userData);
    return userData;
  } catch (error) {
    console.error("Error in handleUserData:", error);
    // Fallback: create minimal user object from auth user
    const fallbackData = {
      uid: user.uid,
      email: user.email || "",
      name: name || user.displayName || "User",
      image: user.photoURL || "https://via.placeholder.com/100",
      phone: "",
    };
    useUserStore.getState().setUser(fallbackData);
    return fallbackData;
  }
};

// Helper function to get user document with timeout
export const getUserDocument = async (uid: string) => {
  try {
    // Add 5 second timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Firestore read timeout")), 5000)
    );

    // Check both collections
    const googleDocPromise = getDoc(doc(db, "google_logins", uid));
    const googleDoc = await Promise.race([googleDocPromise, timeoutPromise]) as any;
    if (googleDoc.exists()) return googleDoc.data();

    const manualDocPromise = getDoc(doc(db, "manual_logins", uid));
    const manualDoc = await Promise.race([manualDocPromise, timeoutPromise]) as any;
    if (manualDoc.exists()) return manualDoc.data();

    return null;
  } catch (error) {
    console.warn("getUserDocument error (non-critical):", error);
    return null;
  }
};