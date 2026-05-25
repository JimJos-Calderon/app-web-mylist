import { useEffect, useRef } from 'react'
import { useReducedMotion } from '@/features/shared/hooks/useReducedMotion'

const MATRIX_CHARACTERS =
  "!#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`{|}~¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ØÞßऀःऄअआइईउऊऋऌऍऎएऐऑऒओऔकखगघङचछजझञटठडढणतथदधनऩपफबभमयरऱलळऴवशषसहऺऻ़ऽािीुूृॄॅॆेैॉॊोौ्ॎॏॐ॑॓॔ॕॖॗक़ख़ग़ज़ड़ढ़फ़य़ॠॡॢॣ।॥•०१२३४५६७८९॰ॱॲॳॴॵॶॷॸॹॺॻॼॽॾॿಀಁಂಃ಄ಅಆಇಈಉಊಋಌಎಏಐಒಓಔಕಖಗಘಙಚಛಜಝಞಟಠಡಢಣತಥದಧನಪಫಬಭಮಯರಱಲಳವಶಷಸಹ಼ಽಾಿೀುೂೃೄೆೇೈೊೋೌ್ೕೖೞೠೡೢೣ೦೧೨೩೪೫೬೭೮೯ೱೲ"

const FPS = 30
const FRAME_INTERVAL_MS = 1000 / FPS
const FADE_COLOR = 'rgba(0,0,0,0.05)'
const MATRIX_COLOR = '#0aff0a'

class Symbol {
  x: number
  y: number
  fontSize: number
  canvasHeight: number
  text = ''

  constructor(x: number, y: number, fontSize: number, canvasHeight: number) {
    this.x = x
    this.y = y
    this.fontSize = fontSize
    this.canvasHeight = canvasHeight
  }

  draw(context: CanvasRenderingContext2D) {
    this.text = MATRIX_CHARACTERS.charAt(Math.floor(Math.random() * MATRIX_CHARACTERS.length))
    context.fillText(this.text, this.x * this.fontSize, this.y * this.fontSize)

    if (this.y * this.fontSize > this.canvasHeight && Math.random() > 0.98) {
      this.y = 0
    } else {
      this.y += 1
    }
  }
}

class MatrixEffect {
  canvasWidth: number
  canvasHeight: number
  fontSize = 12
  columns: number
  symbols: Symbol[] = []

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    this.columns = this.canvasWidth / this.fontSize
    this.initialize()
  }

  private initialize() {
    this.symbols = []
    for (let i = 0; i < this.columns; i++) {
      this.symbols[i] = new Symbol(i, 0, this.fontSize, this.canvasHeight)
    }
  }

  resize(width: number, height: number) {
    this.canvasWidth = width
    this.canvasHeight = height
    this.columns = this.canvasWidth / this.fontSize
    this.initialize()
  }
}

/** Matrix rain canvas background for the terminal theme. */
const TerminalMatrixBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (reducedMotion) return

    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    const setCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    setCanvasSize()
    let effect = new MatrixEffect(canvas.width, canvas.height)
    let lastTime = 0
    let timer = 0
    let rafId = 0

    const animate = (timeStamp: number) => {
      rafId = requestAnimationFrame(animate)
      const deltaTime = timeStamp - lastTime
      lastTime = timeStamp

      if (timer > FRAME_INTERVAL_MS) {
        context.fillStyle = FADE_COLOR
        context.textAlign = 'center'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.fillStyle = MATRIX_COLOR
        context.font = `${effect.fontSize}px monospace`
        effect.symbols.forEach((symbol) => symbol.draw(context))
        timer = 0
      } else {
        timer += deltaTime
      }
    }

    const onResize = () => {
      setCanvasSize()
      effect.resize(canvas.width, canvas.height)
    }

    rafId = requestAnimationFrame(animate)
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
    }
  }, [reducedMotion])

  if (reducedMotion) {
    return <div className="terminal-matrix-bg terminal-matrix-bg--static" aria-hidden="true" />
  }

  return (
    <canvas
      ref={canvasRef}
      id="terminal-matrix-canvas"
      className="terminal-matrix-bg"
      aria-hidden="true"
    />
  )
}

export default TerminalMatrixBackground
