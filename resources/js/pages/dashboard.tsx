import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Download, GraduationCap, School, Users } from 'lucide-react';
import { Cell, Label, Pie, PieChart } from 'recharts';

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
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

const genderChartConfig = {
    male: {
        label: 'Male',
        theme: {
            light: 'oklch(0.646 0.222 41.116)',
            dark: 'oklch(0.646 0.222 41.116)',
        },
    },
    female: {
        label: 'Female',
        theme: {
            light: 'oklch(0.6 0.118 184.704)',
            dark: 'oklch(0.6 0.118 184.704)',
        },
    },
} satisfies ChartConfig;

export default function Dashboard({ stats, topFeederSchools, topPlacementSchools }: Props) {
    const genderData = [
        { name: 'male', label: 'Male', value: stats.maleCount, fill: 'var(--color-male)' },
        { name: 'female', label: 'Female', value: stats.femaleCount, fill: 'var(--color-female)' },
    ];

    const maxPlacementCount = Math.max(...topPlacementSchools.map((s) => s.student_count));

    const pipelineColors = [
        'bg-red-500',
        'bg-amber-500',
        'bg-yellow-500',
        'bg-emerald-500',
        'bg-sky-500',
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Placement Dashboard</h1>
                        <p className="text-sm text-muted-foreground">
                            Year 7 student placement overview
                        </p>
                    </div>
                    <Button variant="outline" size="sm" className="w-fit">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>

                {/* Stats Cards Row */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Students
                            </CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                <Users className="h-4 w-4 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.totalStudents.toLocaleString()}</div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Placed in Year 7
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Feeder Schools
                            </CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                                <School className="h-4 w-4 text-emerald-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.feederSchools.toLocaleString()}</div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Primary schools
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Placement Schools
                            </CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10">
                                <GraduationCap className="h-4 w-4 text-sky-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.placementSchools.toLocaleString()}</div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Secondary schools
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Male Students
                            </CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                                <Users className="h-4 w-4 text-amber-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {((stats.maleCount / stats.totalStudents) * 100).toFixed(0)}%
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {stats.maleCount.toLocaleString()} students
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Middle Row - Chart and Pipeline */}
                <div className="grid gap-4 lg:grid-cols-2">
                    {/* Gender Distribution Donut */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-medium">Gender Distribution</CardTitle>
                                <CardDescription>Student breakdown by gender</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center">
                                <ChartContainer config={genderChartConfig} className="mx-auto aspect-square h-[200px]">
                                    <PieChart>
                                        <ChartTooltip
                                            cursor={false}
                                            content={<ChartTooltipContent hideLabel />}
                                        />
                                        <Pie
                                            data={genderData}
                                            dataKey="value"
                                            nameKey="name"
                                            innerRadius={60}
                                            outerRadius={85}
                                            strokeWidth={4}
                                            stroke="hsl(var(--background))"
                                        >
                                            {genderData.map((entry) => (
                                                <Cell key={entry.name} fill={entry.fill} />
                                            ))}
                                            <Label
                                                content={({ viewBox }) => {
                                                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                                                        return (
                                                            <text
                                                                x={viewBox.cx}
                                                                y={viewBox.cy}
                                                                textAnchor="middle"
                                                                dominantBaseline="middle"
                                                            >
                                                                <tspan
                                                                    x={viewBox.cx}
                                                                    y={viewBox.cy}
                                                                    className="fill-foreground text-2xl font-bold"
                                                                >
                                                                    {stats.totalStudents.toLocaleString()}
                                                                </tspan>
                                                                <tspan
                                                                    x={viewBox.cx}
                                                                    y={(viewBox.cy || 0) + 20}
                                                                    className="fill-muted-foreground text-xs"
                                                                >
                                                                    Total
                                                                </tspan>
                                                            </text>
                                                        );
                                                    }
                                                }}
                                            />
                                        </Pie>
                                    </PieChart>
                                </ChartContainer>
                                {/* Legend */}
                                <div className="mt-4 flex items-center justify-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'oklch(0.646 0.222 41.116)' }} />
                                        <span className="text-sm text-muted-foreground">Male</span>
                                        <span className="ml-1 text-sm font-medium">{stats.maleCount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'oklch(0.6 0.118 184.704)' }} />
                                        <span className="text-sm text-muted-foreground">Female</span>
                                        <span className="ml-1 text-sm font-medium">{stats.femaleCount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Placement Pipeline */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-medium">Placement Pipeline</CardTitle>
                            <CardDescription>Top schools by student placements</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {topPlacementSchools.map((school, index) => (
                                    <div key={index} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="truncate font-medium" title={school.year_7_placement_school_name}>
                                                {school.year_7_placement_school_name}
                                            </span>
                                            <span className="ml-2 shrink-0 text-muted-foreground">
                                                {school.student_count.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                            <div
                                                className={`h-full rounded-full transition-all ${pipelineColors[index % pipelineColors.length]}`}
                                                style={{
                                                    width: `${(school.student_count / maxPlacementCount) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Feeder Schools */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-medium">Top Feeder Schools</CardTitle>
                        <CardDescription>Primary schools sending the most students</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                            {topFeederSchools.map((school, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 rounded-lg border bg-card p-3"
                                >
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                        {index + 1}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium" title={school.feeder_school_name}>
                                            {school.feeder_school_name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {school.student_count} students
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>


            </div>
        </AppLayout>
    );
}
