import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppearance } from '@/hooks/use-appearance';
import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowUpDown, FileSearch, GraduationCap, Moon, School, Search, Sun, Users, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface StudentPlacement {
    id: number;
    national_student_id: string;
    student_name: string;
    gender: string;
    feeder_school_name: string;
    year_7_placement_school_name: string;
}

interface Stats {
    totalStudents: number;
    feederSchools: number;
    placementSchools: number;
}

interface Props {
    canRegister?: boolean;
    stats: Stats;
}

type SortField = 'student_name' | 'national_student_id' | 'feeder_school_name' | 'year_7_placement_school_name';
type SortOrder = 'asc' | 'desc';

export default function Welcome({ canRegister = true, stats }: Props) {
    const { auth } = usePage<SharedData>().props;
    const { appearance, updateAppearance } = useAppearance();
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<StudentPlacement[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [sortField, setSortField] = useState<SortField>('student_name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const searchInputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const performSearch = useCallback(async (query: string) => {
        if (query.length < 2) {
            setResults([]);
            setHasSearched(false);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`/api/placements/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            setResults(data.data);
            setHasSearched(true);
        } catch (error) {
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleSearchChange = (value: string) => {
        setSearch(value);
        if (value.length < 2) {
            setResults([]);
            setHasSearched(false);
        }

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            performSearch(value);
        }, 300);
    };

    const clearSearch = () => {
        setSearch('');
        setResults([]);
        setHasSearched(false);
        searchInputRef.current?.focus();
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const sortedResults = [...results].sort((a, b) => {
        const aVal = a[sortField].toLowerCase();
        const bVal = b[sortField].toLowerCase();
        if (sortOrder === 'asc') {
            return aVal.localeCompare(bVal);
        }
        return bVal.localeCompare(aVal);
    });

    const toggleTheme = () => {
        updateAppearance(appearance === 'dark' ? 'light' : 'dark');
    };

    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
        <button
            onClick={() => handleSort(field)}
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            aria-label={`Sort by ${field}`}
        >
            {children}
            <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-foreground' : 'text-muted-foreground/50'}`} />
        </button>
    );

    return (
        <>
            <Head title="Year 7 Placement Results" />

            <div className="flex min-h-screen flex-col bg-background">
                {/* Header */}
                <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
                        <div className="flex items-center gap-2">
                            <GraduationCap className="h-6 w-6" />
                            <span className="font-semibold">Placements</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleTheme}
                                aria-label="Toggle theme"
                            >
                                {appearance === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                            </Button>

                            <Separator orientation="vertical" className="h-6" />

                            {auth.user ? (
                                <Button asChild size="sm">
                                    <Link href={dashboard()}>Dashboard</Link>
                                </Button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={login()}>Log in</Link>
                                    </Button>
                                    {canRegister && (
                                        <Button size="sm" asChild>
                                            <Link href={register()}>Register</Link>
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1">
                    {/* Hero */}
                    <section className="border-b bg-muted/30">
                        <div className="mx-auto max-w-6xl px-4 py-16">
                            <div className="mx-auto max-w-2xl text-center">
                                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                    Year 7 Placement Search
                                </h1>
                                <p className="mt-3 text-muted-foreground">
                                    Enter a student name or ID to find placement information.
                                </p>

                                {/* Search */}
                                <div className="mt-8">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            ref={searchInputRef}
                                            type="text"
                                            placeholder="Search by name or student ID..."
                                            value={search}
                                            onChange={(e) => handleSearchChange(e.target.value)}
                                            className="h-11 pl-9 pr-9"
                                            aria-label="Search students"
                                        />
                                        {search && (
                                            <button
                                                onClick={clearSearch}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                aria-label="Clear search"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                    {search.length > 0 && search.length < 2 && (
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            Enter at least 2 characters
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Results */}
                    <section className="mx-auto max-w-6xl px-4 py-8">
                        {/* Loading State */}
                        {isLoading && (
                            <Card>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[140px]">Student ID</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead className="w-[80px]">Gender</TableHead>
                                                <TableHead>Feeder School</TableHead>
                                                <TableHead>Placement School</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {[...Array(5)].map((_, i) => (
                                                <TableRow key={i}>
                                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                                    <TableCell><Skeleton className="h-5 w-14" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )}

                        {/* No Results */}
                        {!isLoading && hasSearched && results.length === 0 && (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <FileSearch className="h-12 w-12 text-muted-foreground/50" />
                                    <h3 className="mt-4 font-medium">No results found</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        No students match "{search}"
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Results Table */}
                        {!isLoading && sortedResults.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">
                                        {results.length} result{results.length !== 1 ? 's' : ''}
                                    </p>
                                </div>

                                <Card>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/50">
                                                    <TableHead className="w-[140px]">
                                                        <SortableHeader field="national_student_id">
                                                            Student ID
                                                        </SortableHeader>
                                                    </TableHead>
                                                    <TableHead>
                                                        <SortableHeader field="student_name">
                                                            Name
                                                        </SortableHeader>
                                                    </TableHead>
                                                    <TableHead className="w-[80px]">Gender</TableHead>
                                                    <TableHead>
                                                        <SortableHeader field="feeder_school_name">
                                                            Feeder School
                                                        </SortableHeader>
                                                    </TableHead>
                                                    <TableHead>
                                                        <SortableHeader field="year_7_placement_school_name">
                                                            Placement School
                                                        </SortableHeader>
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {sortedResults.map((student, index) => (
                                                    <TableRow
                                                        key={student.id}
                                                        className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                                                    >
                                                        <TableCell className="font-mono text-xs">
                                                            {student.national_student_id}
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            {student.student_name}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={student.gender === 'M' ? 'default' : 'secondary'}>
                                                                {student.gender === 'M' ? 'M' : 'F'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {student.feeder_school_name}
                                                        </TableCell>
                                                        <TableCell>
                                                            {student.year_7_placement_school_name}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Default State - Stats & Info */}
                        {!isLoading && !hasSearched && (
                            <div className="space-y-8">
                                {/* Stats */}
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                                Total Students
                                            </CardTitle>
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{stats.totalStudents.toLocaleString()}</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                                Feeder Schools
                                            </CardTitle>
                                            <School className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{stats.feederSchools.toLocaleString()}</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                                Placement Schools
                                            </CardTitle>
                                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{stats.placementSchools.toLocaleString()}</div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* FAQ */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Frequently Asked Questions</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Accordion type="single" collapsible className="w-full">
                                            <AccordionItem value="item-1">
                                                <AccordionTrigger>How do I search for my child?</AccordionTrigger>
                                                <AccordionContent className="text-muted-foreground">
                                                    Enter your child's full name or student ID in the search box above.
                                                    Results will appear as you type. You need to enter at least 2 characters.
                                                </AccordionContent>
                                            </AccordionItem>
                                            <AccordionItem value="item-2">
                                                <AccordionTrigger>What is the Student ID format?</AccordionTrigger>
                                                <AccordionContent className="text-muted-foreground">
                                                    Student IDs start with the letter "S" followed by 9 digits (e.g., S000000001).
                                                    This ID is unique to each student.
                                                </AccordionContent>
                                            </AccordionItem>
                                            <AccordionItem value="item-3">
                                                <AccordionTrigger>What if I can't find my child?</AccordionTrigger>
                                                <AccordionContent className="text-muted-foreground">
                                                    Verify the spelling of the name and try different variations.
                                                    If still not found, contact your child's feeder school for assistance.
                                                </AccordionContent>
                                            </AccordionItem>
                                            <AccordionItem value="item-4">
                                                <AccordionTrigger>Can I request a placement change?</AccordionTrigger>
                                                <AccordionContent className="text-muted-foreground">
                                                    Placement changes are handled through the Ministry of Education.
                                                    Contact your local education office for the appeals process.
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </section>
                </main>

                {/* Footer */}
                <footer className="border-t">
                    <div className="mx-auto max-w-6xl px-4 py-6">
                        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                            <p className="text-sm text-muted-foreground">
                                Year 7 Student Placement System
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Ministry of Education
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
