"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import Landing from "./components/Landing";

export default function Home() {
  function handleLoginClick() {
    signIn("google", { callbackUrl: "/app-service" });
  }
  return <Landing onLoginClick={handleLoginClick} />;
}
