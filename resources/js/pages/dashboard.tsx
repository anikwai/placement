import StudentPlacementsTable, {
    type StudentPlacementsTableProps,
} from '@/components/student-placements-table';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useIsMobile } from '@/hooks/use-mobile';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { download as placementsDownload } from '@/routes/placements';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { CalendarDays, Download } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { type DateRange } from 'react-day-picker';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Label,
    Pie,
    PieChart,
    XAxis,
    YAxis,
} from 'recharts';

interface Stats {
    totalStudents: number;
    feederSchools: number;
    placementSchools: number;
    maleCount: number;
    femaleCount: number;
}

interface SchoolData {
    feeder_school_name?: string;
    year_7_placement_school_name?: string;
    student_count: number;
}

interface Props {
    stats?: Stats;
    topFeederSchools?: SchoolData[];
    topPlacementSchools?: SchoolData[];
    placements?: StudentPlacementsTableProps['placements'];
    placementFilters: StudentPlacementsTableProps['filters'];
    placementStats?: StudentPlacementsTableProps['stats'];
    academicYears: StudentPlacementsTableProps['academicYears'];
    dateRangeBounds: { from: string | null; to: string | null };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface AxisTickProps {
    x?: number;
    y?: number;
    payload?: { value?: string };
}

function truncateLabel(value: string, maxLength: number): string {
    if (value.length <= maxLength) {
        return value;
    }

    return `${value.slice(0, Math.max(0, maxLength - 1))}…`;
}

function splitLabelIntoTwoLines(value: string): {
    line1: string;
    line2: string | null;
} {
    const trimmed = value.trim();

    if (trimmed === '') {
        return { line1: '', line2: null };
    }

    const words = trimmed.split(/\s+/).filter(Boolean);

    if (words.length <= 1) {
        return { line1: truncateLabel(trimmed, 20), line2: null };
    }

    const maxLine1 = 18;
    const maxLine2 = 20;
    const line1Words: string[] = [];
    const line2Words: string[] = [];

    for (const word of words) {
        const nextLine1 = [...line1Words, word].join(' ').trim();

        if (line1Words.length === 0 || nextLine1.length <= maxLine1) {
            line1Words.push(word);
            continue;
        }

        line2Words.push(word);
    }

    if (line2Words.length === 0) {
        return { line1: truncateLabel(trimmed, 20), line2: null };
    }

    return {
        line1: line1Words.join(' '),
        line2: truncateLabel(line2Words.join(' '), maxLine2),
    };
}

function PlacementSchoolTick({
    x = 0,
    y = 0,
    payload,
    isMobile = false,
}: AxisTickProps & { isMobile?: boolean }) {
    const value = payload?.value ?? '';
    const { line1, line2 } = isMobile
        ? { line1: truncateLabel(value, 12), line2: null }
        : splitLabelIntoTwoLines(value);

    return (
        <g transform={`translate(${x},${y})`}>
            <text
                textAnchor={isMobile ? 'end' : 'middle'}
                fill="var(--color-muted-foreground)"
                fontSize={11}
                fontWeight={500}
                transform={isMobile ? 'rotate(-35)' : undefined}
            >
                <title>{value}</title>
                <tspan x={0} dy={18}>
                    {line1}
                </tspan>
                {!isMobile && line2 ? (
                    <tspan x={0} dy={14}>
                        {line2}
                    </tspan>
                ) : null}
            </text>
        </g>
    );
}

export default function Dashboard({
    stats,
    topFeederSchools,
    topPlacementSchools,
    placements,
    placementFilters,
    placementStats,
    academicYears,
    dateRangeBounds,
}: Props) {
    const { auth } = usePage<SharedData>().props;
    const isMobile = useIsMobile();
    const firstName = auth.user.name.split(' ')[0] ?? auth.user.name;
    const greeting = (() => {
        const hour = new Date().getHours();

        if (hour < 12) {
            return 'Good morning';
        }

        if (hour < 18) {
            return 'Good afternoon';
        }

        return 'Good evening';
    })();

    const safeStats: Stats = stats ?? {
        totalStudents: 0,
        feederSchools: 0,
        placementSchools: 0,
        maleCount: 0,
        femaleCount: 0,
    };

    const safeTopFeederSchools = topFeederSchools ?? [];
    const safeTopPlacementSchools = topPlacementSchools ?? [];
    const safePlacementStats = placementStats ?? {
        total_students: 0,
        feeder_schools: 0,
        placement_schools: 0,
    };
    const safePlacements =
        placements ??
        ({
            data: [],
            current_page: 1,
            last_page: 1,
            per_page: placementFilters.per_page,
            total: 0,
            from: 0,
            to: 0,
            links: [],
        } as StudentPlacementsTableProps['placements']);

    const isDeferredLoading =
        !stats ||
        !topFeederSchools ||
        !topPlacementSchools ||
        !placements ||
        !placementStats;

    const [datePopoverOpen, setDatePopoverOpen] = useState(false);
    const [topPlacementView, setTopPlacementView] = useState<'graph' | 'table'>(
        'graph',
    );
    const [activeTopPlacementIndex, setActiveTopPlacementIndex] = useState<
        number | null
    >(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const isRefreshingRef = useRef(false);
    const refreshShowTimeoutRef = useRef<number | null>(null);
    const refreshHideTimeoutRef = useRef<number | null>(null);
    const refreshStartedAtRef = useRef<number | null>(null);
    const pendingRefreshUrlRef = useRef<string | null>(null);
    const prefetchingUrlsRef = useRef<Set<string>>(new Set());
    const isLoading = isRefreshing || isDeferredLoading;
    const highlightedTopPlacementIndex = activeTopPlacementIndex ?? 0;

    const malePercent = safeStats.totalStudents
        ? (safeStats.maleCount / safeStats.totalStudents) * 100
        : 0;
    const femalePercent = safeStats.totalStudents
        ? (safeStats.femaleCount / safeStats.totalStudents) * 100
        : 0;

    const genderData = [
        {
            name: 'male',
            label: 'Male',
            value: safeStats.maleCount,
            fill: 'var(--color-chart-1)',
        },
        {
            name: 'female',
            label: 'Female',
            value: safeStats.femaleCount,
            fill: 'var(--color-chart-2)',
        },
    ];

    useEffect(() => {
        isRefreshingRef.current = isRefreshing;
    }, [isRefreshing]);

	    useEffect(() => {
	        const normalizeUrl = (url: string): string => {
	            if (typeof window === 'undefined') {
	                return url;
	            }

            try {
                const parsed = new URL(url, window.location.origin);
                return `${parsed.pathname}${parsed.search}`;
            } catch {
                return url;
	            }
	        };

	        const urlFromEvent = (event: unknown): string | null => {
	            if (typeof event !== 'object' || event === null) {
	                return null;
	            }

	            const detail =
	                'detail' in event && typeof event.detail === 'object'
	                    ? event.detail
	                    : null;

	            if (!detail) {
	                return null;
	            }

	            const pageUrl =
	                'page' in detail &&
	                typeof detail.page === 'object' &&
	                detail.page !== null &&
	                'url' in detail.page &&
	                typeof detail.page.url === 'string'
	                    ? detail.page.url
	                    : null;

	            const visitUrl =
	                'visit' in detail &&
	                typeof detail.visit === 'object' &&
	                detail.visit !== null &&
	                'url' in detail.visit &&
	                typeof detail.visit.url === 'string'
	                    ? detail.visit.url
	                    : null;

	            const url = pageUrl ?? visitUrl;

	            if (!url) {
	                return null;
	            }

	            return normalizeUrl(url);
	        };

	        const isPrefetchVisitEvent = (event: unknown): boolean => {
	            if (typeof event !== 'object' || event === null) {
	                return false;
	            }

	            const detail =
	                'detail' in event && typeof event.detail === 'object'
	                    ? (event.detail as Record<string, unknown>)
	                    : null;

	            if (!detail) {
	                return false;
	            }

	            const visit =
	                'visit' in detail && typeof detail.visit === 'object'
	                    ? (detail.visit as Record<string, unknown>)
	                    : null;

	            if (!visit) {
	                return false;
	            }

	            if ('prefetch' in visit && visit.prefetch === true) {
	                return true;
	            }

	            const rawHeaders =
	                'headers' in visit && typeof visit.headers === 'object'
	                    ? (visit.headers as Record<string, unknown>)
	                    : null;

	            if (!rawHeaders) {
	                return false;
	            }

	            if ('get' in rawHeaders && typeof rawHeaders.get === 'function') {
	                const purpose =
	                    (rawHeaders.get('Purpose') ??
	                        rawHeaders.get('purpose')) as unknown;

	                return purpose === 'prefetch';
	            }

	            const purpose =
	                (rawHeaders.Purpose ?? rawHeaders.purpose) as unknown;

	            return purpose === 'prefetch';
	        };

	        const removePrefetchingListener = router.on('prefetching', (event) => {
	            const url = urlFromEvent(event);

	            if (!url) {
	                return;
	            }

	            prefetchingUrlsRef.current.add(url);

                if (
                    pendingRefreshUrlRef.current === url &&
                    refreshShowTimeoutRef.current
                ) {
                    window.clearTimeout(refreshShowTimeoutRef.current);
                    refreshShowTimeoutRef.current = null;
                }

                if (pendingRefreshUrlRef.current === url && isRefreshingRef.current) {
                    if (refreshHideTimeoutRef.current) {
                        window.clearTimeout(refreshHideTimeoutRef.current);
                        refreshHideTimeoutRef.current = null;
                    }

                    refreshStartedAtRef.current = null;
                    pendingRefreshUrlRef.current = null;
                    isRefreshingRef.current = false;
                    setIsRefreshing(false);
                }

	            window.setTimeout(() => {
	                prefetchingUrlsRef.current.delete(url);
	            }, 5000);
	        });

	        const removePrefetchedListener = router.on('prefetched', (event) => {
	            const url = urlFromEvent(event);

	            if (!url) {
	                return;
	            }

	            prefetchingUrlsRef.current.delete(url);
	        });

	        const removeStartListener = router.on('start', (event) => {
	            if (isPrefetchVisitEvent(event)) {
	                return;
	            }

	            const url = urlFromEvent(event);

	            if (!url) {
	                return;
	            }

	            if (url && prefetchingUrlsRef.current.has(url)) {
	                return;
	            }

            if (refreshShowTimeoutRef.current) {
                window.clearTimeout(refreshShowTimeoutRef.current);
                refreshShowTimeoutRef.current = null;
            }

            if (refreshHideTimeoutRef.current) {
                window.clearTimeout(refreshHideTimeoutRef.current);
                refreshHideTimeoutRef.current = null;
            }

            pendingRefreshUrlRef.current = url;

            refreshShowTimeoutRef.current = window.setTimeout(() => {
                refreshShowTimeoutRef.current = null;
                refreshStartedAtRef.current = Date.now();
                isRefreshingRef.current = true;
                setIsRefreshing(true);
            }, 150);
        });

        const removeFinishListener = router.on('finish', () => {
            if (refreshShowTimeoutRef.current && refreshStartedAtRef.current === null) {
                window.clearTimeout(refreshShowTimeoutRef.current);
                refreshShowTimeoutRef.current = null;
                pendingRefreshUrlRef.current = null;
                return;
            }

            if (refreshStartedAtRef.current === null) {
                return;
            }

            if (refreshShowTimeoutRef.current) {
                window.clearTimeout(refreshShowTimeoutRef.current);
                refreshShowTimeoutRef.current = null;
            }

            const minVisibleMs = 250;
            const startedAt = refreshStartedAtRef.current ?? Date.now();
            const elapsed = Date.now() - startedAt;
            const remaining = Math.max(0, minVisibleMs - elapsed);

            refreshStartedAtRef.current = null;
            pendingRefreshUrlRef.current = null;

            if (remaining === 0) {
                isRefreshingRef.current = false;
                setIsRefreshing(false);
                return;
            }

            refreshHideTimeoutRef.current = window.setTimeout(() => {
                refreshHideTimeoutRef.current = null;
                isRefreshingRef.current = false;
                setIsRefreshing(false);
            }, remaining);
        });

	        return () => {
	            removePrefetchingListener();
	            removePrefetchedListener();
	            removeStartListener();
	            removeFinishListener();

            if (refreshShowTimeoutRef.current) {
                window.clearTimeout(refreshShowTimeoutRef.current);
                refreshShowTimeoutRef.current = null;
            }

            if (refreshHideTimeoutRef.current) {
                window.clearTimeout(refreshHideTimeoutRef.current);
                refreshHideTimeoutRef.current = null;
            }

	            refreshStartedAtRef.current = null;
                pendingRefreshUrlRef.current = null;
                isRefreshingRef.current = false;
	        };
	    }, []);

    const initialDateRange = useMemo<DateRange | undefined>(() => {
        const fromString = placementFilters.from || dateRangeBounds.from;
        const toString = placementFilters.to || dateRangeBounds.to;

        if (!fromString || !toString) {
            return undefined;
        }

        return {
            from: parseISO(fromString),
            to: parseISO(toString),
        };
    }, [
        dateRangeBounds.from,
        dateRangeBounds.to,
        placementFilters.from,
        placementFilters.to,
    ]);

    const [dateRange, setDateRange] = useState<DateRange | undefined>(
        initialDateRange,
    );

    useEffect(() => {
        setDateRange(initialDateRange);
    }, [initialDateRange]);

    const dateLabel = useMemo(() => {
        const fromString = placementFilters.from || dateRangeBounds.from;
        const toString = placementFilters.to || dateRangeBounds.to;

        if (!fromString || !toString) {
            return 'All time';
        }

        const from = parseISO(fromString);
        const to = parseISO(toString);

        return `${format(from, 'dd MMM yyyy')} - ${format(to, 'dd MMM yyyy')}`;
    }, [
        dateRangeBounds.from,
        dateRangeBounds.to,
        placementFilters.from,
        placementFilters.to,
    ]);

    const applyDateRange = (range: DateRange | undefined) => {
        router.get(
            dashboard().url,
            {
                search: placementFilters.search || undefined,
                per_page: placementFilters.per_page,
                academic_year: placementFilters.academic_year || undefined,
                from: range?.from
                    ? format(range.from, 'yyyy-MM-dd')
                    : undefined,
                to: range?.to ? format(range.to, 'yyyy-MM-dd') : undefined,
            },
            { preserveScroll: true, preserveState: true },
        );
    };

    const downloadUrl = useMemo(() => {
        return placementsDownload.url({
            query: {
                search: placementFilters.search || undefined,
                academic_year: placementFilters.academic_year || undefined,
                from: placementFilters.from || undefined,
                to: placementFilters.to || undefined,
            },
        });
    }, [
        placementFilters.academic_year,
        placementFilters.from,
        placementFilters.search,
        placementFilters.to,
    ]);

    const chartConfig = {
        students: {
            label: 'Students',
            color: 'var(--color-primary)',
        },
    } satisfies ChartConfig;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="min-h-screen bg-background font-sans text-foreground antialiased">
                <div className="flex flex-col gap-6 bg-background p-4 text-foreground md:p-6">
                    {/* Header */}
	                    <div className="flex items-start justify-between gap-4 sm:items-center">
	                        <div className="min-w-0">
	                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
	                                Dashboard
	                            </h1>
	                            <p className="mt-1 text-sm text-muted-foreground">
	                                {greeting},{' '}
	                                <span className="font-medium text-foreground">
	                                    {firstName}
                                </span>
                                . Overview of Year 7 student placements
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Popover
                                open={datePopoverOpen}
                                onOpenChange={setDatePopoverOpen}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground sm:h-8 sm:w-auto sm:px-3"
                                        aria-label="Choose date range"
                                    >
                                        <CalendarDays className="h-4 w-4 sm:mr-2" />
                                        <span className="hidden truncate sm:inline">
                                            {dateLabel}
                                        </span>
                                    </Button>
	                                </PopoverTrigger>
	                                <PopoverContent
	                                    align="end"
	                                    side="bottom"
	                                    sideOffset={8}
	                                    collisionPadding={16}
	                                    className={
	                                        isMobile
	                                            ? 'w-[calc(100vw-2rem)] max-w-sm p-0'
	                                            : 'w-auto p-0'
	                                    }
	                                >
	                                    <div className="p-3">
	                                        <Calendar
	                                            mode="range"
	                                            numberOfMonths={isMobile ? 1 : 2}
                                            selected={dateRange}
                                            defaultMonth={dateRange?.from}
                                            onSelect={(range) => {
                                                setDateRange(range);

                                                if (range?.from && range?.to) {
                                                    setDatePopoverOpen(false);
                                                    applyDateRange(range);
                                                }
                                            }}
	                                            className="w-full rounded-lg border shadow-sm"
	                                        />
                                        <div className="mt-3 flex items-center justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                type="button"
                                                onClick={() => {
                                                    setDateRange(undefined);
                                                    setDatePopoverOpen(false);
                                                    applyDateRange(undefined);
                                                }}
                                                disabled={
                                                    !placementFilters.from &&
                                                    !placementFilters.to
                                                }
                                            >
                                                Clear
                                            </Button>
                                            <Button
                                                size="sm"
                                                type="button"
                                                onClick={() => {
                                                    setDatePopoverOpen(false);
                                                    applyDateRange(dateRange);
                                                }}
                                                disabled={
                                                    !dateRange?.from ||
                                                    !dateRange?.to
                                                }
                                            >
                                                Apply
                                            </Button>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <Button
                                variant="outline"
                                size="icon"
                                className="border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground sm:h-8 sm:w-auto sm:px-3"
                                onClick={() => {
                                    window.location.assign(downloadUrl);
                                }}
                                aria-label="Download placements"
                            >
                                <Download className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">
                                    Download
                                </span>
                            </Button>
                        </div>
                    </div>

                    {/* Top Row: Main Chart + Stats */}
                    <div className="grid gap-4 lg:grid-cols-3">
                        {/* Main Chart (2/3 width) */}
                        <Card className="lg:col-span-2 border-border bg-card text-card-foreground shadow-sm">
                            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle className="text-lg font-bold text-foreground">
                                        Top Placement Schools
                                    </CardTitle>
                                    <CardDescription className="text-muted-foreground">
                                        Schools receiving the most students
                                    </CardDescription>
                                </div>
                                <div className="flex gap-1 rounded-lg border border-border/50 bg-muted/50 p-1">
                                    <button
                                        type="button"
                                        className={
                                            topPlacementView === 'graph'
                                                ? 'rounded border border-border/50 bg-background/50 px-3 py-1 text-xs font-medium text-foreground shadow-sm'
                                                : 'cursor-pointer rounded px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-background/30 hover:text-foreground'
                                        }
                                        onClick={() =>
                                            setTopPlacementView('graph')
                                        }
                                    >
                                        Graph
                                    </button>
                                    <button
                                        type="button"
                                        className={
                                            topPlacementView === 'table'
                                                ? 'rounded border border-border/50 bg-background/50 px-3 py-1 text-xs font-medium text-foreground shadow-sm'
                                                : 'cursor-pointer rounded px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-background/30 hover:text-foreground'
                                        }
                                        onClick={() =>
                                            setTopPlacementView('table')
                                        }
                                    >
                                        Table
                                    </button>
                                </div>
                            </CardHeader>
                            <CardContent
                                className={
                                    topPlacementView === 'graph'
                                        ? 'pl-0'
                                        : 'p-0'
                                }
                            >
                                {isLoading ? (
                                    <div className="p-6">
                                        <div className="flex h-[350px] items-end justify-between gap-4">
                                            {Array.from({ length: 5 }).map(
                                                (_, index) => (
                                                    <Skeleton
                                                        key={index}
                                                        className="w-12"
                                                        style={{
                                                            height: `${180 + index * 30}px`,
                                                        }}
                                                    />
                                                ),
                                            )}
                                        </div>
                                    </div>
                                ) : topPlacementView === 'graph' ? (
                                    <ChartContainer
                                        config={chartConfig}
                                        className="h-[340px] w-full aspect-auto sm:h-[300px]"
                                    >
	                                        <BarChart
	                                            accessibilityLayer
	                                            data={safeTopPlacementSchools}
	                                            margin={{
	                                                left: 20,
	                                                right: 20,
	                                                top: 20,
	                                                bottom: isMobile ? 16 : 36,
	                                            }}
	                                        >
                                            <defs>
                                                <linearGradient
                                                    id="colorStudent"
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="5%"
                                                        stopColor="var(--color-chart-1)"
                                                        stopOpacity={0.9}
                                                    />
                                                    <stop
                                                        offset="95%"
                                                        stopColor="var(--color-chart-1)"
                                                        stopOpacity={0.12}
                                                    />
                                                </linearGradient>
                                                <linearGradient
                                                    id="colorStudentActive"
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="5%"
                                                        stopColor="var(--color-primary)"
                                                        stopOpacity={0.95}
                                                    />
                                                    <stop
                                                        offset="95%"
                                                        stopColor="var(--color-primary)"
                                                        stopOpacity={0.22}
                                                    />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid
                                                vertical={false}
                                                stroke="var(--color-border)"
                                                strokeOpacity={0.1}
                                                strokeDasharray="3 3"
                                            />
	                                            <XAxis
	                                                dataKey="year_7_placement_school_name"
	                                                tickLine={false}
	                                                tickMargin={isMobile ? 0 : 14}
	                                                axisLine={false}
	                                                tick={
	                                                    isMobile ? false : (
	                                                        <PlacementSchoolTick />
	                                                    )
	                                                }
	                                                label={
	                                                    isMobile
	                                                        ? {
	                                                              value: 'Schools',
	                                                              position:
	                                                                  'insideBottom',
	                                                              offset: 0,
	                                                              fill: 'var(--color-muted-foreground)',
	                                                              fontSize: 11,
	                                                              fontWeight: 600,
	                                                          }
	                                                        : undefined
	                                                }
	                                                interval={0}
	                                                height={isMobile ? 22 : 56}
	                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tickMargin={10}
                                                tick={{
                                                    fill: 'var(--color-muted-foreground)',
                                                    fontSize: 11,
                                                }}
                                            />
                                            <ChartTooltip
                                                cursor={{
                                                    fill: 'var(--color-muted)',
                                                }}
                                                content={
                                                    <ChartTooltipContent />
                                                }
                                            />
                                            <Bar
                                                dataKey="student_count"
                                                fill="url(#colorStudent)"
                                                radius={[6, 6, 0, 0]}
                                                barSize={isMobile ? 20 : 32}
                                                onMouseLeave={() =>
                                                    setActiveTopPlacementIndex(
                                                        null,
                                                    )
                                                }
                                                onMouseEnter={(_, index) =>
                                                    setActiveTopPlacementIndex(
                                                        index,
                                                    )
                                                }
                                            >
                                                {safeTopPlacementSchools.map(
                                                    (_, index) => (
                                                        <Cell
                                                            key={`placement-bar-${index}`}
                                                            fill={
                                                                index ===
                                                                    highlightedTopPlacementIndex
                                                                    ? 'url(#colorStudentActive)'
                                                                    : 'url(#colorStudent)'
                                                            }
                                                            stroke="transparent"
                                                            strokeWidth={0}
                                                            opacity={
                                                                index ===
                                                                    highlightedTopPlacementIndex
                                                                    ? 1
                                                                    : 1
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </Bar>
                                        </BarChart>
                                    </ChartContainer>
                                ) : (
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow className="hover:bg-muted/30">
                                                <TableHead className="w-14 px-6">
                                                    #
                                                </TableHead>
                                                <TableHead className="px-6">
                                                    School
                                                </TableHead>
                                                <TableHead className="px-6 text-right">
                                                    Students
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {safeTopPlacementSchools.map(
                                                (school, index) => (
                                                    <TableRow
                                                        key={`${school.year_7_placement_school_name ?? 'unknown'}-${index}`}
                                                        className="odd:bg-muted/15"
                                                    >
                                                        <TableCell className="px-6 text-muted-foreground">
                                                            {index + 1}
                                                        </TableCell>
                                                        <TableCell className="px-6 font-medium">
                                                            {school.year_7_placement_school_name ??
                                                                '—'}
                                                        </TableCell>
                                                        <TableCell className="px-6 text-right font-medium">
                                                            {school.student_count.toLocaleString()}
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>

                        {/* Key Metrics (1/3 width) */}
                        <Card className="border-border bg-card text-card-foreground shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold text-foreground">
                                    Key Metrics
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">
                                    Snapshot for the selected date range
                                </CardDescription>
                            </CardHeader>
	                            <CardContent className="grid grid-cols-2 gap-3">
	                                <div className="min-w-0 rounded-lg border border-border/40 bg-muted/20 p-4">
	                                    <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
	                                        Total Students
	                                    </div>
                                    <div className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                                        {isLoading ? (
                                            <Skeleton className="h-9 w-20" />
                                        ) : (
                                            safeStats.totalStudents.toLocaleString()
                                        )}
                                    </div>
                                </div>

	                                <div className="min-w-0 rounded-lg border border-border/40 bg-muted/20 p-4">
	                                    <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
	                                        Feeder Schools
	                                    </div>
                                    <div className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                                        {isLoading ? (
                                            <Skeleton className="h-9 w-16" />
                                        ) : (
                                            safeStats.feederSchools.toLocaleString()
                                        )}
                                    </div>
                                </div>

	                                <div className="min-w-0 rounded-lg border border-border/40 bg-muted/20 p-4">
	                                    <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
	                                        Placement Schools
	                                    </div>
                                    <div className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                                        {isLoading ? (
                                            <Skeleton className="h-9 w-16" />
                                        ) : (
                                            safeStats.placementSchools.toLocaleString()
                                        )}
                                    </div>
                                </div>

	                                <div className="min-w-0 overflow-hidden rounded-lg border border-border/40 bg-muted/20 p-4">
	                                    <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
	                                        Gender Distribution
	                                    </div>
	                                    <div className="mt-3 grid w-full min-w-0 grid-cols-1 gap-2 min-[420px]:grid-cols-2 min-[420px]:gap-3">
	                                        <div className="min-w-0 rounded-md border border-border/40 bg-background/20 p-3">
	                                            <div className="flex flex-col gap-1">
	                                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
	                                                    <div className="h-2 w-2 rounded-full bg-chart-1" />
	                                                    <span>Male</span>
	                                                </div>
	                                                <div className="text-xl font-bold tabular-nums tracking-tight text-foreground sm:text-2xl">
	                                                    {isLoading ? (
	                                                        <Skeleton className="h-7 w-14" />
	                                                    ) : (
	                                                        <>
                                                            {malePercent.toFixed(
                                                                0,
                                                            )}
                                                            %
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

	                                        <div className="min-w-0 rounded-md border border-border/40 bg-background/20 p-3">
	                                            <div className="flex flex-col gap-1">
	                                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
	                                                    <div className="h-2 w-2 rounded-full bg-chart-2" />
	                                                    <span>Female</span>
	                                                </div>
	                                                <div className="text-xl font-bold tabular-nums tracking-tight text-foreground sm:text-2xl">
	                                                    {isLoading ? (
	                                                        <Skeleton className="h-7 w-14" />
	                                                    ) : (
	                                                        <>
                                                            {femalePercent.toFixed(
                                                                0,
                                                            )}
                                                            %
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Bottom Row: Feeder List + Gender Donut */}
                    <div className="grid gap-4 lg:grid-cols-3">
                        {/* Top Feeder Schools List (2/3 width) */}
                        <Card className="lg:col-span-2 border-border bg-card text-card-foreground shadow-sm">
                            <CardHeader className="mb-2 flex flex-row items-center justify-between border-b border-border/40 pb-2">
                                <div>
                                    <CardTitle className="text-base font-bold text-foreground">
                                        Top Feeder Schools
                                    </CardTitle>
                                    <CardDescription className="text-muted-foreground">
                                        Primary schools contributing the most
                                        students
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-0 p-0">
                                {/* Header Row for List */}
                                <div className="flex items-center justify-between px-6 py-2 text-xs font-semibold tracking-wider text-muted-foreground/70 uppercase">
                                    <span>School Name</span>
                                    <span>Students</span>
                                </div>
                                <div className="px-2">
                                    {isLoading
                                        ? Array.from({ length: 5 }).map(
                                            (_, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between rounded-lg px-4 py-3"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <Skeleton className="h-10 w-10 rounded-lg" />
                                                        <div className="flex flex-col gap-2">
                                                            <Skeleton className="h-4 w-52" />
                                                            <Skeleton className="h-3 w-24" />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Skeleton className="h-4 w-10" />
                                                        <Skeleton className="hidden h-6 w-16 sm:block" />
                                                    </div>
                                                </div>
                                            ),
                                        )
                                        : safeTopFeederSchools.map(
                                            (school, index) => (
                                                <div
                                                    key={index}
                                                    className="group flex cursor-default items-center justify-between rounded-lg px-4 py-3 transition-colors hover:bg-muted/30"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-border/50 bg-muted/50 font-bold text-foreground shadow-sm transition-all group-hover:border-primary/50 group-hover:bg-primary group-hover:text-primary-foreground">
                                                            {index + 1}
                                                            {index < 3 && (
                                                                <div className="absolute -top-1 -right-1 h-2 w-2 animate-pulse rounded-full bg-primary" />
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col gap-0.5">
                                                            <span
                                                                className="max-w-[200px] truncate text-sm font-semibold text-foreground sm:max-w-[300px]"
                                                                title={
                                                                    school.feeder_school_name
                                                                }
                                                            >
                                                                {
                                                                    school.feeder_school_name
                                                                }
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground">
                                                                Primary School
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-sm font-bold text-foreground">
                                                            {
                                                                school.student_count
                                                            }
                                                        </div>
                                                        <div className="hidden rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">
                                                            Students
                                                        </div>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Gender Donut (1/3 width) */}
                        <Card className="border-border bg-card text-card-foreground shadow-sm">
                            <CardHeader className="pb-0">
                                <CardTitle className="text-base font-bold text-foreground">
                                    Gender Split
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">
                                    Year 7 exam passers who received a placement
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center p-4">
                                {isLoading ? (
                                    <div className="flex h-[200px] w-full items-center justify-center">
                                        <Skeleton className="h-44 w-44 rounded-full" />
                                    </div>
                                ) : (
                                    <ChartContainer
                                        config={chartConfig}
                                        className="h-[200px] w-full"
                                    >
                                        <PieChart>
                                            <ChartTooltip
                                                cursor={false}
                                                content={
                                                    <ChartTooltipContent
                                                        hideLabel
                                                    />
                                                }
                                            />
                                            <Pie
                                                data={genderData}
                                                dataKey="value"
                                                nameKey="name"
                                                innerRadius={65}
                                                outerRadius={85}
                                                strokeWidth={0}
                                            >
                                                <Cell
                                                    key="male"
                                                    fill="var(--color-chart-1)"
                                                />
                                                <Cell
                                                    key="female"
                                                    fill="var(--color-chart-2)"
                                                />
                                                <Label
                                                    content={({ viewBox }) => {
                                                        if (
                                                            viewBox &&
                                                            'cx' in viewBox &&
                                                            'cy' in viewBox
                                                        ) {
                                                            return (
                                                                <text
                                                                    x={
                                                                        viewBox.cx
                                                                    }
                                                                    y={
                                                                        viewBox.cy
                                                                    }
                                                                    textAnchor="middle"
                                                                    dominantBaseline="middle"
                                                                >
                                                                    <tspan
                                                                        x={
                                                                            viewBox.cx
                                                                        }
                                                                        y={
                                                                            viewBox.cy
                                                                        }
                                                                        className="fill-foreground text-3xl font-bold"
                                                                    >
                                                                        {safeStats.totalStudents.toLocaleString()}
                                                                    </tspan>
                                                                    <tspan
                                                                        x={
                                                                            viewBox.cx
                                                                        }
                                                                        y={
                                                                            (viewBox.cy ||
                                                                                0) +
                                                                            24
                                                                        }
                                                                        className="fill-muted-foreground text-xs"
                                                                    >
                                                                        PLACED
                                                                    </tspan>
                                                                </text>
                                                            );
                                                        }
                                                    }}
                                                />
                                            </Pie>
                                        </PieChart>
                                    </ChartContainer>
                                )}
                                <div className="mt-2 grid w-full grid-cols-2 gap-3">
                                    <div className="flex flex-col items-center rounded-xl border border-border/50 bg-muted/30 p-3">
                                        <div className="mb-2 flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-chart-1" />
                                            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                                Male
                                            </span>
                                        </div>
                                        {isLoading ? (
                                            <>
                                                <Skeleton className="h-6 w-16" />
                                                <Skeleton className="mt-1 h-3 w-10" />
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-xl font-bold text-foreground">
                                                    {safeStats.maleCount}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {malePercent.toFixed(0)}%
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-center rounded-xl border border-border/50 bg-muted/30 p-3">
                                        <div className="mb-2 flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-chart-2" />
                                            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                                Female
                                            </span>
                                        </div>
                                        {isLoading ? (
                                            <>
                                                <Skeleton className="h-6 w-16" />
                                                <Skeleton className="mt-1 h-3 w-10" />
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-xl font-bold text-foreground">
                                                    {safeStats.femaleCount}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {femalePercent.toFixed(0)}%
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <StudentPlacementsTable
                        key={[
                            placementFilters.search,
                            placementFilters.academic_year,
                            placementFilters.from,
                            placementFilters.to,
                        ].join('|')}
                        placements={safePlacements}
                        filters={placementFilters}
                        stats={safePlacementStats}
                        academicYears={academicYears}
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
