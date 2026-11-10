export interface GoogleUser {
  email: string;
  displayName: string;
  photoURL: string;
  uid: string;
}

// ==========================================
// Firebase Web App Configuration (Real)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyB9a2RiFHi3pEL8lY70XVqLewnTLcLzF6s",
  authDomain: "yaqin-xizmat.firebaseapp.com",
  projectId: "yaqin-xizmat",
  storageBucket: "yaqin-xizmat.firebasestorage.app",
  messagingSenderId: "1070032599422",
  appId: "1:1070032599422:web:eb20dd48d64861d8131b2f",
  measurementId: "G-NVMYT5V57R"
};

export const signInWithGoogle = async (): Promise<GoogleUser> => {
  try {
    const { initializeApp, getApps, getApp } = await import('firebase/app');
    const { getAuth, GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');

    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const auth = getAuth(app);

    const googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('email');
    googleProvider.addScope('profile');

    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    return {
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      uid: user.uid
    };
  } catch (error: any) {
    console.error("Firebase Auth xatosi:", error?.code, error?.message);
    const code = error?.code || '';

    if (code === 'auth/popup-blocked') {
      throw new Error("Popup bloklandi. Brauzeringizda popup'ga ruxsat bering yoki saytini oddiy brauzerda oching.");
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      throw new Error("Google kirish oynasi yopildi. Qayta urinib ko'ring.");
    }
    if (code === 'auth/unauthorized-domain') {
      throw new Error(`Bu domen (${window.location.hostname}) Firebase'da ro'yxatdan o'tmagan. Firebase Console > Authentication > Settings > Authorized domains ro'yxatiga shu domenni qo'shing.`);
    }
    if (code === 'auth/network-request-failed') {
      throw new Error("Internet aloqasi yo'q. Tarmoqni tekshirib, qayta urinib ko'ring.");
    }
    if (code === 'auth/operation-not-supported-in-this-environment') {
      throw new Error("Bu muhitda Google oynasi ochilmaydi. Saytni oddiy brauzerda ochib ko'ring.");
    }
    if (code === 'auth/too-many-requests') {
      throw new Error("Juda ko'p urinish bo'ldi. Birozdan so'ng qayta urinib ko'ring.");
    }

    throw new Error("Google orqali kirishda xatolik yuz berdi. Qayta urinib ko'ring.");
  }
};
