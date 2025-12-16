import { Button } from '@/components/ui/button';
import {
    Command,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import { search as placementsSearch } from '@/routes/placements';
import { router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { type ReactElement, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface PlacementSearchResult {
    id: number;
    national_student_id: string;
    student_name: string;
    gender: string;
    feeder_school_name: string;
    year_7_placement_school_name: string;
}

interface PlacementSearchResponse {
    data: PlacementSearchResult[];
}

function currentPlacementFilters(): {
    per_page?: number;
    academic_year?: string;
    from?: string;
    to?: string;
} {
    if (typeof window === 'undefined') {
        return {};
    }

    const params = new URL(window.location.href).searchParams;
    const perPage = params.get('per_page');
    const academicYear = params.get('academic_year');
    const from = params.get('from');
    const to = params.get('to');

    return {
        per_page: perPage ? parseInt(perPage, 10) : undefined,
        academic_year: academicYear || undefined,
        from: from || undefined,
        to: to || undefined,
    };
}

interface PlacementSearchDialogProps {
    trigger?: ReactElement;
}

export default function PlacementSearchDialog({
    trigger,
}: PlacementSearchDialogProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PlacementSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const requestControllerRef = useRef<AbortController | null>(null);

    const close = () => {
        requestControllerRef.current?.abort();
        requestControllerRef.current = null;

        setOpen(false);
        setQuery('');
        setResults([]);
        setLoading(false);
        setHasSearched(false);
        setError(null);
    };

    const performSearch = (value: string) => {
        if (!open) {
            return;
        }

        const trimmed = value.trim();

        requestControllerRef.current?.abort();
        requestControllerRef.current = null;

        if (trimmed.length < 2) {
            setResults([]);
            setLoading(false);
            setHasSearched(false);
            return;
        }

        setLoading(true);
        setHasSearched(true);

        const controller = new AbortController();
        requestControllerRef.current = controller;

        fetch(placementsSearch.url({ query: { q: trimmed } }), {
            signal: controller.signal,
        })
            .then((response) => response.json())
            .then((data: PlacementSearchResponse) => {
                if (requestControllerRef.current !== controller) {
                    return;
                }

                setResults(data.data ?? []);
            })
            .catch((fetchError) => {
                if (fetchError?.name === 'AbortError') {
                    return;
                }

                if (requestControllerRef.current !== controller) {
                    return;
                }

                setResults([]);
                setError('Search failed. Please try again.');
            })
            .finally(() => {
                if (requestControllerRef.current !== controller) {
                    return;
                }

                setLoading(false);
            });
    };

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (open) {
                    event.preventDefault();
                    close();
                }

                return;
            }

            if (
                !(event.metaKey || event.ctrlKey) ||
                event.key.toLowerCase() !== 'k'
            ) {
                return;
            }

            if (open) {
                event.preventDefault();
                close();
                return;
            }

            const target = event.target as HTMLElement | null;
            const isEditable =
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target?.getAttribute('contenteditable') === 'true';

            if (isEditable) {
                return;
            }

            event.preventDefault();
            setOpen(true);
        };

        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const timeout = setTimeout(() => {
            inputRef.current?.focus();
        }, 0);

        return () => {
            clearTimeout(timeout);
        };
    }, [open]);

    const navigateToDashboard = (search: string) => {
        const filters = currentPlacementFilters();

        router.get(
            dashboard().url,
            {
                ...filters,
                search: search.trim() || undefined,
            },
            { preserveScroll: true },
        );

        close();
    };

    const canSearch = query.trim().length >= 2;

    return (
        <Popover
            open={open}
            onOpenChange={(nextOpen) => {
                if (nextOpen) {
                    setOpen(true);
                    return;
                }

                close();
            }}
        >
            {open &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div
                        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                        aria-hidden="true"
                        onClick={close}
                        data-test="global-search-overlay"
                    />,
                    document.body,
                )}
            <PopoverTrigger asChild>
                {trigger ?? (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="group h-9 w-9 cursor-pointer"
                        data-test="global-search-trigger"
                    >
                        <Search className="!size-5 opacity-80 group-hover:opacity-100" />
                        <span className="sr-only">Search placements</span>
                    </Button>
                )}
            </PopoverTrigger>
            <PopoverContent
                className={
                    trigger
                        ? 'w-[calc(100vw-2rem)] p-0 sm:w-[var(--radix-popover-trigger-width)] sm:max-w-lg'
                        : 'w-[calc(100vw-2rem)] max-w-md p-0 sm:w-[420px]'
                }
                align={trigger ? 'start' : 'end'}
                side="bottom"
                sideOffset={8}
                collisionPadding={16}
                data-test="global-search-dialog"
            >
                <Command shouldFilter={false} className="overflow-hidden">
                    <div className="border-b p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-foreground">
                                    Search placements
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Powered by Typesense
                                </div>
                            </div>
                            <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
                                <kbd className="rounded border bg-background px-1.5 py-0.5">
                                    Esc
                                </kbd>
                                <span>close</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <CommandInput
                            ref={inputRef}
                            value={query}
                            onValueChange={(value) => {
                                setQuery(value);
                                setError(null);
                                performSearch(value);
                            }}
                            placeholder="Search name, ID, or school…"
                            className="pr-9"
                            data-test="global-search-input"
                            onKeyDown={(event) => {
                                if (event.key !== 'Enter') {
                                    return;
                                }

                                const hasActiveDescendant =
                                    event.currentTarget.getAttribute(
                                        'aria-activedescendant',
                                    ) !== null;

                                if (
                                    hasActiveDescendant ||
                                    !canSearch ||
                                    loading ||
                                    error
                                ) {
                                    return;
                                }

                                event.preventDefault();
                                if (results.length > 0) {
                                    navigateToDashboard(
                                        results[0].student_name,
                                    );
                                    return;
                                }

                                navigateToDashboard(query);
                            }}
                        />
                        {loading && (
                            <Spinner className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" />
                        )}
                    </div>

                    <CommandList className="max-h-[min(45vh,340px)]">
                        {error && (
                            <div
                                className="px-2 py-3 text-sm text-destructive"
                                data-test="global-search-error"
                            >
                                {error}
                            </div>
                        )}

                        {!loading &&
                            !hasSearched &&
                            query.trim().length === 0 && (
                                <div className="px-2 py-10 text-center text-sm text-muted-foreground">
                                    Start typing to search placements.
                                </div>
                            )}

                        {loading && (
                            <div className="p-2">
                                <div className="flex flex-col gap-2">
                                    {Array.from({ length: 6 }).map(
                                        (_, index) => (
                                            <div
                                                key={index}
                                                className="flex flex-col gap-2 rounded-md px-2 py-2"
                                            >
                                                <Skeleton className="h-4 w-2/3" />
                                                <Skeleton className="h-3 w-5/6" />
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        )}

                        {!loading &&
                            hasSearched &&
                            canSearch &&
                            results.length === 0 &&
                            !error && (
                                <div
                                    className="px-2 py-8 text-center text-sm text-muted-foreground"
                                    data-test="global-search-empty"
                                >
                                    No results.
                                </div>
                            )}

                        {!loading && query.trim().length > 0 && !canSearch && (
                            <div className="px-2 py-8 text-center text-sm text-muted-foreground">
                                Type at least 2 characters to search.
                            </div>
                        )}

                        {!loading && results.length > 0 && (
                            <CommandGroup heading="Results">
                                {results.map((result) => (
                                    <CommandItem
                                        key={result.id}
                                        value={`${result.student_name} ${result.national_student_id} ${result.feeder_school_name} ${result.year_7_placement_school_name}`}
                                        onSelect={() =>
                                            navigateToDashboard(
                                                result.student_name,
                                            )
                                        }
                                        className="flex flex-col items-start gap-1 py-2"
                                        data-test="global-search-result"
                                    >
                                        <div className="flex w-full items-start justify-between gap-2">
                                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                                                <div className="truncate font-medium text-foreground">
                                                    {result.student_name}
                                                </div>
                                                <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                                                    {result.national_student_id}
                                                </code>
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {result.feeder_school_name} →{' '}
                                            {
                                                result.year_7_placement_school_name
                                            }
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>

                    <div className="flex items-center justify-between gap-2 border-t bg-muted/20 p-2">
                        <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
                            <kbd className="rounded border bg-background px-1.5 py-0.5">
                                Enter
                            </kbd>
                            <span>select</span>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={close}
                            >
                                Close
                            </Button>
                            <Button
                                type="button"
                                onClick={() => navigateToDashboard(query)}
                                disabled={!query.trim()}
                            >
                                View results
                            </Button>
                        </div>
                    </div>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
