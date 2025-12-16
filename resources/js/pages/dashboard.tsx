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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { download as placementsDownload } from '@/routes/placements';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { CalendarDays, Download } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
    stats: Stats;
    topFeederSchools: SchoolData[];
    topPlacementSchools: SchoolData[];
    placements: StudentPlacementsTableProps['placements'];
    placementFilters: StudentPlacementsTableProps['filters'];
    placementStats: StudentPlacementsTableProps['stats'];
    academicYears: StudentPlacementsTableProps['academicYears'];
    dateRangeBounds: { from: string | null; to: string | null };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

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

    const genderData = [
        {
            name: 'male',
            label: 'Male',
            value: stats.maleCount,
            fill: 'var(--color-chart-1)',
        },
        {
            name: 'female',
            label: 'Female',
            value: stats.femaleCount,
            fill: 'var(--color-chart-2)',
        },
    ];

    const [datePopoverOpen, setDatePopoverOpen] = useState(false);
    const [topPlacementView, setTopPlacementView] = useState<'graph' | 'table'>(
        'graph',
    );

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
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Placement Dashboard
                            </h1>
                            <p className="text-sm text-muted-foreground">
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
                                        size="sm"
                                        className="border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground"
                                    >
                                        <CalendarDays className="mr-2 h-4 w-4" />
                                        {dateLabel}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    align="end"
                                    className="w-auto p-0"
                                >
                                    <div className="p-3">
                                        <Calendar
                                            mode="range"
                                            numberOfMonths={2}
                                            selected={dateRange}
                                            defaultMonth={dateRange?.from}
                                            onSelect={(range) => {
                                                setDateRange(range);

                                                if (range?.from && range?.to) {
                                                    setDatePopoverOpen(false);
                                                    applyDateRange(range);
                                                }
                                            }}
                                            className="rounded-lg border shadow-sm"
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
                                size="sm"
                                className="border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground"
                                onClick={() => {
                                    window.location.assign(downloadUrl);
                                }}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </Button>
                        </div>
                    </div>

                    {/* Top Row: Main Chart + Stats */}
                    <div className="grid gap-4 lg:grid-cols-3">
                        {/* Main Chart (2/3 width) */}
                        <Card className="col-span-2 border-border bg-card text-card-foreground shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between">
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
                                {topPlacementView === 'graph' ? (
                                    <ChartContainer
                                        config={chartConfig}
                                        className="max-h-[350px] w-full"
                                    >
                                        <BarChart
                                            accessibilityLayer
                                            data={topPlacementSchools}
                                            margin={{
                                                left: 20,
                                                right: 20,
                                                top: 20,
                                                bottom: 20,
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
                                                        stopOpacity={0.8}
                                                    />
                                                    <stop
                                                        offset="95%"
                                                        stopColor="var(--color-chart-1)"
                                                        stopOpacity={0.1}
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
                                                tickMargin={15}
                                                axisLine={false}
                                                tick={{
                                                    fill: 'var(--color-muted-foreground)',
                                                    fontSize: 11,
                                                    fontWeight: 500,
                                                }}
                                                tickFormatter={(
                                                    value: string,
                                                ) =>
                                                    value.length > 10
                                                        ? `${value.slice(0, 10)}...`
                                                        : value
                                                }
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
                                                    <ChartTooltipContent
                                                        hideLabel
                                                    />
                                                }
                                            />
                                            <Bar
                                                dataKey="student_count"
                                                fill="url(#colorStudent)"
                                                radius={[6, 6, 0, 0]}
                                                barSize={32}
                                            />
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
                                            {topPlacementSchools.map(
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

                        {/* Stats Grid (1/3 width, 2x2 grid) */}
                        <div className="grid grid-cols-2 content-start gap-4 lg:grid-cols-2">
                            <Card className="border-border bg-card text-card-foreground shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Total Students
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold tracking-tight text-foreground">
                                        {stats.totalStudents.toLocaleString()}
                                    </div>
                                    <div className="mt-2 flex items-center text-xs font-medium text-emerald-500">
                                        <span className="mr-2 rounded bg-emerald-500/10 px-1 py-0.5">
                                            ↑ 3.6%
                                        </span>
                                        <span className="text-muted-foreground/70">
                                            vs last year
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border bg-card text-card-foreground shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Feeder Schools
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold tracking-tight text-foreground">
                                        {stats.feederSchools.toLocaleString()}
                                    </div>
                                    <div className="mt-2 flex items-center text-xs font-medium text-emerald-500">
                                        <span className="mr-2 rounded bg-emerald-500/10 px-1 py-0.5">
                                            ↑ 2.5%
                                        </span>
                                        <span className="text-muted-foreground/70">
                                            vs last year
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border bg-card text-card-foreground shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Placement Schools
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold tracking-tight text-foreground">
                                        {stats.placementSchools.toLocaleString()}
                                    </div>
                                    <div className="mt-2 flex items-center text-xs font-medium text-rose-500">
                                        <span className="mr-2 rounded bg-rose-500/10 px-1 py-0.5">
                                            ↓ 5.0%
                                        </span>
                                        <span className="text-muted-foreground/70">
                                            vs last year
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border bg-card text-card-foreground shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Male %
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold tracking-tight text-foreground">
                                        {(
                                            (stats.maleCount /
                                                stats.totalStudents) *
                                            100
                                        ).toFixed(0)}
                                        %
                                    </div>
                                    <div className="mt-2 flex items-center text-xs font-medium text-blue-500">
                                        <span className="mr-2 rounded bg-blue-500/10 px-1 py-0.5">
                                            Stable
                                        </span>
                                        <span className="text-muted-foreground/70">
                                            Distribution
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Bottom Row: Feeder List + Gender Donut */}
                    <div className="grid gap-4 lg:grid-cols-3">
                        {/* Top Feeder Schools List (2/3 width) */}
                        <Card className="col-span-2 border-border bg-card text-card-foreground shadow-sm">
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
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-foreground"
                                >
                                    <span className="sr-only">View All</span>
                                    <span>→</span>
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-0 p-0">
                                {/* Header Row for List */}
                                <div className="flex items-center justify-between px-6 py-2 text-xs font-semibold tracking-wider text-muted-foreground/70 uppercase">
                                    <span>School Name</span>
                                    <span>Students</span>
                                </div>
                                <div className="px-2">
                                    {topFeederSchools.map((school, index) => (
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
                                                    {school.student_count}
                                                </div>
                                                <div className="hidden rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">
                                                    Students
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Gender Donut (1/3 width) */}
                        <Card className="border-border bg-card text-card-foreground shadow-sm">
                            <CardHeader className="pb-0">
                                <CardTitle className="text-base font-bold text-foreground">
                                    Gender Split
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center p-4">
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
                                                                x={viewBox.cx}
                                                                y={viewBox.cy}
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
                                                                    {stats.totalStudents.toLocaleString()}
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
                                                                    TOTAL
                                                                </tspan>
                                                            </text>
                                                        );
                                                    }
                                                }}
                                            />
                                        </Pie>
                                    </PieChart>
                                </ChartContainer>
                                <div className="mt-2 grid w-full grid-cols-2 gap-3">
                                    <div className="flex flex-col items-center rounded-xl border border-border/50 bg-muted/30 p-3">
                                        <div className="mb-2 flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-chart-1" />
                                            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                                Male
                                            </span>
                                        </div>
                                        <span className="text-xl font-bold text-foreground">
                                            {stats.maleCount}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {(
                                                (stats.maleCount /
                                                    stats.totalStudents) *
                                                100
                                            ).toFixed(0)}
                                            %
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-center rounded-xl border border-border/50 bg-muted/30 p-3">
                                        <div className="mb-2 flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-chart-2" />
                                            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                                Female
                                            </span>
                                        </div>
                                        <span className="text-xl font-bold text-foreground">
                                            {stats.femaleCount}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {(
                                                (stats.femaleCount /
                                                    stats.totalStudents) *
                                                100
                                            ).toFixed(0)}
                                            %
                                        </span>
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
                        placements={placements}
                        filters={placementFilters}
                        stats={placementStats}
                        academicYears={academicYears}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
