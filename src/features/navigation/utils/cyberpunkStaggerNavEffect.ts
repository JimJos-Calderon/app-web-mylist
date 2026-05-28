import gsap from 'gsap'

const STRIPE_COUNT = 25

export const CYBERPUNK_STAGGER_STRIPE_YS = Array.from({ length: STRIPE_COUNT }, (_, index) => index * 2)

type StripeRect = SVGRectElement

function getStripeNodes(container: HTMLElement): StripeRect[] {
  return gsap.utils.shuffle(gsap.utils.selector(container)('rect')) as StripeRect[]
}

function readStripeColors(container: HTMLElement) {
  const styles = getComputedStyle(container)
  const fill = styles.getPropertyValue('--cyberpunk-stagger-stripe-fill').trim()
  const fillAlt = styles.getPropertyValue('--cyberpunk-stagger-stripe-fill-alt').trim()
  return {
    fill: fill || '#00ffff',
    fillAlt: fillAlt || '#ff00ff',
  }
}

function killTweens(tweens: gsap.core.Tween[]) {
  tweens.forEach((tween) => tween.kill())
  tweens.length = 0
}

/** Barrido elástico al activar/desactivar la ruta (sin parpadeo). */
export function runCyberpunkStaggerNavSweep(container: HTMLElement, isChecked: boolean) {
  const nodes = getStripeNodes(container)
  if (nodes.length === 0) return

  const { fill } = readStripeColors(container)

  gsap.killTweensOf(nodes, 'xPercent')

  gsap.to(nodes, {
    duration: 0.8,
    ease: 'elastic.out(1, 0.3)',
    xPercent: isChecked ? 100 : 0,
    stagger: 0.01,
    overwrite: 'auto',
  })

  gsap.set(nodes, { fill })
}

/** Parpadeo de barras — solo en hover. */
export function startCyberpunkStaggerNavFlicker(
  container: HTMLElement,
  flickerStore: gsap.core.Tween[],
) {
  const nodes = getStripeNodes(container)
  if (nodes.length === 0) return

  const { fill, fillAlt } = readStripeColors(container)

  killTweens(flickerStore)
  gsap.killTweensOf(nodes, 'fill')

  const fillPulse = gsap.fromTo(
    nodes,
    { fill: fillAlt },
    {
      fill,
      duration: 0.1,
      ease: 'elastic.out(1, 0.3)',
      repeat: -1,
    },
  )
  flickerStore.push(fillPulse)

  const randomNodes = nodes.slice(0, 5)
  const stripePulse = gsap.to(randomNodes, {
    duration: 0.7,
    ease: 'elastic.out(1, 0.1)',
    xPercent: 100,
    stagger: 0.1,
    repeatDelay: 1.5,
    repeat: -1,
  })
  flickerStore.push(stripePulse)
}

export function stopCyberpunkStaggerNavFlicker(
  container: HTMLElement,
  flickerStore: gsap.core.Tween[],
  isChecked: boolean,
) {
  const nodes = getStripeNodes(container)
  if (nodes.length === 0) return

  const { fill } = readStripeColors(container)

  killTweens(flickerStore)
  gsap.killTweensOf(nodes, 'fill')

  gsap.set(nodes, { fill })
  gsap.killTweensOf(nodes, 'xPercent')
  gsap.set(nodes, { xPercent: isChecked ? 100 : 0 })
}
