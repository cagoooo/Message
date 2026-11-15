"use client";

import { useCallback, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { describeAuthError, isGoogleUser } from "@/lib/auth-utils";

export interface GoogleAuthState {
  /** 已用 Google 登入的使用者；未登入為 null */
  user: User | null;
  /** 第一次確認登入狀態中 */
  loading: boolean;
  /** 正在開啟 Google 登入視窗 */
  signingIn: boolean;
  signIn: () => Promise<{ ok: boolean; error?: string | null }>;
  signOut: () => Promise<void>;
}

export function useGoogleAuth(): GoogleAuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    try {
      unsub = onAuthStateChanged(getFirebaseAuth(), (u) => {
        setUser(isGoogleUser(u) ? u : null);
        setLoading(false);
      });
    } catch (err) {
      console.error("[auth] init failed:", err);
      setLoading(false);
    }
    return () => unsub?.();
  }, []);

  const signIn = useCallback(async () => {
    setSigningIn(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const cred = await signInWithPopup(getFirebaseAuth(), provider);
      setUser(isGoogleUser(cred.user) ? cred.user : null);
      return { ok: true };
    } catch (err) {
      console.error("[auth] Google sign-in failed:", err);
      return { ok: false, error: describeAuthError(err) };
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(getFirebaseAuth());
    setUser(null);
  }, []);

  return { user, loading, signingIn, signIn, signOut };
}
