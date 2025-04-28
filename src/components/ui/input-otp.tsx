import * as React from "react"
import { Dot } from "lucide-react"

import { cn } from "@/lib/utils"

// Create a context to manage OTP inputs
export const OTPInputContext = React.createContext({
  slots: [],
  activeSlot: 0,
  setActiveSlot: (index: number) => {}
})

const InputOTP = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & {
    value: string;
    onChange: (value: string) => void;
    maxLength: number;
    containerClassName?: string;
    render?: (props: { slots: any[] }) => React.ReactNode;
  }
>(({ className, containerClassName, value, onChange, maxLength = 6, render, ...props }, ref) => {
  const [activeSlot, setActiveSlot] = React.useState<number>(0)
  
  // Create slots array based on maxLength
  const slots = React.useMemo(() => {
    const characters = value?.split("") || []
    return Array(maxLength)
      .fill(0)
      .map((_, i) => ({
        char: characters[i] || "",
        hasFakeCaret: i === activeSlot,
        isActive: i === activeSlot
      }))
  }, [value, maxLength, activeSlot])

  // Handler for input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/[^0-9]/g, "").substring(0, maxLength)
    onChange(newValue)
    
    // Move active slot to the end or to the first empty slot
    if (newValue.length >= maxLength) {
      setActiveSlot(maxLength - 1)
    } else {
      setActiveSlot(newValue.length)
    }
  }

  // Hidden input to handle actual value
  const inputRef = React.useRef<HTMLInputElement>(null)
  
  const focusInput = () => {
    inputRef.current?.focus()
  }

  return (
    <OTPInputContext.Provider value={{ slots, activeSlot, setActiveSlot }}>
      <div 
        ref={ref} 
        className={cn("relative", className)} 
        onClick={focusInput}
        {...props}
      >
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          className="sr-only"
          value={value}
          onChange={handleInputChange}
        />
        
        <div className={cn("flex items-center gap-2", containerClassName)}>
          {render ? 
            render({ slots }) : 
            slots.map((slot, i) => (
              <div 
                key={i} 
                className={cn(
                  "h-10 w-10 rounded border border-input flex items-center justify-center text-sm transition",
                  slot.isActive && "ring-2 ring-ring"
                )}
              >
                {slot.char}
                {slot.hasFakeCaret && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
                  </div>
                )}
              </div>
            ))
          }
        </div>
      </div>
    </OTPInputContext.Provider>
  )
})
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
))
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => {
  // Use index from props to get the slot data from context
  const index = props['data-index'] || 0
  const { slots } = React.useContext(OTPInputContext)
  
  // Make sure slots exists and has the index we're looking for
  const slot = slots && slots.length > index ? slots[index] : { char: "", hasFakeCaret: false, isActive: false }
  
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center border-y border-r border-input text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        slot.isActive && "z-10 ring-2 ring-ring ring-offset-background",
        className
      )}
      {...props}
    >
      {slot.char}
      {slot.hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Dot />
  </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }