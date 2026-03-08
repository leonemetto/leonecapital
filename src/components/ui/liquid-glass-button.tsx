"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const liquidbuttonVariants = cva(
  "inline-flex items-center transition-colors justify-center cursor-pointer gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-transparent hover:scale-105 duration-300 transition text-primary",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 text-xs gap-1.5 px-4 has-[>svg]:px-4",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        xl: "h-12 rounded-md px-8 has-[>svg]:px-6",
        xxl: "h-14 rounded-md px-10 has-[>svg]:px-8",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "xxl",
    },
  }
)

function GlassFilter() {
  return (
    <svg className="absolute inset-0 h-full w-full">
      <defs>
        <filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02 0.05"
            numOctaves="3"
            seed="5"
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="1" result="blurredNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurredNoise"
            scale="10"
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />
          <feGaussianBlur in="displaced" stdDeviation="0.5" result="finalBlur" />
          <feMerge>
            <feMergeNode in="finalBlur" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  )
}

interface LiquidButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof liquidbuttonVariants> {
  asChild?: boolean
}

function LiquidButton({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}: LiquidButtonProps) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      className={cn(
        "group relative overflow-hidden rounded-xl",
        liquidbuttonVariants({ variant, size, className })
      )}
      {...props}
    >
      <GlassFilter />
      
      {/* Glass background */}
      <span className="absolute inset-0 rounded-xl bg-background/60 backdrop-blur-xl" />
      
      {/* Border glow */}
      <span className="absolute inset-0 rounded-xl border border-primary/20 group-hover:border-primary/40 transition-colors" />
      
      {/* Inner highlight */}
      <span className="absolute inset-[1px] rounded-[11px] bg-gradient-to-b from-primary/10 to-transparent" />
      
      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
      
      {/* Hover shine effect */}
      <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
    </Comp>
  )
}

type ColorVariant =
  | "default"
  | "primary"
  | "success"
  | "error"
  | "gold"
  | "bronze"

interface MetalButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ColorVariant
}

const colorVariants: Record<
  ColorVariant,
  {
    outer: string
    inner: string
    button: string
    textColor: string
    textShadow: string
  }
> = {
  default: {
    outer: "bg-gradient-to-b from-[hsl(0,0%,0%)] to-[hsl(0,0%,63%)]",
    inner: "bg-gradient-to-b from-[hsl(0,0%,98%)] via-[hsl(0,0%,24%)] to-[hsl(0,0%,90%)]",
    button: "bg-gradient-to-b from-[hsl(0,0%,73%)] to-[hsl(0,0%,59%)]",
    textColor: "text-primary-foreground",
    textShadow: "[text-shadow:_0_-1px_0_hsl(0,0%,31%)]",
  },
  primary: {
    outer: "bg-gradient-to-b from-[hsl(0,0%,0%)] to-[hsl(0,0%,63%)]",
    inner: "bg-gradient-to-b from-primary via-secondary to-muted",
    button: "bg-gradient-to-b from-primary to-primary/40",
    textColor: "text-primary-foreground",
    textShadow: "[text-shadow:_0_-1px_0_hsl(var(--primary))]",
  },
  success: {
    outer: "bg-gradient-to-b from-[hsl(162,100%,18%)] to-[hsl(145,50%,64%)]",
    inner: "bg-gradient-to-b from-[hsl(152,60%,94%)] via-[hsl(172,100%,10%)] to-[hsl(152,60%,90%)]",
    button: "bg-gradient-to-b from-[hsl(160,50%,73%)] to-[hsl(165,40%,40%)]",
    textColor: "text-primary-foreground",
    textShadow: "[text-shadow:_0_-1px_0_hsl(160,86%,16%)]",
  },
  error: {
    outer: "bg-gradient-to-b from-[hsl(0,100%,18%)] to-[hsl(359,100%,84%)]",
    inner: "bg-gradient-to-b from-[hsl(0,100%,93%)] via-[hsl(359,100%,20%)] to-[hsl(0,100%,95%)]",
    button: "bg-gradient-to-b from-[hsl(359,75%,75%)] to-[hsl(359,35%,48%)]",
    textColor: "text-primary-foreground",
    textShadow: "[text-shadow:_0_-1px_0_hsl(30,92%,31%)]",
  },
  gold: {
    outer: "bg-gradient-to-b from-[hsl(48,100%,28%)] to-[hsl(47,68%,73%)]",
    inner: "bg-gradient-to-b from-[hsl(60,100%,93%)] via-[hsl(48,90%,27%)] to-[hsl(50,100%,85%)]",
    button: "bg-gradient-to-b from-[hsl(48,100%,82%)] to-[hsl(45,43%,43%)]",
    textColor: "text-primary-foreground",
    textShadow: "[text-shadow:_0_-1px_0_hsl(49,99%,35%)]",
  },
  bronze: {
    outer: "bg-gradient-to-b from-[hsl(26,75%,30%)] to-[hsl(26,65%,72%)]",
    inner: "bg-gradient-to-b from-[hsl(26,60%,78%)] via-[hsl(26,100%,19%)] to-[hsl(26,100%,88%)]",
    button: "bg-gradient-to-b from-[hsl(26,100%,90%)] to-[hsl(26,50%,44%)]",
    textColor: "text-primary-foreground",
    textShadow: "[text-shadow:_0_-1px_0_hsl(21,75%,28%)]",
  },
}

