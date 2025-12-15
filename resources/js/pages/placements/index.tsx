import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/actions/App/Http/Controllers/StudentPlacementController';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { GraduationCap, School, Search, Users, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import debounce from 'lodash/debounce';

interface StudentPlacement {
    id: number;
    national_student_id: string;
    student_name: string;
    feeder_school_name: string;
    gender: string;
    year_7_placement_school_name: string;
    academic_year: number | null;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface Props {
    placements: PaginatedData<StudentPlacement>;
    filters: {
        search: string;
        per_page: number;
        academic_year: string;
    };
    stats: {
        total_students: number;
        feeder_schools: number;
        placement_schools: number;
    };
    academic_years: number[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Placements',
        href: index().url,
    },
];

export default function PlacementsIndex({ placements, filters, stats, academic_years }: Props) {
    const [search, setSearch] = useState(filters.search);
    const [academicYear, setAcademicYear] = useState(filters.academic_year);

    const debouncedSearch = useMemo(() => {
        return debounce((value: string, year: string) => {
            router.get(
                index().url,
                {
                    search: value || undefined,
                    per_page: filters.per_page,
                    academic_year: year || undefined,
                },
                { preserveState: true, preserveScroll: true }
            );
        }, 300);
    }, [filters.per_page]);

    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, [debouncedSearch]);

    const handleSearchChange = (value: string) => {
        setSearch(value);
        debouncedSearch(value, academicYear);
    };

    const handleAcademicYearChange = (value: string) => {
        const year = value === 'all' ? '' : value;
        setAcademicYear(year);
        debouncedSearch(search, year);
    };

    const clearSearch = () => {
        setSearch('');
        setAcademicYear('');
        debouncedSearch.cancel();
        router.get(index().url, { per_page: filters.per_page }, { preserveState: true });
    };

    const handlePerPageChange = (value: string) => {
        debouncedSearch.cancel();
        router.get(
            index().url,
            {
                search: search || undefined,
                per_page: parseInt(value),
                academic_year: academicYear || undefined,
            },
            { preserveState: true }
        );
    };

    const handlePageChange = (url: string | null) => {
        if (url) {
            router.get(url, {}, { preserveState: true, preserveScroll: true });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Student Placements" />

            <div className="relative flex flex-col gap-6 p-4 md:p-6">
                <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
                    <div className="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
                </div>

                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Student Placements</h1>
                        <p className="text-sm text-muted-foreground">
                            Search Year 7 student placements across all schools
                        </p>
                    </div>
                    {search && (
                        <Button variant="outline" size="sm" className="w-fit" onClick={clearSearch}>
                            <X className="h-4 w-4" />
                            Clear search
                        </Button>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Card className="bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                <Users className="h-4 w-4 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.total_students.toLocaleString()}</div>
                            <p className="mt-1 text-xs text-muted-foreground">Placed in Year 7</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Feeder Schools</CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                                <School className="h-4 w-4 text-emerald-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.feeder_schools.toLocaleString()}</div>
                            <p className="mt-1 text-xs text-muted-foreground">Primary schools</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Placement Schools</CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10">
                                <GraduationCap className="h-4 w-4 text-sky-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.placement_schools.toLocaleString()}</div>
                            <p className="mt-1 text-xs text-muted-foreground">Secondary schools</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Results Table */}
                <Card className="overflow-hidden bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/70">
                    <CardHeader>
                        <div>
                            <CardTitle>Placements</CardTitle>
                            <CardDescription>
                                {placements.total.toLocaleString()} students across {stats.feeder_schools.toLocaleString()} feeder schools
                            </CardDescription>
                        </div>
                        <CardAction>
                            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                                <div className="relative w-full sm:w-72">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Search name, ID, or school…"
                                        value={search}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                        className="bg-background/60 pl-9 pr-9"
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={clearSearch}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Rows</span>
                                    <Select value={String(filters.per_page)} onValueChange={handlePerPageChange}>
                                        <SelectTrigger className="w-24 bg-background/60">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                            <SelectItem value="100">100</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Year</span>
                                    <Select
                                        value={academicYear || 'all'}
                                        onValueChange={handleAcademicYearChange}
                                    >
                                        <SelectTrigger className="w-32 bg-background/60">
                                            <SelectValue placeholder="All Years" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Years</SelectItem>
                                            {academic_years.map((year) => (
                                                <SelectItem key={year} value={String(year)}>
                                                    {year}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardAction>
                    </CardHeader>
                    <CardContent className="px-0">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="hover:bg-muted/30">
                                    <TableHead className="px-6">Student</TableHead>
                                    <TableHead className="px-6">Gender</TableHead>
                                    <TableHead className="px-6">Feeder School</TableHead>
                                    <TableHead className="px-6">Placement School</TableHead>
                                    <TableHead className="px-6">Year</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {placements.data.length === 0 ? (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={5} className="px-6 py-12">
                                            <div className="flex flex-col items-center gap-2 text-center">
                                                <div className="text-sm font-medium">No results</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {filters.search
                                                        ? 'Try a different search, or clear the filter.'
                                                        : 'Student placement records will appear here.'}
                                                </div>
                                                {filters.search && (
                                                    <Button variant="outline" size="sm" className="mt-2" onClick={clearSearch}>
                                                        Clear search
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    placements.data.map((placement) => (
                                        <TableRow key={placement.id} className="odd:bg-muted/15">
                                            <TableCell className="px-6 whitespace-normal">
                                                <div className="flex flex-col gap-1">
                                                    <div className="font-medium">{placement.student_name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        <code className="rounded bg-muted px-1.5 py-0.5">
                                                            {placement.national_student_id}
                                                        </code>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6">
                                                <Badge variant={placement.gender === 'M' ? 'default' : 'secondary'}>
                                                    {placement.gender === 'M' ? 'Male' : 'Female'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-6 whitespace-normal text-sm text-muted-foreground">
                                                {placement.feeder_school_name}
                                            </TableCell>
                                            <TableCell className="px-6 whitespace-normal text-sm">
                                                {placement.year_7_placement_school_name}
                                            </TableCell>
                                            <TableCell className="px-6 whitespace-nowrap text-sm text-muted-foreground">
                                                {placement.academic_year || '—'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>

                    {/* Pagination */}
                    {placements.last_page > 1 && (
                        <CardFooter className="flex flex-col items-center justify-between gap-4 border-t sm:flex-row">
                            <div className="text-sm text-muted-foreground">
                                Showing {placements.from} to {placements.to} of {placements.total.toLocaleString()} results
                            </div>
                            <div className="flex items-center gap-1">
                                {placements.links.map((link, idx) => (
                                    <Button
                                        key={idx}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => handlePageChange(link.url)}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className="min-w-[2.5rem]"
                                    />
                                ))}
                            </div>
                        </CardFooter>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}
