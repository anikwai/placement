import AppLogoIcon from '@/components/app-logo-icon';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

import { useAppearance } from '@/hooks/use-appearance';
import { dashboard, home, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    FileSearch,
    GraduationCap,
    Moon,
    Search,
    Sun,
    Users,
    X,
} from 'lucide-react';
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

type SortField =
    | 'student_name'
    | 'national_student_id'
    | 'feeder_school_name'
    | 'year_7_placement_school_name';

export default function Welcome({ canRegister = true, stats }: Props) {
    const { auth, name, ui } = usePage<SharedData>().props;
    const { appearance, updateAppearance } = useAppearance();
    const logoText = ui?.logoText?.trim() || name;
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<StudentPlacement[]>([]);
    const [totalResults, setTotalResults] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [sortField] = useState<SortField>('national_student_id');
    const [sortDirection] = useState<'asc' | 'desc'>('asc');
    const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const performSearch = useCallback(async (query: string) => {
        if (query.length < 2) {
            setResults([]);
            setTotalResults(0);
            setHasSearched(false);
            setNextPageUrl(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(
                `/api/placements/search?q=${encodeURIComponent(query)}`,
            );
            const data = await response.json();
            setResults(data.data);
            setTotalResults(data.total);
            setNextPageUrl(data.next_page_url);
            setHasSearched(true);
        } catch {
            setResults([]);
            setTotalResults(0);
            setNextPageUrl(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loadMore = async () => {
        if (!nextPageUrl) return;

        setIsLoadingMore(true);
        try {
            // Append the query param if it's lost, though next_page_url usually has it.
            // Laravel's paginate().withQueryString() should handle it, but our API call didn't use withQueryString() explicitly on the manual paginator.
            // However, we are searching manually. The next_page_url might just be ?page=2. We need to ensure 'q' is there.

            const url = new URL(nextPageUrl);
            if (!url.searchParams.has('q')) {
                url.searchParams.append('q', search);
            }

            const response = await fetch(url.toString());
            const data = await response.json();

            setResults((prev) => [...prev, ...data.data]);
            setNextPageUrl(data.next_page_url);
        } catch {
            // Handle error silently or show toast
        } finally {
            setIsLoadingMore(false);
        }
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        if (value.length < 2) {
            setResults([]);
            setTotalResults(0);
            setHasSearched(false);
            setNextPageUrl(null);
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
        setTotalResults(0);
        setHasSearched(false);
        setNextPageUrl(null);
        searchInputRef.current?.focus();
    };

    const sortedResults = [...results].sort((a, b) => {
        const aValue = String(a[sortField]).toLowerCase();
        const bValue = String(b[sortField]).toLowerCase();
        if (sortDirection === 'asc') {
            return aValue.localeCompare(bValue);
        }
        return bValue.localeCompare(aValue);
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

    // Animation variants
    const fadeInUp = {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.8, ease: 'easeOut' },
    };

    const staggerContainer = {
        animate: {
            transition: {
                staggerChildren: 0.15,
            },
        },
    };

    return (
        <>
            <Head title="Year 7 Placement Results" />

            <div className="relative flex min-h-screen flex-col overflow-hidden bg-background font-sans text-foreground selection:bg-primary selection:text-primary-foreground">
                {/* Precision Geometric Background - Animated */}
                <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.25]"></div>

                    {/* Rotating Rings - Precision/Architectural Feel */}
                    <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] md:top-[40%] md:left-[50%] md:h-[800px] md:w-[800px] md:-translate-x-1/2 md:-translate-y-1/2">
                        {/* Ring 1 - Outer Dashed - Slower */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                                duration: 50,
                                repeat: Infinity,
                                ease: 'linear',
                            }}
                            className="absolute inset-0 rounded-full border border-dashed border-primary/20 opacity-60"
                        />
                        {/* Ring 2 - Middle Solid - Medium */}
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{
                                duration: 40,
                                repeat: Infinity,
                                ease: 'linear',
                            }}
                            className="absolute inset-[100px] rounded-full border border-border/60 opacity-40"
                        />
                        {/* Ring 3 - Inner Dashed - Faster */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                                duration: 30,
                                repeat: Infinity,
                                ease: 'linear',
                            }}
                            className="absolute inset-[200px] rounded-full border border-dashed border-primary/30 opacity-50"
                        />
                    </div>
                </div>

                {/* Header */}
                <header className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                        <Link href={home()} className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted text-foreground">
                                <AppLogoIcon className="size-5 fill-current text-foreground" />
                            </div>
                            <span className="text-sm font-bold tracking-tight">
                                {logoText}
                            </span>
                        </Link>

                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleTheme}
                                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                                aria-label="Toggle theme"
                            >
                                {appearance === 'dark' ? (
                                    <Sun className="h-4 w-4" />
                                ) : (
                                    <Moon className="h-4 w-4" />
                                )}
                            </Button>

                            <div className="h-4 w-px bg-border" />

                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <Link
                                        href={login()}
                                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        Log in
                                    </Link>
                                    {canRegister && (
                                        <Button
                                            asChild
                                            className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                                        >
                                            <Link href={register()}>
                                                Register
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="relative z-10 flex-1 pt-32 pb-20">
                    <motion.div
                        initial="initial"
                        animate="animate"
                        variants={staggerContainer}
                        className="mx-auto max-w-3xl px-6 text-center"
                    >
                        {/* Hero Badge - Solid & Crisp */}

                        <motion.div variants={fadeInUp}>
                            <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
                                Find student placements <br />
                                <span className="text-primary dark:text-blue-400">
                                    instantly.
                                </span>
                            </h1>
                        </motion.div>

                        <motion.div variants={fadeInUp}>
                            <p className="mx-auto mb-12 max-w-2xl text-xl leading-relaxed text-muted-foreground">
                                A secure, streamlined way to access Year 7
                                placement information using confirmed student
                                details.
                            </p>
                        </motion.div>

                        {/* Search Input - Clean & Boxy */}
                        <motion.div
                            variants={fadeInUp}
                            className="group relative mx-auto mb-12 max-w-xl"
                        >
                            <Search className="pointer-events-none absolute top-1/2 left-5 z-10 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                ref={searchInputRef}
                                type="text"
                                className="h-auto w-full rounded-lg border-border bg-background py-6 pr-14 pl-14 text-lg shadow-sm transition-shadow duration-300 placeholder:text-muted-foreground hover:shadow-md focus-visible:ring-primary dark:border-primary/30 dark:bg-muted/30"
                                placeholder="Search by name or ID..."
                                value={search}
                                onChange={(e) =>
                                    handleSearchChange(e.target.value)
                                }
                            />
                            {search && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={clearSearch}
                                    className="absolute top-1/2 right-2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </motion.div>

                        {search.length > 0 && search.length < 2 && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-sm text-muted-foreground"
                            >
                                Please enter at least 2 characters
                            </motion.p>
                        )}
                    </motion.div>

                    <div className="mx-auto mt-16 max-w-6xl px-6">
                        {/* Loading State */}
                        {isLoading && (
                            <div className="grid gap-4">
                                {[...Array(3)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between rounded-lg border border-border bg-background p-6"
                                    >
                                        <Skeleton className="h-5 w-32" />
                                        <Skeleton className="h-5 w-48" />
                                        <Skeleton className="h-5 w-24" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* No Results */}
                        {!isLoading && hasSearched && results.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <Card className="border-dashed border-border bg-background py-20 text-center shadow-none">
                                    <CardContent className="pt-6">
                                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                            <FileSearch className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="mb-2 text-lg font-bold text-foreground">
                                            No results found
                                        </h3>
                                        <p className="text-muted-foreground">
                                            We couldn't find any records
                                            matching "{search}".
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* Results Grid - Cards Layout */}
                        {!isLoading && sortedResults.length > 0 && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {sortedResults.map((student) => (
                                        <motion.div
                                            key={student.id}
                                            variants={fadeInUp}
                                            initial="initial"
                                            animate="animate"
                                        >
                                            <Card className="h-full border-border bg-card/50 transition-colors hover:border-primary/50 dark:border-white/5 dark:bg-muted/10">
                                                <CardContent className="flex h-full flex-col p-6">
                                                    {/* Header: Name & ID */}
                                                    <div className="mb-6 flex items-start justify-between">
                                                        <div>
                                                            <h3 className="text-lg leading-tight font-bold text-foreground">
                                                                {
                                                                    student.student_name
                                                                }
                                                            </h3>
                                                            <div className="mt-1 font-mono text-xs text-muted-foreground">
                                                                {
                                                                    student.national_student_id
                                                                }
                                                            </div>
                                                        </div>
                                                        <Badge
                                                            variant="outline"
                                                            className={`rounded-md border-0 bg-secondary/50 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${
                                                                student.gender ===
                                                                'M'
                                                                    ? 'text-blue-600 dark:text-blue-300'
                                                                    : 'text-rose-600 dark:text-rose-300'
                                                            }`}
                                                        >
                                                            {student.gender ===
                                                            'M'
                                                                ? 'Male'
                                                                : 'Female'}
                                                        </Badge>
                                                    </div>

                                                    {/* Result Section (Pushed to bottom) */}
                                                    <div className="mt-auto">
                                                        <span className="mb-1.5 block text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase">
                                                            Placed at
                                                        </span>
                                                        <div className="mb-3 text-xl leading-tight font-bold text-primary md:text-2xl dark:text-blue-400">
                                                            {
                                                                student.year_7_placement_school_name
                                                            }
                                                        </div>

                                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                            <span className="text-xs opacity-60">
                                                                from
                                                            </span>
                                                            <div className="flex items-center gap-1.5 font-medium text-foreground/80">
                                                                <GraduationCap className="h-3.5 w-3.5 opacity-70" />
                                                                <span className="line-clamp-1">
                                                                    {
                                                                        student.feeder_school_name
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Load More Button */}
                                {nextPageUrl && (
                                    <div className="flex justify-center pt-4">
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            onClick={loadMore}
                                            disabled={isLoadingMore}
                                            className="min-w-[200px] border-primary/20 transition-colors hover:bg-primary/5 hover:text-primary"
                                        >
                                            {isLoadingMore
                                                ? 'Loading...'
                                                : `Show More Results (${totalResults - results.length} remaining)`}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Default Stats & FAQ */}
                        {!isLoading && !hasSearched && (
                            <motion.div
                                variants={staggerContainer}
                                initial="initial"
                                animate="animate"
                            >
                                <div className="mb-32 grid grid-cols-1 gap-6 md:grid-cols-3">
                                    {[
                                        {
                                            label: 'Total Students',
                                            value: stats.totalStudents,
                                            icon: Users,
                                        },
                                        {
                                            label: 'Feeder Schools',
                                            value: stats.feederSchools,
                                            icon: GraduationCap,
                                        },
                                        {
                                            label: 'Placement Schools',
                                            value: stats.placementSchools,
                                            icon: FileSearch,
                                        },
                                    ].map((stat, i) => (
                                        <motion.div key={i} variants={fadeInUp}>
                                            <Card className="group relative border-border bg-background transition-colors duration-300 hover:border-primary/50 dark:border-white/10 dark:bg-muted/10">
                                                <CardContent className="p-6">
                                                    <div className="mb-4 flex items-center justify-between">
                                                        <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                                            {stat.label}
                                                        </span>
                                                        <stat.icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                                                    </div>
                                                    <div className="font-mono text-4xl font-bold tracking-tight text-foreground">
                                                        {stat.value.toLocaleString()}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>

                                <motion.div
                                    variants={fadeInUp}
                                    className="mx-auto max-w-3xl"
                                >
                                    <div className="mb-12 text-center">
                                        <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground">
                                            Frequently Asked Questions
                                        </h2>
                                    </div>

                                    <Accordion
                                        type="single"
                                        collapsible
                                        className="w-full space-y-4"
                                    >
                                        {[
                                            {
                                                question: 'How do I search?',
                                                answer: 'Enter full name, student ID, feeder school name, or year 7 placement school name in the search box above. Results will appear as you type once you enter at least 2 characters.',
                                            },
                                            {
                                                question:
                                                    'What is the Student ID format?',
                                                answer: 'UNOFFICIAL: Student IDs start with the letter "S" followed by 9 digits (e.g., S000000001). This ID is unique and is only used for this system.',
                                            },
                                            {
                                                question:
                                                    "What if I can't find my name?",
                                                answer: 'Verify the spelling of the name and try different variations. If still not found, please contact your feeder school for assistance.',
                                            },
                                            {
                                                question:
                                                    'Can I request a placement change?',
                                                answer: 'Placement changes are handled through the Ministry of Education. Contact your local education office for the appeals process.',
                                            },
                                        ].map((faq, i) => (
                                            <AccordionItem
                                                key={i}
                                                value={`item-${i}`}
                                                className="rounded-lg border border-border bg-background px-2 transition-colors last:border-b data-[state=open]:border-primary/50 dark:border-white/10 dark:bg-muted/10"
                                            >
                                                <AccordionTrigger className="px-4 py-5 text-base font-semibold transition-colors hover:no-underline [&[data-state=open]]:text-primary">
                                                    {faq.question}
                                                </AccordionTrigger>
                                                <AccordionContent className="px-4 pb-6 text-[15px] leading-relaxed text-muted-foreground">
                                                    {faq.answer}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </motion.div>
                            </motion.div>
                        )}
                    </div>
                </main>

                <footer className="mt-auto border-t border-border bg-background py-10">
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <AppLogoIcon className="size-4 fill-current" />
                            <p>
                                &copy; {new Date().getFullYear()}{' '}
                                <a
                                    href="https://github.com/anikwai/placement.git"
                                    className="font-semibold text-foreground/80 hover:text-foreground"
                                >
                                    {logoText}
                                </a>
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