const metalButtonVariants = (
  variant: ColorVariant = "default",
  isPressed: boolean,
  isHovered: boolean,
  isTouchDevice: boolean
) => {
  const colors = colorVariants[variant]
  const transitionStyle = "all 250ms cubic-bezier(0.1, 0.4, 0.2, 1)"

  return {
    wrapper: cn(
      "relative inline-flex transform-gpu rounded-md p-[1.25px] will-change-transform",
      colors.outer
    ),
    wrapperStyle: {
      transform: isPressed
        ? "translateY(2.5px) scale(0.99)"
        : "translateY(0) scale(1)",
      boxShadow: isPressed
        ? "0 1px 2px rgba(0, 0, 0, 0.15)"
        : isHovered && !isTouchDevice
          ? "0 4px 12px rgba(0, 0, 0, 0.12)"
          : "0 3px 8px rgba(0, 0, 0, 0.08)",
      transition: transitionStyle,
      transformOrigin: "center center",
    },
    inner: cn(
      "absolute inset-[1px] transform-gpu rounded-lg will-change-transform",
      colors.inner
    ),
    innerStyle: {
      transition: transitionStyle,
      transformOrigin: "center center",
      filter:
        isHovered && !isPressed && !isTouchDevice ? "brightness(1.05)" : "none",
    },
    button: cn(
      "relative z-10 m-[1px] rounded-md inline-flex h-11 transform-gpu cursor-pointer items-center justify-center overflow-hidden px-6 py-2 text-sm leading-none font-semibold will-change-transform outline-none",
      colors.button,
      colors.textColor,
      colors.textShadow
    ),
    buttonStyle: {
      transform: isPressed ? "scale(0.97)" : "scale(1)",
      transition: transitionStyle,
      transformOrigin: "center center",
      filter:
        isHovered && !isPressed && !isTouchDevice ? "brightness(1.02)" : "none",
    },
  }
}

const ShineEffect = ({ isPressed }: { isPressed: boolean }) => {
  return (
    <span
      className="pointer-events-none absolute inset-0 rounded-md"
      style={{
        background: isPressed
          ? "none"
          : "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
        opacity: isPressed ? 0 : 1,
        transition: "opacity 200ms ease",
      }}
    />
  )
}

const MetalButton = React.forwardRef<HTMLButtonElement, MetalButtonProps>(
  ({ children, className, variant = "default", ...props }, ref) => {
    const [isPressed, setIsPressed] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)
    const [isTouchDevice, setIsTouchDevice] = React.useState(false)

    React.useEffect(() => {
      setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0)
    }, [])

    const buttonText = children || "Button"
    const variants = metalButtonVariants(
      variant,
      isPressed,
      isHovered,
      isTouchDevice
    )

    return (
      <span
        className={cn(variants.wrapper, className)}
        style={variants.wrapperStyle}
      >
        <span className={variants.inner} style={variants.innerStyle} />
        <button
          ref={ref}
          className={variants.button}
          style={variants.buttonStyle}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          onMouseLeave={() => {
            setIsPressed(false)
            setIsHovered(false)
          }}
          onMouseEnter={() => !isTouchDevice && setIsHovered(true)}
          onTouchStart={() => setIsPressed(true)}
          onTouchEnd={() => setIsPressed(false)}
          onTouchCancel={() => setIsPressed(false)}
          {...props}
        >
          <ShineEffect isPressed={isPressed} />
          {buttonText}
          {isHovered && !isPressed && !isTouchDevice && (
            <span className="pointer-events-none absolute inset-0 animate-pulse rounded-md bg-white/5" />
          )}
        </button>
      </span>
    )
  }
)

MetalButton.displayName = "MetalButton"

export { LiquidButton, liquidbuttonVariants, MetalButton }
