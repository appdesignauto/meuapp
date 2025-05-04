import * as React from "react"
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type NetflixCarouselProps = {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
  slidesPerView?: number
  spacing?: number
  gradient?: boolean
}

type NetflixCarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
  slidesPerView: number
  spacing: number
  gradient: boolean
} & NetflixCarouselProps

const NetflixCarouselContext = React.createContext<NetflixCarouselContextProps | null>(null)

function useNetflixCarousel() {
  const context = React.useContext(NetflixCarouselContext)

  if (!context) {
    throw new Error("useNetflixCarousel must be used within a <NetflixCarousel />")
  }

  return context
}

export function Carousel({
  orientation = "horizontal",
  opts,
  setApi,
  plugins,
  className,
  children,
  slidesPerView = 3,
  spacing = 16,
  gradient = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & NetflixCarouselProps) {
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === "horizontal" ? "x" : "y",
      slidesToScroll: 1,
    },
    plugins
  )
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

  const onSelect = React.useCallback((api: CarouselApi) => {
    if (!api) {
      return
    }

    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())
  }, [])

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev()
  }, [api])

  const scrollNext = React.useCallback(() => {
    api?.scrollNext()
  }, [api])

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        scrollPrev()
      } else if (event.key === "ArrowRight") {
        event.preventDefault()
        scrollNext()
      }
    },
    [scrollPrev, scrollNext]
  )

  React.useEffect(() => {
    if (!api || !setApi) {
      return
    }

    setApi(api)
  }, [api, setApi])

  React.useEffect(() => {
    if (!api) {
      return
    }

    onSelect(api)
    api.on("reInit", onSelect)
    api.on("select", onSelect)

    return () => {
      api?.off("select", onSelect)
    }
  }, [api, onSelect])

  return (
    <NetflixCarouselContext.Provider
      value={{
        carouselRef,
        api: api,
        opts,
        orientation: orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
        slidesPerView,
        spacing,
        gradient
      }}
    >
      <div
        onKeyDownCapture={handleKeyDown}
        className={cn("relative group", className)}
        role="region"
        aria-roledescription="carousel"
        {...props}
      >
        {children}
        
        {/* Gradientes para indicar mais conteúdo */}
        {gradient && (
          <>
            {canScrollPrev && (
              <div className="absolute top-0 left-0 bottom-0 w-16 bg-gradient-to-r from-black/80 to-transparent z-10 pointer-events-none" />
            )}
            {canScrollNext && (
              <div className="absolute top-0 right-0 bottom-0 w-16 bg-gradient-to-l from-black/80 to-transparent z-10 pointer-events-none" />
            )}
          </>
        )}
        
        {/* Botões de navegação */}
        <button
          className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white z-20 transition-opacity duration-300",
            !canScrollPrev ? "opacity-0 cursor-default" : "opacity-0 group-hover:opacity-100"
          )}
          disabled={!canScrollPrev}
          onClick={scrollPrev}
        >
          <ArrowLeft className="h-6 w-6" />
          <span className="sr-only">Anterior</span>
        </button>
        
        <button
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white z-20 transition-opacity duration-300",
            !canScrollNext ? "opacity-0 cursor-default" : "opacity-0 group-hover:opacity-100"
          )}
          disabled={!canScrollNext}
          onClick={scrollNext}
        >
          <ArrowRight className="h-6 w-6" />
          <span className="sr-only">Próximo</span>
        </button>
      </div>
    </NetflixCarouselContext.Provider>
  )
}

export const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { carouselRef, orientation, slidesPerView, spacing } = useNetflixCarousel()
  
  // Calcular o estilo baseado em slidesPerView e spacing
  const gapStyle = {
    gap: `${spacing}px`
  }

  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === "horizontal" ? "flex-row" : "flex-col",
          className
        )}
        style={gapStyle}
        {...props}
      />
    </div>
  )
})
CarouselContent.displayName = "CarouselContent"

export const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { orientation, slidesPerView } = useNetflixCarousel()
  
  // Calcular a largura baseada em slidesPerView
  const flexBasis = `${100 / slidesPerView}%`
  const itemStyle = {
    flexBasis,
    flexGrow: 0,
    flexShrink: 0,
  }

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn(
        "min-w-0",
        className
      )}
      style={itemStyle}
      {...props}
    />
  )
})
CarouselItem.displayName = "CarouselItem"