"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [nickname, setNickname] = useState("");

  async function onLogin() {
    const trimmed = nickname.trim();
    if (!trimmed) return;

    const { data, error } = await supabase.auth.signInAnonymously({
      options: { data: { nickname: trimmed } },
    });

    if (error) {
      alert("로그인 오류: " + error.message);
      return;
    }

    localStorage.setItem("nickname", trimmed);
    localStorage.setItem("user_id", data.user?.id ?? "");
    window.location.href = "/";
  }

  return (
    <main style={{ padding: 24, maxWidth: 520, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>요원 후보 등록</h1>
      <p style={{ opacity: 0.8 }}>
        콜사인(닉네임)을 입력하고 입장하세요. (개인 기기 기준)
      </p>

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="예: FROG-17"
          style={{ flex: 1, padding: 12, fontSize: 16 }}
        />
        <button
          onClick={onLogin}
          disabled={!nickname.trim()}
          style={{ padding: "12px 16px", fontSize: 16 }}
        >
          입장
        </button>
      </div>

      <p style={{ marginTop: 16, fontSize: 12, opacity: 0.7 }}>
        * 오류가 나면 새로고침 후 다시 시도하세요.
      </p>
    </main>
  );
}
