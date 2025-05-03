import { Link } from '@tanstack/react-router'
import { ThemeSelector } from './ui/theme-selector'

export default function Header() {
  return (
    <header className="py-3 px-4 flex gap-2 bg-foreground/5 shadow-sm items-center justify-between border-b border-border">
      <nav className="flex flex-row items-center">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center">
            <img
              src="/assets/images/logo.svg"
              alt="Enoch Logo"
              className="h-10 w-10 transition-transform duration-300 hover:scale-110"
            />
          </Link>
          <div className="font-bold">
            <Link
              to="/"
              className="text-primary hover:text-primary/80 transition-colors text-lg"
            >
              Enochian Translator
            </Link>
          </div>
        </div>
      </nav>
      <div className="flex items-center gap-2">
        <ThemeSelector />
      </div>
    </header>
  )
}
