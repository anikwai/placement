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
import { useIsMobile } from '@/hooks/use-mobile';
import { Link, router } from '@inertiajs/react';
import debounce from 'lodash/debounce';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
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
    const isMobile = useIsMobile();
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

    const paginationLinks = useMemo(() => {
        if (!isMobile) {
            return placements.links;
        }

        const lastPage = placements.last_page;
        const currentPage = placements.current_page;
        const visiblePages = new Set<number>([
            1,
            lastPage,
            currentPage,
            Math.max(1, currentPage - 1),
            Math.min(lastPage, currentPage + 1),
        ]);

        return placements.links.filter((link) => {
            if (
                link.label.includes('Previous') ||
                link.label.includes('Next')
            ) {
                return true;
            }

            if (link.label === '...') {
                return false;
            }

            const numeric = Number(link.label);
            if (!Number.isNaN(numeric)) {
                return visiblePages.has(numeric);
            }

            return false;
        });
    }, [
        isMobile,
        placements.current_page,
        placements.last_page,
        placements.links,
    ]);

    const paginationPrefetch = 'click';

    return (
        <Card className="overflow-hidden bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/70">
            <CardHeader className="gap-4 has-data-[slot=card-action]:grid-cols-1 sm:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
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
                <CardAction className="col-start-1 row-start-3 row-span-1 w-full justify-self-stretch sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:w-auto sm:justify-self-end">
                    <div className="grid w-full gap-3 sm:flex sm:w-auto sm:items-center">
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
                        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-3">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                                <span className="text-xs text-muted-foreground sm:text-sm">
                                    Rows
                                </span>
                                <Select
                                    value={String(filters.per_page)}
                                    onValueChange={handlePerPageChange}
                                >
                                    <SelectTrigger className="w-full bg-background/60 sm:w-24">
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
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                                <span className="text-xs text-muted-foreground sm:text-sm">
                                    Year
                                </span>
                                <Select
                                    value={academicYear || 'all'}
                                    onValueChange={handleAcademicYearChange}
                                >
                                    <SelectTrigger className="w-full bg-background/60 sm:w-32">
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
                    </div>
                </CardAction>
            </CardHeader>
            <CardContent className="px-0">
                <div className="w-full overflow-x-auto">
                    <Table className="min-w-0 sm:min-w-[720px]">
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-muted/30">
                                <TableHead className="px-4 sm:px-6">
                                    Student
                                </TableHead>
                                <TableHead className="hidden px-4 sm:table-cell sm:px-6">
                                    Gender
                                </TableHead>
                                <TableHead className="hidden px-4 sm:table-cell sm:px-6">
                                    Feeder School
                                </TableHead>
                                <TableHead className="px-4 sm:px-6">
                                    Placement School
                                </TableHead>
                                <TableHead className="hidden px-4 sm:table-cell sm:px-6">
                                    Year
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {isLoading ? (
                            Array.from({ length: 8 }).map((_, index) => (
                                <TableRow
                                    key={index}
                                    className="odd:bg-muted/15"
                                >
                                    <TableCell className="px-4 sm:px-6">
                                        <div className="flex flex-col gap-2">
                                            <Skeleton className="h-4 w-40" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden px-4 sm:table-cell sm:px-6">
                                        <Skeleton className="h-6 w-16" />
                                    </TableCell>
                                    <TableCell className="hidden px-4 sm:table-cell sm:px-6">
                                        <Skeleton className="h-4 w-40" />
                                    </TableCell>
                                    <TableCell className="px-4 sm:px-6">
                                        <Skeleton className="h-4 w-40" />
                                    </TableCell>
                                    <TableCell className="hidden px-4 sm:table-cell sm:px-6">
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
                                    <TableCell className="px-4 sm:px-6">
                                        <div className="flex flex-col gap-1">
                                            <div className="font-medium leading-tight">
                                                {placement.student_name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                <code className="rounded bg-muted px-1.5 py-0.5">
                                                    {
                                                        placement.national_student_id
                                                    }
                                                </code>
                                            </div>
                                            <div className="sm:hidden">
                                                <Badge
                                                    variant={
                                                        placement.gender === 'M'
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                    className="mt-1"
                                                >
                                                    {placement.gender === 'M'
                                                        ? 'Male'
                                                        : 'Female'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden px-4 sm:table-cell sm:px-6">
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
                                    <TableCell className="hidden px-4 text-sm whitespace-normal text-muted-foreground sm:table-cell sm:px-6">
                                        {placement.feeder_school_name}
                                    </TableCell>
                                    <TableCell className="px-4 text-sm whitespace-normal sm:px-6">
                                        <div className="font-medium leading-tight">
                                            {placement.year_7_placement_school_name}
                                        </div>
                                        <div className="mt-1 text-xs text-muted-foreground sm:hidden">
                                            {placement.feeder_school_name}
                                        </div>
                                        <div className="mt-1 text-xs text-muted-foreground sm:hidden">
                                            Year {placement.academic_year || '—'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden px-4 text-sm whitespace-nowrap text-muted-foreground sm:table-cell sm:px-6">
                                        {placement.academic_year || '—'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            {placements.last_page > 1 && (
                <CardFooter className="flex flex-col items-center justify-between gap-4 border-t sm:flex-row">
                    <div className="text-sm text-muted-foreground">
                        Showing {placements.from} to {placements.to} of{' '}
                        {placements.total.toLocaleString()} results
                    </div>
                    <div className="flex max-w-full flex-wrap items-center justify-center gap-1 sm:flex-nowrap sm:justify-end">
                        {paginationLinks.map((link, idx) => {
                            const isPrevious = link.label.includes('Previous');
                            const isNext = link.label.includes('Next');
                            const isEllipsis = link.label === '...';
                            const href = link.url;

                            if (isPrevious || isNext) {
                                const contents = (
                                    <>
                                        {isPrevious ? (
                                            <ChevronLeft className="h-4 w-4" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4" />
                                        )}
                                        <span className="hidden sm:inline">
                                            {isPrevious ? 'Prev' : 'Next'}
                                        </span>
                                    </>
                                );

                                return href ? (
                                    <Button
                                        key={idx}
                                        asChild
                                        variant="outline"
                                        size="sm"
                                        className="min-w-[2.25rem] px-2 sm:min-w-[2.5rem] sm:px-3"
                                        aria-label={
                                            isPrevious
                                                ? 'Previous page'
                                                : 'Next page'
                                        }
                                    >
                                        <Link
                                            href={href}
                                            replace
                                            preserveScroll
                                            preserveState
                                            only={['placements']}
                                            prefetch={paginationPrefetch}
                                        >
                                            {contents}
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button
                                        key={idx}
                                        variant="outline"
                                        size="sm"
                                        disabled
                                        className="min-w-[2.25rem] px-2 sm:min-w-[2.5rem] sm:px-3"
                                        aria-label={
                                            isPrevious
                                                ? 'Previous page'
                                                : 'Next page'
                                        }
                                    >
                                        {contents}
                                    </Button>
                                );
                            }

                            if (isEllipsis) {
                                return (
                                    <Button
                                        key={idx}
                                        variant="outline"
                                        size="sm"
                                        disabled
                                        className="min-w-[2.25rem] px-2 sm:min-w-[2.5rem] sm:px-3"
                                    >
                                        …
                                    </Button>
                                );
                            }

                            return href ? (
                                <Button
                                    key={idx}
                                    asChild
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    className="min-w-[2.25rem] px-2 sm:min-w-[2.5rem] sm:px-3"
                                >
                                    <Link
                                        href={href}
                                        replace
                                        preserveScroll
                                        preserveState
                                        only={['placements']}
                                        prefetch={paginationPrefetch}
                                    >
                                        {link.label}
                                    </Link>
                                </Button>
                            ) : (
                                <Button
                                    key={idx}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled
                                    className="min-w-[2.25rem] px-2 sm:min-w-[2.5rem] sm:px-3"
                                >
                                    {link.label}
                                </Button>
                            );
                        })}
                    </div>
                </CardFooter>
            )}
        </Card>
    );
}
