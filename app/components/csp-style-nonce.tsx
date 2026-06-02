"use client";

import { setNonce } from "get-nonce";
import { useInsertionEffect } from "react";

export function CspStyleNonce({ nonce }: { nonce: string | null }) {
  // Radix scroll locking creates style tags after hydration, so register the request nonce first.
  useInsertionEffect(() => {
    if (nonce) {
      setNonce(nonce);
    }
  }, [nonce]);

  return null;
}
