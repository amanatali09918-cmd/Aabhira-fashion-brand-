// src/services/authService.js
import { 
  auth, 
  db, 
  storage, 
  googleProvider 
} from '../firebase/config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  updateProfile
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Register new supplier
export const registerSupplier = async (supplierData, documentFile) => {
  try {
    // 1. Create authentication user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      supplierData.email,
      supplierData.password
    );
    
    // 2. Upload document if exists
    let documentUrl = '';
    if (documentFile) {
      const storageRef = ref(storage, `supplier-docs/${userCredential.user.uid}/${documentFile.name}`);
      await uploadBytes(storageRef, documentFile);
      documentUrl = await getDownloadURL(storageRef);
    }
    
    // 3. Create supplier profile in Firestore
    const supplierProfile = {
      companyName: supplierData.companyName,
      businessType: supplierData.businessType,
      contactPerson: supplierData.contactPerson,
      designation: supplierData.designation,
      email: supplierData.email,
      phone: supplierData.phone,
      gstNumber: supplierData.gstNumber,
      companySize: supplierData.companySize,
      businessAddress: supplierData.businessAddress,
      productCategories: supplierData.productCategories,
      documentUrl: documentUrl,
      status: 'pending', // pending, approved, rejected
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(doc(db, "suppliers", userCredential.user.uid), supplierProfile);
    
    // 4. Update user display name
    await updateProfile(userCredential.user, {
      displayName: supplierData.companyName
    });
    
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Login supplier
export const loginSupplier = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Check if user is a supplier
    const supplierDoc = await getDoc(doc(db, "suppliers", userCredential.user.uid));
    
    if (!supplierDoc.exists()) {
      await signOut(auth);
      return { 
        success: false, 
        error: "Account not found. Please register as a supplier." 
      };
    }
    
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Google login
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    
    // Check if user exists in suppliers collection
    const supplierDoc = await getDoc(doc(db, "suppliers", result.user.uid));
    
    if (!supplierDoc.exists()) {
      // If new Google user, create basic supplier profile
      const supplierProfile = {
        companyName: result.user.displayName || "New Supplier",
        email: result.user.email,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(doc(db, "suppliers", result.user.uid), supplierProfile);
    }
    
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Reset password
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Logout
export const logoutSupplier = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};