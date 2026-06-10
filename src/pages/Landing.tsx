import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { TechBackground, useTheme } from '@/features/shared'
import { formatRetroHeading } from '@/features/shared/utils/textUtils'

const Landing: React.FC = () => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const location = useLocation()
  const loginTarget = `/login?from=${encodeURIComponent(location.pathname + location.search)}`
  const isRetroCartoon = theme === 'retro-cartoon'
  const retroText = (value: string) => formatRetroHeading(value, theme)

  const [scrollY, setScrollY] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Track scroll for parallax effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Custom cursor logic for cyberpunk and terminal themes
  useEffect(() => {
    if (isRetroCartoon) return
    const isFinePointer = window.matchMedia('(pointer: fine)').matches
    if (!isFinePointer) return

    const cursorEl = document.getElementById('cursor')
    if (!cursorEl) return

    let currentX = window.innerWidth / 2
    let currentY = window.innerHeight / 2
    let targetX = currentX
    let targetY = currentY

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX
      targetY = e.clientY
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    let animFrameId: number
    const renderCursor = () => {
      currentX += (targetX - currentX) * 0.22
      currentY += (targetY - currentY) * 0.22
      cursorEl.style.left = `${currentX}px`
      cursorEl.style.top = `${currentY}px`
      animFrameId = requestAnimationFrame(renderCursor)
    }
    renderCursor()

    const handleMouseEnter = () => cursorEl.classList.add('big')
    const handleMouseLeave = () => cursorEl.classList.remove('big')
    const handleMouseDown = () => cursorEl.classList.add('press')
    const handleMouseUp = () => cursorEl.classList.remove('press')

    const attachListeners = () => {
      const interactiveEls = document.querySelectorAll('.landing-page-wrap a, .landing-page-wrap button, .landing-page-wrap .feature-card, .landing-page-wrap .roadmap-item')
      interactiveEls.forEach(el => {
        el.addEventListener('mouseenter', handleMouseEnter)
        el.addEventListener('mouseleave', handleMouseLeave)
        el.addEventListener('mousedown', handleMouseDown)
        el.addEventListener('mouseup', handleMouseUp)
      })
    }

    const timer = setTimeout(attachListeners, 150)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animFrameId)
      clearTimeout(timer)
      const interactiveEls = document.querySelectorAll('.landing-page-wrap a, .landing-page-wrap button, .landing-page-wrap .feature-card, .landing-page-wrap .roadmap-item')
      interactiveEls.forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnter)
        el.removeEventListener('mouseleave', handleMouseLeave)
        el.removeEventListener('mousedown', handleMouseDown)
        el.removeEventListener('mouseup', handleMouseUp)
      })
    }
  }, [isRetroCartoon])

  // Scroll reveal animation using IntersectionObserver
  useEffect(() => {
    const revealItems = document.querySelectorAll('.landing-page-wrap .reveal')
    revealItems.forEach((el) => {
      const htmlEl = el as HTMLElement
      const localIndex = Array.from(htmlEl.parentElement?.children || []).indexOf(htmlEl)
      htmlEl.style.setProperty('--delay', `${Math.min(localIndex * 60, 260)}ms`)
    })

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in')
          observer.unobserve(entry.target)
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' })

    revealItems.forEach(el => observer.observe(el))

    // Trigger hero title animation
    const heroTitle = document.getElementById('heroTitle')
    if (heroTitle) {
      heroTitle.classList.add('in')
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  // Magnetic elements effect
  useEffect(() => {
    const isFinePointer = window.matchMedia('(pointer: fine)').matches
    if (!isFinePointer) return

    const magneticEls = document.querySelectorAll('.landing-page-wrap .magnetic')
    
    const handleMouseMove = (e: MouseEvent, el: HTMLElement) => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2
      el.style.transform = `translate(${x * 0.10}px, ${y * 0.14}px) scale(1.012)`
    }

    const handleMouseLeave = (el: HTMLElement) => {
      el.style.transform = 'translate(0,0) scale(1)'
    }

    const listeners = new Map<HTMLElement, { move: (e: MouseEvent) => void, leave: () => void }>()

    magneticEls.forEach((el) => {
      const htmlEl = el as HTMLElement
      const move = (e: MouseEvent) => handleMouseMove(e, htmlEl)
      const leave = () => handleMouseLeave(htmlEl)
      htmlEl.addEventListener('mousemove', move)
      htmlEl.addEventListener('mouseleave', leave)
      listeners.set(htmlEl, { move, leave })
    })

    return () => {
      listeners.forEach((fns, el) => {
        el.removeEventListener('mousemove', fns.move)
        el.removeEventListener('mouseleave', fns.leave)
      })
    }
  }, [])

  return (
    <div className="landing-page-wrap">
      {/* Background layer */}
      <div className="grid-bg" />
      {!isRetroCartoon && <TechBackground />}

      {/* Lag follow custom cursor (Only visible in cyberpunk/terminal) */}
      {!isRetroCartoon && <div className="cursor-element" id="cursor" />}

      <header className="topbar">
        <Link to="/" className="brand" aria-label="WhichNext home">
          <span className="text-xl font-black tracking-wider uppercase font-heading">{retroText('WhichNext')}</span>
        </Link>
        <nav className={`nav-menu ${isMobileMenuOpen ? 'mobile-open' : ''}`} id="mainNav" role="navigation" aria-label="Primary">
          <a href="#features" onClick={() => setIsMobileMenuOpen(false)}>{retroText(t('landing.nav.features'))}</a>
          <a href="#workflow" onClick={() => setIsMobileMenuOpen(false)}>{retroText(t('landing.nav.workflow'))}</a>
          <a href="#intelligence" onClick={() => setIsMobileMenuOpen(false)}>{retroText(t('landing.nav.oracle'))}</a>
          <a href="#themes" onClick={() => setIsMobileMenuOpen(false)}>{retroText(t('landing.nav.themes'))}</a>
          <a href="#roadmap" onClick={() => setIsMobileMenuOpen(false)}>{retroText(t('landing.nav.roadmap'))}</a>
        </nav>
        <div className="top-actions">
          <Link className="mini-link cursor-pointer" to={loginTarget}>{retroText(t('landing.nav.login'))}</Link>
          <button 
            className="menu-button cursor-pointer" 
            id="menuButton" 
            aria-expanded={isMobileMenuOpen} 
            aria-controls="mainNav" 
            aria-label="Open navigation"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? retroText(t('landing.nav.close')) : retroText(t('landing.nav.menu'))}
          </button>
        </div>
      </header>

      {/* Hero Parallax Banner */}
      <div className={`hero-parallax-container relative w-full overflow-hidden ${
        isRetroCartoon 
          ? 'h-[250px] sm:h-[380px] md:h-[480px] border-b-[4px] border-black shadow-[0_4px_0_#1a1a1a]' 
          : 'h-[200px] sm:h-[300px] md:h-[400px] border-b border-[rgba(var(--color-accent-primary-rgb),0.3)] shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
      }`}>
        <div 
          className="absolute inset-x-0 -top-[10%] h-[120%] w-full bg-cover bg-center transition-transform duration-75 ease-out"
          style={{
            backgroundImage: 'url(/landing.png)',
            transform: `translateY(${Math.min(scrollY * 0.3, 120)}px)`,
          }}
        />
        {/* Blending overlay for themes */}
        {theme === 'cyberpunk' && (
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/25 via-transparent to-fuchsia-500/25 mix-blend-color pointer-events-none" />
        )}
        {theme === 'terminal' && (
          <div className="absolute inset-0 bg-[rgba(0,255,65,0.25)] mix-blend-color pointer-events-none" />
        )}
      </div>

      <main id="top">
        <section className="hero-brutalist wrap">
          <div className="hero-grid">
            <div className="hero-main reveal">
              <div className="hero-kicker font-heading">
                <span>{retroText(t('landing.hero.kicker1'))}</span>
                <span>{retroText(t('landing.hero.kicker2'))}</span>
              </div>
              <h1 className="hero-title font-heading" id="heroTitle">
                <span className="hero-word" style={{ '--word-delay': '0ms' } as React.CSSProperties}>{retroText(t('landing.hero.titleWord1'))}</span><br />
                <span className="hero-word" style={{ '--word-delay': '90ms' } as React.CSSProperties}>{retroText(t('landing.hero.titleWord2'))}<span className="slash">/</span></span><br />
                <span className="hero-word" style={{ '--word-delay': '180ms' } as React.CSSProperties}>{retroText(t('landing.hero.titleWord3'))}</span>
              </h1>
              <div className="hero-copy">
                <p className="large-desc">{retroText(t('landing.hero.desc'))}</p>
                <div className="meta-strip">
                  <div><strong>01</strong><span>{retroText(t('landing.hero.stat1'))}</span></div>
                  <div><strong>03</strong><span>{retroText(t('landing.hero.stat2'))}</span></div>
                  <div><strong>100%</strong><span>{retroText(t('landing.hero.stat3'))}</span></div>
                </div>
              </div>
            </div>

            <div className="hero-side">
              <div className="terminal-card reveal">
                <div className="terminal-head">
                  <span>{t('landing.terminal.line1')}</span>
                  <div className="dots"><span></span><span></span><span></span></div>
                </div>
                <div className="terminal-body">
                  <em>{retroText(t('landing.terminal.line2'))}</em><br /><br />
                  ● {retroText(t('landing.terminal.line3'))}<br />
                  &nbsp;&nbsp;{retroText(t('landing.terminal.line4'))}<br />
                  &nbsp;&nbsp;{retroText(t('landing.terminal.line5'))}<br /><br />
                  ● {retroText(t('landing.terminal.line6'))}<br />
                  &nbsp;&nbsp;{retroText(t('landing.terminal.line7'))}<br />
                  &nbsp;&nbsp;{retroText(t('landing.terminal.line8'))}<br /><br />
                  <b>➜ {retroText(t('landing.terminal.line9'))}</b><br />
                  {retroText(t('landing.terminal.line10'))}<br />
                  {retroText(t('landing.terminal.line11'))}
                </div>
              </div>
              <div className="side-note reveal">
                <h2 className="font-heading">{retroText(t('landing.sideNote.title'))}</h2>
                <p>{retroText(t('landing.sideNote.desc'))}</p>
                <Link className="btn-brutalist magnetic cursor-pointer" to={loginTarget}>{retroText(t('landing.sideNote.btn'))}</Link>
              </div>
            </div>
          </div>
        </section>

        <div className="marquee-brutalist" aria-hidden="true">
          <div className="marquee-track">
            <span>{retroText(t('landing.marquee.share'))}</span>
            <span>{retroText(t('landing.marquee.vote'))}</span>
            <span>{retroText(t('landing.marquee.recommend'))}</span>
            <span>{retroText(t('landing.marquee.oracle'))}</span>
            <span>{retroText(t('landing.marquee.search'))}</span>
            <span>{retroText(t('landing.marquee.cyberpunk'))}</span>
            <span>{retroText(t('landing.marquee.retro'))}</span>
            <span>{retroText(t('landing.marquee.terminal'))}</span>
            <span>{retroText(t('landing.marquee.sync'))}</span>
            <span>{retroText(t('landing.marquee.pending'))}</span>
            <span>{retroText(t('landing.marquee.watched'))}</span>

            <span>{retroText(t('landing.marquee.share'))}</span>
            <span>{retroText(t('landing.marquee.vote'))}</span>
            <span>{retroText(t('landing.marquee.recommend'))}</span>
            <span>{retroText(t('landing.marquee.oracle'))}</span>
            <span>{retroText(t('landing.marquee.search'))}</span>
            <span>{retroText(t('landing.marquee.cyberpunk'))}</span>
            <span>{retroText(t('landing.marquee.retro'))}</span>
            <span>{retroText(t('landing.marquee.terminal'))}</span>
            <span>{retroText(t('landing.marquee.sync'))}</span>
            <span>{retroText(t('landing.marquee.pending'))}</span>
            <span>{retroText(t('landing.marquee.watched'))}</span>
          </div>
        </div>

        <section id="features" className="wrap">
          <div className="section-head reveal">
            <span className="section-index">{retroText(t('landing.features.index'))}</span>
            <h2 className="section-title font-heading">{retroText(t('landing.features.title'))}</h2>
            <p className="section-desc">{retroText(t('landing.features.desc'))}</p>
          </div>
          <div className="features-grid">
            <article className="feature-card reveal" data-no="01">
              <small>{retroText('Feature 01')}</small>
              <h3 className="font-heading">{retroText(t('landing.features.cards.c1_title'))}</h3>
              <p>{retroText(t('landing.features.cards.c1_desc'))}</p>
            </article>
            <article className="feature-card reveal" data-no="02">
              <small>{retroText('Feature 02')}</small>
              <h3 className="font-heading">{retroText(t('landing.features.cards.c2_title'))}</h3>
              <p>{retroText(t('landing.features.cards.c2_desc'))}</p>
            </article>
            <article className="feature-card reveal" data-no="03">
              <small>{retroText('Feature 03')}</small>
              <h3 className="font-heading">{retroText(t('landing.features.cards.c3_title'))}</h3>
              <p>{retroText(t('landing.features.cards.c3_desc'))}</p>
            </article>
            <article className="feature-card reveal" data-no="04">
              <small>{retroText('Feature 04')}</small>
              <h3 className="font-heading">{retroText(t('landing.features.cards.c4_title'))}</h3>
              <p>{retroText(t('landing.features.cards.c4_desc'))}</p>
            </article>
            <article className="feature-card reveal" data-no="05">
              <small>{retroText('Feature 05')}</small>
              <h3 className="font-heading">{retroText(t('landing.features.cards.c5_title'))}</h3>
              <p>{retroText(t('landing.features.cards.c5_desc'))}</p>
            </article>
            <article className="feature-card reveal" data-no="06">
              <small>{retroText('Feature 06')}</small>
              <h3 className="font-heading">{retroText(t('landing.features.cards.c6_title'))}</h3>
              <p>{retroText(t('landing.features.cards.c6_desc'))}</p>
            </article>
          </div>
        </section>

        <section id="workflow" className="wrap">
          <div className="section-head reveal">
            <span className="section-index">{retroText(t('landing.workflow.index'))}</span>
            <h2 className="section-title font-heading">{retroText(t('landing.workflow.title'))}</h2>
            <p className="section-desc">{retroText(t('landing.workflow.desc'))}</p>
          </div>
          <div className="workflow-list">
            <div className="flow-card reveal">
              <strong>01</strong>
              <h3 className="font-heading">{retroText(t('landing.workflow.steps.s1_title'))}</h3>
              <span>{retroText(t('landing.workflow.steps.s1_lbl'))}</span>
            </div>
            <div className="flow-card reveal">
              <strong>02</strong>
              <h3 className="font-heading">{retroText(t('landing.workflow.steps.s2_title'))}</h3>
              <span>{retroText(t('landing.workflow.steps.s2_lbl'))}</span>
            </div>
            <div className="flow-card reveal">
              <strong>03</strong>
              <h3 className="font-heading">{retroText(t('landing.workflow.steps.s3_title'))}</h3>
              <span>{retroText(t('landing.workflow.steps.s3_lbl'))}</span>
            </div>
            <div className="flow-card reveal">
              <strong>04</strong>
              <h3 className="font-heading">{retroText(t('landing.workflow.steps.s4_title'))}</h3>
              <span>{retroText(t('landing.workflow.steps.s4_lbl'))}</span>
            </div>
            <div className="flow-card reveal">
              <strong>05</strong>
              <h3 className="font-heading">{retroText(t('landing.workflow.steps.s5_title'))}</h3>
              <span>{retroText(t('landing.workflow.steps.s5_lbl'))}</span>
            </div>
          </div>
        </section>

        <section id="intelligence" className="wrap">
          <div className="split-panels">
            <div className="panel-brutalist reveal">
              <h3 className="font-heading">{retroText(t('landing.intelligence.panel1_title'))}</h3>
              <div className="rule">
                <span>{retroText(t('landing.intelligence.panel1_r1'))}</span>
                <span className="pill">{retroText(t('landing.intelligence.panel1_r1_lbl'))}</span>
              </div>
              <div className="rule">
                <span>{retroText(t('landing.intelligence.panel1_r2'))}</span>
                <span className="pill">{retroText(t('landing.intelligence.panel1_r2_lbl'))}</span>
              </div>
              <div className="rule">
                <span>{retroText(t('landing.intelligence.panel1_r3'))}</span>
                <span className="pill">{retroText(t('landing.intelligence.panel1_r3_lbl'))}</span>
              </div>
            </div>
            <div className="panel-brutalist reveal" style={{ background: 'var(--field)' }}>
              <h3 className="font-heading">{retroText(t('landing.intelligence.panel2_title'))}</h3>
              <div className="rule">
                <span>{retroText(t('landing.intelligence.panel2_r1'))}</span>
                <span className="pill danger">{retroText(t('landing.intelligence.panel2_r1_lbl'))}</span>
              </div>
              <div className="rule">
                <span>{retroText(t('landing.intelligence.panel2_r2'))}</span>
                <span className="pill">{retroText(t('landing.intelligence.panel2_r2_lbl'))}</span>
              </div>
              <div className="rule">
                <span>{retroText(t('landing.intelligence.panel2_r3'))}</span>
                <span className="pill">{retroText(t('landing.intelligence.panel2_r3_lbl'))}</span>
              </div>
            </div>
          </div>
        </section>

        <section id="themes" className="wrap">
          <div className="section-head reveal">
            <span className="section-index">{retroText(t('landing.themes.index'))}</span>
            <h2 className="section-title font-heading">{retroText(t('landing.themes.title'))}</h2>
            <p className="section-desc">{retroText(t('landing.themes.desc'))}</p>
          </div>
          <div className="install-grid">
            <div className="panel-brutalist reveal">
              <h3 className="font-heading">{retroText(t('landing.themes.card1_title'))}</h3>
              <div className="command">
                <i>→</i>
                <code>{retroText(t('landing.themes.card1_c1'))}</code>
              </div>
              <div className="command">
                <i>→</i>
                <code>{retroText(t('landing.themes.card1_c2'))}</code>
              </div>
            </div>
            <div className="panel-brutalist reveal" style={{ background: 'var(--field)' }}>
              <h3 className="font-heading">{retroText(t('landing.themes.card2_title'))}</h3>
              <div className="command">
                <i>$</i>
                <code>{retroText(t('landing.themes.card2_c1'))}</code>
              </div>
              <div className="command">
                <i>$</i>
                <code>{retroText(t('landing.themes.card2_c2'))}</code>
              </div>
            </div>
          </div>
        </section>

        <section id="roadmap" className="wrap">
          <div className="section-head reveal">
            <span className="section-index">{retroText(t('landing.roadmap.index'))}</span>
            <h2 className="section-title font-heading">{retroText(t('landing.roadmap.title'))}</h2>
            <p className="section-desc">{retroText(t('landing.roadmap.desc'))}</p>
          </div>
          <div className="roadmap-list">
            <div className="roadmap-item reveal">
              <small>{retroText('Phase 01')}</small>
              <h3 className="font-heading">{retroText(t('landing.roadmap.p1'))}</h3>
              <span className="pill">{retroText(t('landing.roadmap.status_completed'))}</span>
            </div>
            <div className="roadmap-item reveal">
              <small>{retroText('Phase 02')}</small>
              <h3 className="font-heading">{retroText(t('landing.roadmap.p2'))}</h3>
              <span className="pill">{retroText(t('landing.roadmap.status_completed'))}</span>
            </div>
            <div className="roadmap-item reveal">
              <small>{retroText('Phase 03')}</small>
              <h3 className="font-heading">{retroText(t('landing.roadmap.p3'))}</h3>
              <span className="pill">{retroText(t('landing.roadmap.status_completed'))}</span>
            </div>
            <div className="roadmap-item reveal">
              <small>{retroText('Phase 04')}</small>
              <h3 className="font-heading">{retroText(t('landing.roadmap.p4'))}</h3>
              <span className="pill danger">{retroText(t('landing.roadmap.status_soon'))}</span>
            </div>
          </div>
        </section>

        <section className="wrap">
          <div className="cta-brutalist reveal">
            <div>
              <span className="section-index" style={{ color: 'rgba(255,255,255,.56)' }}>{retroText(t('landing.cta.kicker'))}</span>
              <h2 className="font-heading">{retroText(t('landing.cta.title'))}</h2>
            </div>
            <Link to={loginTarget} className="btn-brutalist magnetic cursor-pointer">{retroText(t('landing.cta.btn'))}</Link>
          </div>
        </section>
      </main>

      <footer className="wrap">
        <span>{retroText(t('landing.footer.copyright'))}</span>
      </footer>
    </div>
  )
}

export default Landing