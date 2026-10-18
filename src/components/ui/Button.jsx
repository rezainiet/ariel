import { Link } from 'react-router-dom'

const base =
  'inline-flex items-center justify-center gap-2 font-semibold tracking-tight rounded-full ' +
  'transition-all duration-200 ease-out select-none ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/60 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ' +
  'disabled:opacity-50 disabled:pointer-events-none active:scale-[0.985]'

const variants = {
  primary: 'bg-forest text-white hover:bg-forest-700 shadow-soft',
  outline: 'border border-forest/25 text-forest bg-transparent hover:bg-sage/50',
  ghost: 'text-forest hover:bg-sage/40',
  sage: 'bg-sage text-forest hover:bg-sage/70',
}

const sizes = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-12 px-6 text-[0.95rem]',
  lg: 'h-14 px-8 text-base',
}

export default function Button({
  as = 'button',
  to,
  href,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}) {
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`

  if (to) {
    return (
      <Link to={to} className={cls} {...props}>
        {children}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} className={cls} {...props}>
        {children}
      </a>
    )
  }
  const Tag = as
  return (
    <Tag className={cls} {...props}>
      {children}
    </Tag>
  )
}
