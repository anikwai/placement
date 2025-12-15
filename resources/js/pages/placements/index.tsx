import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/actions/App/Http/Controllers/StudentPlacementController';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { GraduationCap, School, Search, Users, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import debounce from 'lodash/debounce';

interface StudentPlacement {
    id: number;
    national_student_id: string;
    student_name: string;
    feeder_school_name: string;
    gender: string;
    year_7_placement_school_name: string;
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
    };
    stats: {
        total_students: number;
        feeder_schools: number;
        placement_schools: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Placements',
        href: index().url,
    },
];

export default function PlacementsIndex({ placements, filters, stats }: Props) {
    const [search, setSearch] = useState(filters.search);

    const debouncedSearch = useCallback(
        debounce((value: string) => {
            router.get(
                index().url,
                { search: value, per_page: filters.per_page },
                { preserveState: true, preserveScroll: true }
            );
        }, 300),
        [filters.per_page]
    );

    const handleSearchChange = (value: string) => {
        setSearch(value);
        debouncedSearch(value);
    };

    const clearSearch = () => {
        setSearch('');
        router.get(index().url, { per_page: filters.per_page }, { preserveState: true });
    };

    const handlePerPageChange = (value: string) => {
        router.get(
            index().url,
            { search: filters.search, per_page: parseInt(value) },
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

            <div className="flex flex-col gap-6 p-4">
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                            <Users className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_students.toLocaleString()}</div>
                            <p className="text-muted-foreground text-xs">Year 7 placements</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Feeder Schools</CardTitle>
                            <School className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.feeder_schools.toLocaleString()}</div>
                            <p className="text-muted-foreground text-xs">Primary schools</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Placement Schools</CardTitle>
                            <GraduationCap className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.placement_schools.toLocaleString()}</div>
                            <p className="text-muted-foreground text-xs">Secondary schools</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Student Placements</CardTitle>
                        <CardDescription>
                            Search and view Year 7 student placements across all schools
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                                <Input
                                    type="text"
                                    placeholder="Search by name, ID, or school..."
                                    value={search}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="pl-9 pr-9"
                                />
                                {search && (
                                    <button
                                        onClick={clearSearch}
                                        className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-sm">Show</span>
                                <Select
                                    value={String(filters.per_page)}
                                    onValueChange={handlePerPageChange}
                                >
                                    <SelectTrigger className="w-20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                                <span className="text-muted-foreground text-sm">entries</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Results Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="px-4 py-3 text-left text-sm font-medium">Student ID</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Student Name</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Gender</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Feeder School</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Placement School</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {placements.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center">
                                                <div className="text-muted-foreground">
                                                    {filters.search
                                                        ? 'No students found matching your search.'
                                                        : 'No students found.'}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        placements.data.map((placement) => (
                                            <tr
                                                key={placement.id}
                                                className="border-b transition-colors hover:bg-muted/50"
                                            >
                                                <td className="px-4 py-3">
                                                    <code className="bg-muted rounded px-1.5 py-0.5 text-sm">
                                                        {placement.national_student_id}
                                                    </code>
                                                </td>
                                                <td className="px-4 py-3 font-medium">
                                                    {placement.student_name}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={placement.gender === 'M' ? 'default' : 'secondary'}>
                                                        {placement.gender === 'M' ? 'Male' : 'Female'}
                                                    </Badge>
                                                </td>
                                                <td className="text-muted-foreground px-4 py-3 text-sm">
                                                    {placement.feeder_school_name}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    {placement.year_7_placement_school_name}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {placements.last_page > 1 && (
                            <div className="flex flex-col items-center justify-between gap-4 border-t px-4 py-4 sm:flex-row">
                                <div className="text-muted-foreground text-sm">
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
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
