import React from 'react'

type TechLabelTone = 'primary' | 'secondary'

interface TechLabelProps {
  text: string
  tone?: TechLabelTone
  blink?: boolean
  className?: string
  as?: 'span' | 'div' | 'p'
}

const toneClassByValue: Record<TechLabelTone, string> = {
  primary: 'tech-label--primary',
  secondary: 'tech-label--secondary',
}

const TechLabel: React.FC<TechLabelProps> = ({
  text,
  tone = 'primary',
  blink = false,
  className = '',
  as = 'span',
}) => {
  const Component = as

  return (
    <Component
      className={`tech-label ${toneClassByValue[tone]} ${blink ? 'tech-blink' : ''} ${className}`.trim()}
    >
      {text}
    </Component>
  )
}

export default TechLabel
