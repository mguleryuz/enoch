import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { Button } from './ui/button'
import { ThemeSelector } from './ui/theme-selector'

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const NavLinks = () => (
    <>
      <Link
        to="/"
        className="text-foreground/80 hover:text-primary transition-colors font-medium"
        activeProps={{ className: 'text-primary font-bold' }}
      >
        Translator
      </Link>
      <Link
        to="/dictionary"
        className="text-foreground/80 hover:text-primary transition-colors font-medium"
        activeProps={{ className: 'text-primary font-bold' }}
      >
        Dictionary
      </Link>
    </>
  )

  return (
    <header
      className={`sticky top-0 z-50 py-3 px-4 md:px-6 flex gap-2 items-center justify-between border-b border-border transition-all duration-300 ${
        isScrolled
          ? 'bg-background/90 backdrop-blur-sm shadow-md'
          : 'bg-background'
      }`}
    >
      <nav className="flex flex-row items-center">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center">
            <div className="relative overflow-hidden h-10 w-10 group">
              <img
                src="/assets/images/logo.svg"
                alt="Enoch Logo"
                className="h-10 w-10 transition-all duration-500 group-hover:rotate-[360deg] group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-primary/10 scale-0 rounded-full group-hover:scale-100 transition-transform duration-300"></div>
            </div>
          </Link>
          <div className="font-bold">
            <Link
              to="/"
              className="text-primary hover:text-primary/80 transition-colors text-lg md:text-xl"
            >
              EnochD
            </Link>
          </div>
        </div>
      </nav>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-6">
        <nav className="flex space-x-5">
          <NavLinks />
        </nav>
        <div className="flex items-center gap-2">
          <ThemeSelector />
        </div>
      </div>

      {/* Mobile Navigation Toggle */}
      <div className="flex md:hidden items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
        <ThemeSelector />
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg md:hidden py-4 px-6 flex flex-col gap-4 animate-in slide-in-from-top-5 duration-300">
          <nav className="flex flex-col space-y-4">
            <NavLinks />
          </nav>
        </div>
      )}
    </header>
  )
}
