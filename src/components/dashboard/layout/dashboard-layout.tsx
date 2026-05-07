'use client';

import { usePathname } from 'next/navigation';
import React from 'react';

import { useSession } from 'next-auth/react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui';
import { Separator } from '@/components/ui';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui';
import { AppSidebar } from '@/components/dashboard';

// Session user type
interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string;
}

// Dynamic breadcrumb component
function DynamicBreadcrumb() {
  const pathname = usePathname();

  // Split pathname and filter out empty strings
  const pathSegments = pathname.split('/').filter(Boolean);

  // Create breadcrumb items
  const breadcrumbItems = [];

  // Always start with Dashboard
  breadcrumbItems.push({
    label: 'Dashboard',
    href: '/dashboard',
    isLast: pathSegments.length === 0,
  });

  // Add path segments
  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathSegments.length - 1;

    // Convert segment to readable label
    const label = segment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    breadcrumbItems.push({
      label,
      href: currentPath,
      isLast,
    });
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={item.href}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

// Default navigation data — used by apps that don't provide their own
const createDefaultNavData = (user?: SessionUser) => ({
  title: 'sheigoldberg.com',
  url: '/',
  navMain: [
    {
      title: 'Public Site',
      url: '/',
    },
    {
      title: 'Profile',
      url: '/profile',
    },
    ...(user?.role && ['ADMIN', 'SUPER_ADMIN'].includes(user.role)
      ? [{ title: 'Admin', url: '/admin' }]
      : []),
    {
      title: 'Dashboard',
      url: '/dashboard',
      items: [{ title: 'Posts', url: '/dashboard/posts' }],
    },
  ],
});

export interface NavItem {
  title: string;
  url: string;
  items?: NavItem[];
}

export interface NavData {
  title: string;
  url: string;
  navMain: NavItem[];
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  /** Override the default sidebar nav. Apps should pass their own nav structure. */
  navData?: (user?: SessionUser) => NavData;
}

export default function DashboardLayout({ children, navData: navDataFn }: DashboardLayoutProps) {
  const { data: session } = useSession();

  const navData = navDataFn ? navDataFn(session?.user) : createDefaultNavData(session?.user);

  return (
    <SidebarProvider collapsible="offcanvas">
      <AppSidebar data={navData} collapsible="offcanvas" />
      <SidebarInset className="flex h-screen flex-col" data-sidebar-layout>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <DynamicBreadcrumb />

          {/* Navigation back to public site */}
          <div className="ml-auto flex items-center gap-2">
            <a
              href="/"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Site
            </a>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto bg-background">
          {/* Centered content with responsive max-width caps; pages can opt-out using max-w-none */}
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:max-w-4xl lg:px-8 xl:max-w-5xl">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
