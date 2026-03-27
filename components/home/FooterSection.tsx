import * as React from "react"
import Link from "next/link"
import { Sparkles } from "lucide-react"

const WINDOWS_EXE_URL = "https://github.com/RaghavOG/HabbitFlow/releases/download/v1.0.0/HabitFlow.Setup.1.0.0.exe"

export default function FooterSection() {
  return (
    <footer className="border-t border-border/50 mt-8">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="inline-flex size-8 items-center justify-center rounded-xl bg-linear-to-br from-blue-500/25 to-emerald-500/25 border border-border/60">
            <Sparkles className="size-4 text-primary" />
          </span>
          <span className="font-semibold tracking-tight">HabitFlow</span>
        </Link>

        {/* Links */}
        <nav className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          <Link href="/signup" className="hover:text-foreground transition-colors">Sign Up</Link>
          <Link href="/signin" className="hover:text-foreground transition-colors">Sign In</Link>
          <a
            href={WINDOWS_EXE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Download Windows (.exe)
          </a>
          <a
            href="https://github.com/RaghavOG/HabitFlow"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="size-3.5" />
            GitHub
          </a>
        </nav>

        {/* Copyright */}
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} HabitFlow. Built by Raghav Singla.
        </p>
      </div>
    </footer>
  )
}
