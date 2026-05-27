"use client";
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/providers/ThemeProvider"

const ModeToggle = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="rounded-full border border-border/70 bg-card/90 p-2 text-foreground shadow-sm shadow-black/[0.08] transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      {theme === "light" ? <Sun className="h-6 w-6 text-yellow-500" /> : <Moon className="h-6 w-6 text-blue-400" />}
    </button>
  )
}

export default ModeToggle
