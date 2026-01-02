import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { get } from '@/api/client';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils/cn';

interface CalendarViewProps {
  entityType: string;
  /** Date field to use for positioning events */
  dateField: string;
  /** Optional end date field for range events */
  endDateField?: string;
  /** Field to use as event title */
  titleField?: string;
  /** Field to use for event color (should be an enum with colors defined) */
  colorField?: string;
  className?: string;
}

interface CalendarRecord {
  id: string;
  [key: string]: unknown;
}

interface ListResponse {
  total: number;
  list: CalendarRecord[];
}

type ViewMode = 'month' | 'week' | 'day';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function CalendarView({
  entityType,
  dateField,
  endDateField: _endDateField,
  titleField = 'name',
  colorField: _colorField,
  className,
}: CalendarViewProps): React.ReactElement {
  // Note: endDateField and colorField are reserved for future enhancements
  void _endDateField;
  void _colorField;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  // Calculate date range for query
  const dateRange = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (viewMode === 'month') {
      // Get first day of month and last day
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      // Extend to include visible days from adjacent months
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - startDate.getDay());

      const endDate = new Date(lastDay);
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

      return { start: startDate, end: endDate };
    }

    if (viewMode === 'week') {
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - startDate.getDay());

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);

      return { start: startDate, end: endDate };
    }

    // Day view
    return { start: currentDate, end: currentDate };
  }, [currentDate, viewMode]);

  // Format dates for API
  const startDateStr = dateRange.start.toISOString().split('T')[0] ?? '';
  const endDateStr = dateRange.end.toISOString().split('T')[0] ?? '';

  // Fetch events
  const { data, isLoading, error } = useQuery<ListResponse, Error>({
    queryKey: ['calendar', entityType, dateField, startDateStr, endDateStr],
    queryFn: async () => {
      // Try with date filter first, fall back to simple query if ACL restricts it
      try {
        const params = new URLSearchParams({
          maxSize: '500',
          orderBy: dateField,
          order: 'asc',
        });

        // Add date filter using greaterThanOrEquals and lessThanOrEquals (more compatible format)
        params.append('where[0][type]', 'greaterThanOrEquals');
        params.append('where[0][attribute]', dateField);
        params.append('where[0][value]', startDateStr);
        params.append('where[1][type]', 'lessThanOrEquals');
        params.append('where[1][attribute]', dateField);
        params.append('where[1][value]', endDateStr + ' 23:59:59');

        const response = await get<ListResponse>(`/${entityType}?${params.toString()}`);
        return response;
      } catch (filterError) {
        // If filtering fails (403 or other error), try without date filter
        console.warn('Calendar date filter failed, fetching all records:', filterError);
        const fallbackParams = new URLSearchParams({
          maxSize: '200',
          orderBy: dateField,
          order: 'desc',
        });
        const response = await get<ListResponse>(`/${entityType}?${fallbackParams.toString()}`);
        return response;
      }
    },
    enabled: !!entityType,
  });

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarRecord[]> = {};

    if (data?.list) {
      for (const record of data.list) {
        const dateValue = record[dateField];
        if (!dateValue) continue;

        const dateStrParts = String(dateValue).split('T');
        const datePart = dateStrParts[0] ?? '';
        const dateStr = datePart.split(' ')[0] ?? datePart;
        if (!dateStr) continue;

        if (!map[dateStr]) {
          map[dateStr] = [];
        }
        map[dateStr].push(record);
      }
    }

    return map;
  }, [data?.list, dateField]);

  // Navigation handlers
  const navigatePrev = useCallback(() => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === 'month') {
        next.setMonth(next.getMonth() - 1);
      } else if (viewMode === 'week') {
        next.setDate(next.getDate() - 7);
      } else {
        next.setDate(next.getDate() - 1);
      }
      return next;
    });
  }, [viewMode]);

  const navigateNext = useCallback(() => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === 'month') {
        next.setMonth(next.getMonth() + 1);
      } else if (viewMode === 'week') {
        next.setDate(next.getDate() + 7);
      } else {
        next.setDate(next.getDate() + 1);
      }
      return next;
    });
  }, [viewMode]);

  const navigateToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
        Error loading events: {error.message}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={navigatePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={navigateToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold ml-4">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-md border">
            {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'px-3 py-1.5 text-sm capitalize',
                  viewMode === mode
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          <Link to={`/${entityType}/create`}>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </Link>
        </div>
      </div>

      {/* Calendar Grid */}
      {viewMode === 'month' && (
        <MonthView
          currentDate={currentDate}
          dateRange={dateRange}
          eventsByDate={eventsByDate}
          entityType={entityType}
          titleField={titleField}
        />
      )}

      {viewMode === 'week' && (
        <WeekView
          currentDate={currentDate}
          dateRange={dateRange}
          eventsByDate={eventsByDate}
          entityType={entityType}
          titleField={titleField}
        />
      )}

      {viewMode === 'day' && (() => {
        const dayKey = currentDate.toISOString().split('T')[0] ?? '';
        return (
          <DayView
            currentDate={currentDate}
            events={eventsByDate[dayKey] ?? []}
            entityType={entityType}
            titleField={titleField}
          />
        );
      })()}
    </div>
  );
}

interface ViewProps {
  currentDate: Date;
  dateRange: { start: Date; end: Date };
  eventsByDate: Record<string, CalendarRecord[]>;
  entityType: string;
  titleField: string;
}

function MonthView({
  currentDate,
  dateRange,
  eventsByDate,
  entityType,
  titleField,
}: ViewProps): React.ReactElement {
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    let week: Date[] = [];
    const current = new Date(dateRange.start);

    while (current <= dateRange.end) {
      week.push(new Date(current));
      if (week.length === 7) {
        result.push(week);
        week = [];
      }
      current.setDate(current.getDate() + 1);
    }

    if (week.length > 0) {
      result.push(week);
    }

    return result;
  }, [dateRange]);

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = currentDate.getMonth();

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 bg-muted/50">
        {DAYS.map((day) => (
          <div key={day} className="px-2 py-3 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Weeks */}
      {weeks.map((week, weekIdx) => (
        <div key={weekIdx} className="grid grid-cols-7 border-t">
          {week.map((date) => {
            const dateStr = date.toISOString().split('T')[0] ?? '';
            const isToday = dateStr === today;
            const isCurrentMonth = date.getMonth() === currentMonth;
            const dayEvents: CalendarRecord[] = eventsByDate[dateStr] ?? [];

            return (
              <div
                key={dateStr}
                className={cn(
                  'min-h-[100px] p-1 border-r last:border-r-0',
                  !isCurrentMonth && 'bg-muted/30'
                )}
              >
                <div
                  className={cn(
                    'text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full',
                    isToday && 'bg-primary text-primary-foreground'
                  )}
                >
                  {date.getDate()}
                </div>

                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event: CalendarRecord) => (
                    <Link
                      key={event.id}
                      to={`/${entityType}/view/${event.id}`}
                      className="block text-xs p-1 rounded bg-primary/10 text-primary truncate hover:bg-primary/20"
                    >
                      {(event[titleField] as string) ?? event.id}
                    </Link>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground px-1">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function WeekView({
  dateRange,
  eventsByDate,
  entityType,
  titleField,
}: ViewProps): React.ReactElement {
  const days = useMemo(() => {
    const result: Date[] = [];
    const current = new Date(dateRange.start);

    while (current <= dateRange.end) {
      result.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return result;
  }, [dateRange]);

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 bg-muted/50">
        {days.map((date) => {
          const dateStr = date.toISOString().split('T')[0];
          const isToday = dateStr === today;

          return (
            <div
              key={dateStr}
              className={cn(
                'px-2 py-3 text-center border-r last:border-r-0',
                isToday && 'bg-primary/10'
              )}
            >
              <div className="text-sm font-medium">{DAYS[date.getDay()]}</div>
              <div
                className={cn(
                  'text-2xl font-bold',
                  isToday && 'text-primary'
                )}
              >
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Events */}
      <div className="grid grid-cols-7 min-h-[400px]">
        {days.map((date) => {
          const dateStr = date.toISOString().split('T')[0] ?? '';
          const dayEvents: CalendarRecord[] = eventsByDate[dateStr] ?? [];

          return (
            <div key={dateStr} className="p-2 border-r last:border-r-0 border-t space-y-1">
              {dayEvents.map((event: CalendarRecord) => (
                <Link
                  key={event.id}
                  to={`/${entityType}/view/${event.id}`}
                  className="block text-sm p-2 rounded bg-primary/10 text-primary hover:bg-primary/20"
                >
                  {(event[titleField] as string) ?? event.id}
                </Link>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface DayViewProps {
  currentDate: Date;
  events: CalendarRecord[];
  entityType: string;
  titleField: string;
}

function DayView({
  currentDate,
  events,
  entityType,
  titleField,
}: DayViewProps): React.ReactElement {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted/50 px-4 py-3 text-center">
        <div className="text-lg font-semibold">
          {DAYS[currentDate.getDay()]}, {MONTHS[currentDate.getMonth()]} {currentDate.getDate()}
        </div>
      </div>

      <div className="divide-y">
        {hours.map((hour) => (
          <div key={hour} className="flex">
            <div className="w-16 px-2 py-4 text-sm text-muted-foreground text-right border-r">
              {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
            </div>
            <div className="flex-1 p-2 min-h-[60px]">
              {/* Events would be positioned here based on time */}
            </div>
          </div>
        ))}
      </div>

      {/* All-day events or events without specific time */}
      {events.length > 0 && (
        <div className="border-t p-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Events</h4>
          <div className="space-y-2">
            {events.map((event) => (
              <Link
                key={event.id}
                to={`/${entityType}/view/${event.id}`}
                className="block p-3 rounded bg-primary/10 text-primary hover:bg-primary/20"
              >
                {(event[titleField] as string) ?? event.id}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarView;
