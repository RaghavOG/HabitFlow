"use client"

import * as React from "react"
import Link from "next/link"
import { Show } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import HeroSection from "@/components/home/HeroSection"
import FeaturesSection from "@/components/home/FeaturesSection"
import FooterSection from "@/components/home/FooterSection"

const WINDOWS_EXE_URL = "https://github.com/RaghavOG/HabbitFlow/releases/download/v1.0.0/HabitFlow.Setup.1.0.0.exe"

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      {/* Ambient gradient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[120px] dark:bg-blue-500/8 animate-pulse" />
        <div className="absolute top-1/2 -right-40 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[120px] dark:bg-emerald-500/8 animate-pulse [animation-delay:2000ms]" />
        <div className="absolute -bottom-40 left-1/3 h-[400px] w-[400px] rounded-full bg-violet-500/8 blur-[100px] dark:bg-violet-500/6 animate-pulse [animation-delay:4000ms]" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(oklch(0 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(0 0 0) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <section className="mx-auto w-full max-w-6xl px-4 pt-16 pb-12">
        <HeroSection />
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-20">
        <FeaturesSection />

        <div className="mt-14 flex flex-col sm:flex-row gap-3 animate-fade-in-up delay-600">
          <Show when="signed-out">
            <Button
              asChild
              size="lg"
              className="btn-glow rounded-xl bg-primary text-primary-foreground font-medium shadow-sm"
            >
              <Link href="/signup">Get Started Free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl">
              <Link href="/signin">Sign In</Link>
            </Button>
          </Show>
          <Show when="signed-in">
            <Button
              asChild
              size="lg"
              className="btn-glow rounded-xl bg-primary text-primary-foreground font-medium shadow-sm"
            >
              <Link href="/dashboard">Go to Dashboard →</Link>
            </Button>
          </Show>

          <Button asChild size="lg" variant="outline" className="rounded-xl">
            <a href={WINDOWS_EXE_URL} target="_blank" rel="noopener noreferrer">
              Download for Windows (.exe)
            </a>
          </Button>
        </div>
      </section>

      <FooterSection />
    </main>
  )
}
