import { useEffect, useRef } from 'react'
import { useReducedMotion } from '@/features/shared/hooks/useReducedMotion'

/** Animated neon lines (Jack Rugile / CodePen bdwvMo), cyberpunk theme only. */
const CyberpunkLinesBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (reducedMotion) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rand = (min: number, max: number) => Math.random() * (max - min) + min
    const randInt = (min: number, max: number) => Math.floor(min + Math.random() * (max - min + 1))

    type Point = { x: number; y: number }

    class Line {
      path: Point[] = []
      speed: number
      count: number
      x: number
      y: number
      target: Point
      dist = 0
      angle = 0
      hue: number
      life = 1

      constructor(
        private width: number,
        private height: number,
        private gridSize: number,
        tick: number,
      ) {
        this.speed = rand(10, 20)
        this.count = randInt(10, 30)
        this.x = width / 2 + 1
        this.y = height / 2 + 1
        this.target = { x: width / 2, y: height / 2 }
        this.hue = tick / 5
        this.updateAngle()
        this.updateDist()
      }

      updateDist() {
        const dx = this.target.x - this.x
        const dy = this.target.y - this.y
        this.dist = Math.sqrt(dx * dx + dy * dy)
      }

      updateAngle() {
        const dx = this.target.x - this.x
        const dy = this.target.y - this.y
        this.angle = Math.atan2(dy, dx)
      }

      changeTarget() {
        const randStart = randInt(0, 3)
        switch (randStart) {
          case 0:
            this.target.y = this.y - this.gridSize
            break
          case 1:
            this.target.x = this.x + this.gridSize
            break
          case 2:
            this.target.y = this.y + this.gridSize
            break
          case 3:
            this.target.x = this.x - this.gridSize
            break
        }
        this.updateAngle()
      }

      step(lines: Line[], index: number) {
        this.x += Math.cos(this.angle) * this.speed
        this.y += Math.sin(this.angle) * this.speed
        this.updateDist()

        if (this.dist < this.speed) {
          this.x = this.target.x
          this.y = this.target.y
          this.changeTarget()
        }

        this.path.push({ x: this.x, y: this.y })
        if (this.path.length > this.count) {
          this.path.shift()
        }

        this.life -= 0.001

        if (this.life <= 0) {
          this.path = []
          lines.splice(index, 1)
        }
      }

      draw() {
        ctx.beginPath()
        const rando = rand(0, 10)
        for (let j = 0; j < this.path.length; j++) {
          const pt = this.path[j]
          if (j === 0) {
            ctx.moveTo(pt.x + rand(-rando, rando), pt.y + rand(-rando, rando))
          } else {
            ctx.lineTo(pt.x + rand(-rando, rando), pt.y + rand(-rando, rando))
          }
        }
        ctx.strokeStyle = `hsla(${rand(this.hue, this.hue + 30)}, 80%, 55%, ${this.life / 3})`
        ctx.lineWidth = rand(0.1, 2)
        ctx.stroke()
      }
    }

    const gridSize = 30
    let lines: Line[] = []
    let width = 0
    let height = 0
    let tick = 0
    let rafId = 0

    const reset = () => {
      width = Math.ceil(window.innerWidth / 2) * 2
      height = Math.ceil(window.innerHeight / 2) * 2
      tick = 0
      lines = []
      canvas.width = width
      canvas.height = height
    }

    const create = () => {
      if (tick % 10 === 0) {
        lines.push(new Line(width, height, gridSize, tick))
      }
    }

    const step = () => {
      let i = lines.length
      while (i--) {
        lines[i].step(lines, i)
      }
    }

    const clear = () => {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = 'hsla(0, 0%, 0%, 0.1)'
      ctx.fillRect(0, 0, width, height)
      ctx.globalCompositeOperation = 'lighter'
    }

    const draw = () => {
      ctx.save()
      ctx.translate(width / 2, height / 2)
      ctx.rotate(tick * 0.001)
      const scale = 0.8 + Math.cos(tick * 0.02) * 0.2
      ctx.scale(scale, scale)
      ctx.translate(-width / 2, -height / 2)
      let i = lines.length
      while (i--) {
        lines[i].draw()
      }
      ctx.restore()
    }

    const loop = () => {
      rafId = requestAnimationFrame(loop)
      create()
      step()
      clear()
      draw()
      tick++
    }

    const onResize = () => reset()

    reset()
    loop()
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
    }
  }, [reducedMotion])

  if (reducedMotion) {
    return <div className="cyberpunk-lines-bg cyberpunk-lines-bg--static" aria-hidden="true" />
  }

  return <canvas ref={canvasRef} id="cyberpunk-lines-canvas" className="cyberpunk-lines-bg" aria-hidden="true" />
}

export default CyberpunkLinesBackground
