import { Link } from '@tanstack/react-router'
import { ThemeSelector } from './ui/theme-selector'

export default function Header() {
  return (
    <header className="p-2 flex gap-2 bg-foreground/5 shadow-sm items-center justify-between">
      <nav className="flex flex-row">
        <div className="px-2 font-bold">
          <Link
            to="/"
            className="text-primary hover:text-primary/80 transition-colors"
          >
            Enochian Translator
          </Link>
        </div>
      </nav>
      <div className="flex items-center gap-2">
        <ThemeSelector />
      </div>
    </header>
  )
}
