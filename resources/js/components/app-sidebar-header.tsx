import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import {
    type BreadcrumbItem as BreadcrumbItemType,
    type SharedData,
} from '@/types';
import { usePage } from '@inertiajs/react';
import { Bell, Search } from 'lucide-react';
import PlacementSearchDialog from './placement-search-dialog';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { auth } = usePage<SharedData>().props;
    const getInitials = useInitials();

    return (
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border/50 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 sm:px-6 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <div className="hidden sm:block">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </div>

            <div className="hidden flex-1 items-center justify-center px-4 md:flex">
                <PlacementSearchDialog
                    trigger={
                        <button
                            type="button"
                            className="relative w-full max-w-sm"
                            aria-label="Search placements"
                            data-test="global-search-trigger"
                        >
                            <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted/50 pr-12 pl-9 text-sm text-muted-foreground shadow-none hover:bg-muted">
                                <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <span>Search placements...</span>
                                <div className="pointer-events-none absolute top-2 right-2 hidden h-5 items-center gap-1 rounded border bg-background/50 px-1.5 text-[10px] font-medium text-muted-foreground sm:flex">
                                    <span className="text-xs">⌘</span>K
                                </div>
                            </div>
                        </button>
                    }
                />
            </div>

            <div className="flex items-center gap-2">
                <div className="md:hidden">
                    <PlacementSearchDialog
                        trigger={
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                aria-label="Search placements"
                            >
                                <Search className="h-4 w-4" />
                            </Button>
                        }
                    />
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                    <Bell className="h-4 w-4" />
                    <span className="sr-only">Notifications</span>
                    <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-red-500" />
                </Button>

                <AppearanceToggleDropdown className="flex items-center justify-center" />

                <div className="mx-1 h-4 w-px bg-border" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                        >
                            <Avatar className="h-8 w-8">
                                <AvatarImage
                                    src={auth.user.avatar}
                                    alt={auth.user.name}
                                />
                                <AvatarFallback className="text-xs">
                                    {getInitials(auth.user.name)}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="min-w-56 rounded-lg"
                    >
                        <UserMenuContent user={auth.user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
