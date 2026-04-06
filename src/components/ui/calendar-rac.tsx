"use client"

import { cn } from "@/lib/utils"
import { getLocalTimeZone, today } from "@internationalized/date"
import { ComponentProps } from "react"
import {
  Button,
  CalendarCell as CalendarCellRac,
  CalendarGridBody as CalendarGridBodyRac,
  CalendarGridHeader as CalendarGridHeaderRac,
  CalendarGrid as CalendarGridRac,
  CalendarHeaderCell as CalendarHeaderCellRac,
  Calendar as CalendarRac,
  Heading as HeadingRac,
  RangeCalendar as RangeCalendarRac,
  composeRenderProps,
} from "react-aria-components"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface BaseCalendarProps {
  className?: string
}

type CalendarProps = ComponentProps<typeof CalendarRac> & BaseCalendarProps
type RangeCalendarProps = ComponentProps<typeof RangeCalendarRac> & BaseCalendarProps

const CalendarHeader = () => (
  <header className="flex w-full items-center gap-1 pb-1">
    <Button
      slot="previous"
      className="flex size-9 items-center justify-center rounded-md text-muted-foreground/80 outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ChevronLeft size={16} />
    </Button>
    <HeadingRac className="grow text-center text-sm font-medium" />
    <Button
      slot="next"
      className="flex size-9 items-center justify-center rounded-md text-muted-foreground/80 outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ChevronRight size={16} />
    </Button>
  </header>
)

const CalendarGridComponent = ({ isRange = false }: { isRange?: boolean }) => {
  const now = today(getLocalTimeZone())

  return (
    <CalendarGridRac>
      <CalendarGridHeaderRac>
        {(day) => (
          <CalendarHeaderCellRac className="size-9 rounded-md text-xs font-medium text-muted-foreground/80">
            {day}
          </CalendarHeaderCellRac>
        )}
      </CalendarGridHeaderRac>
      <CalendarGridBodyRac className="[&_td]:px-0">
        {(date) => (
          <CalendarCellRac
            date={date}
            className={cn(
              "relative flex size-9 items-center justify-center whitespace-nowrap rounded-md border border-transparent p-0 text-sm font-normal text-foreground outline-none",
              "data-[hovered]:bg-accent data-[pressed]:bg-accent",
              "data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:font-medium",
              "data-[unavailable]:pointer-events-none data-[unavailable]:line-through",
              "data-[disabled]:pointer-events-none data-[disabled]:opacity-30",
              "data-[outside-month]:pointer-events-none data-[outside-month]:text-muted-foreground/30",
              "data-[focus-visible]:ring-2 data-[focus-visible]:ring-ring data-[focus-visible]:ring-offset-1",
              date.compare(now) === 0 &&
                "after:pointer-events-none after:absolute after:bottom-1 after:start-1/2 after:z-10 after:size-[3px] after:-translate-x-1/2 after:rounded-full after:bg-primary data-[selected]:after:bg-primary-foreground",
              isRange &&
                "data-[selection-start]:rounded-e-none data-[selection-end]:rounded-s-none data-[selected]:data-[selection-start]:bg-primary data-[selected]:data-[selection-start]:text-primary-foreground data-[selected]:data-[selection-end]:bg-primary data-[selected]:data-[selection-end]:text-primary-foreground data-[selected]:bg-accent data-[selected]:text-foreground data-[selected]:font-normal"
            )}
          />
        )}
      </CalendarGridBodyRac>
    </CalendarGridRac>
  )
}

const Calendar = ({ className, ...props }: CalendarProps) => {
  return (
    <CalendarRac
      {...props}
      className={cn("w-fit", className)}
    >
      <CalendarHeader />
      <CalendarGridComponent />
    </CalendarRac>
  )
}

const RangeCalendar = ({ className, ...props }: RangeCalendarProps) => {
  return (
    <RangeCalendarRac
      {...props}
      className={cn("w-fit", className)}
    >
      <CalendarHeader />
      <CalendarGridComponent isRange />
    </RangeCalendarRac>
  )
}

export { Calendar as RacCalendar, RangeCalendar }
