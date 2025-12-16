import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { dashboard } from '@/routes';
import { router } from '@inertiajs/react';
import debounce from 'lodash/debounce';
import { Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface StudentPlacementRow {
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

export interface StudentPlacementsTableProps {
    placements: PaginatedData<StudentPlacementRow>;
    filters: {
        search: string;
        per_page: number;
        academic_year: string;
        from: string;
        to: string;
    };
    stats: {
        total_students: number;
        feeder_schools: number;
        placement_schools: number;
    };
    academicYears: number[];
    isLoading?: boolean;
}

export default function StudentPlacementsTable({
    placements,
    filters,
    stats,
    academicYears,
    isLoading = false,
}: StudentPlacementsTableProps) {
    const [search, setSearch] = useState(filters.search);
    const [academicYear, setAcademicYear] = useState(filters.academic_year);
    const dashboardUrl = dashboard().url;

    const debouncedSearch = useMemo(() => {
        return debounce((value: string, year: string) => {
            router.get(
                dashboardUrl,
                {
                    search: value || undefined,
                    per_page: filters.per_page,
                    academic_year: year || undefined,
                    from: filters.from || undefined,
                    to: filters.to || undefined,
                },
                { preserveState: true, preserveScroll: true },
            );
        }, 300);
    }, [dashboardUrl, filters.from, filters.per_page, filters.to]);

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
        debouncedSearch.cancel();
        router.get(
            dashboardUrl,
            {
                per_page: filters.per_page,
                academic_year: academicYear || undefined,
                from: filters.from || undefined,
                to: filters.to || undefined,
            },
            { preserveState: true },
        );
    };

    const handlePerPageChange = (value: string) => {
        debouncedSearch.cancel();
        router.get(
            dashboardUrl,
            {
                search: search || undefined,
                per_page: parseInt(value, 10),
                academic_year: academicYear || undefined,
                from: filters.from || undefined,
                to: filters.to || undefined,
            },
            { preserveState: true },
        );
    };

    const handlePageChange = (url: string | null) => {
        if (url) {
            router.get(url, {}, { preserveState: true, preserveScroll: true });
        }
    };

    return (
        <Card className="overflow-hidden bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/70">
            <CardHeader>
                <div>
                    <CardTitle>Placements</CardTitle>
                    <CardDescription>
                        {isLoading ? (
                            <Skeleton className="h-4 w-64" />
                        ) : (
                            <>
                                {placements.total.toLocaleString()} students
                                across {stats.feeder_schools.toLocaleString()}{' '}
                                feeder schools
                            </>
                        )}
                    </CardDescription>
                </div>
                <CardAction>
                    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search name, ID, or school…"
                                value={search}
                                onChange={(e) =>
                                    handleSearchChange(e.target.value)
                                }
                                className="bg-background/60 pr-9 pl-9"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                Rows
                            </span>
                            <Select
                                value={String(filters.per_page)}
                                onValueChange={handlePerPageChange}
                            >
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
                            <span className="text-sm text-muted-foreground">
                                Year
                            </span>
                            <Select
                                value={academicYear || 'all'}
                                onValueChange={handleAcademicYearChange}
                            >
                                <SelectTrigger className="w-32 bg-background/60">
                                    <SelectValue placeholder="All Years" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Years
                                    </SelectItem>
                                    {academicYears.map((year) => (
                                        <SelectItem
                                            key={year}
                                            value={String(year)}
                                        >
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
                            <TableHead className="px-6">
                                Feeder School
                            </TableHead>
                            <TableHead className="px-6">
                                Placement School
                            </TableHead>
                            <TableHead className="px-6">Year</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 8 }).map((_, index) => (
                                <TableRow
                                    key={index}
                                    className="odd:bg-muted/15"
                                >
                                    <TableCell className="px-6">
                                        <div className="flex flex-col gap-2">
                                            <Skeleton className="h-4 w-40" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6">
                                        <Skeleton className="h-6 w-16" />
                                    </TableCell>
                                    <TableCell className="px-6">
                                        <Skeleton className="h-4 w-40" />
                                    </TableCell>
                                    <TableCell className="px-6">
                                        <Skeleton className="h-4 w-40" />
                                    </TableCell>
                                    <TableCell className="px-6">
                                        <Skeleton className="h-4 w-12" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : placements.data.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={5} className="px-6 py-12">
                                    <div className="flex flex-col items-center gap-2 text-center">
                                        <div className="text-sm font-medium">
                                            No results
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {filters.search
                                                ? 'Try a different search, or clear the filter.'
                                                : 'Student placement records will appear here.'}
                                        </div>
                                        {filters.search && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-2"
                                                onClick={clearSearch}
                                            >
                                                Clear search
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            placements.data.map((placement) => (
                                <TableRow
                                    key={placement.id}
                                    className="odd:bg-muted/15"
                                >
                                    <TableCell className="px-6 whitespace-normal">
                                        <div className="flex flex-col gap-1">
                                            <div className="font-medium">
                                                {placement.student_name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                <code className="rounded bg-muted px-1.5 py-0.5">
                                                    {
                                                        placement.national_student_id
                                                    }
                                                </code>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6">
                                        <Badge
                                            variant={
                                                placement.gender === 'M'
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {placement.gender === 'M'
                                                ? 'Male'
                                                : 'Female'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-6 text-sm whitespace-normal text-muted-foreground">
                                        {placement.feeder_school_name}
                                    </TableCell>
                                    <TableCell className="px-6 text-sm whitespace-normal">
                                        {placement.year_7_placement_school_name}
                                    </TableCell>
                                    <TableCell className="px-6 text-sm whitespace-nowrap text-muted-foreground">
                                        {placement.academic_year || '—'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>

            {placements.last_page > 1 && (
                <CardFooter className="flex flex-col items-center justify-between gap-4 border-t sm:flex-row">
                    <div className="text-sm text-muted-foreground">
                        Showing {placements.from} to {placements.to} of{' '}
                        {placements.total.toLocaleString()} results
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
    );
}
