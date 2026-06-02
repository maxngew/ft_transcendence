"use client";

import { BookOpen, LockKeyhole, Menu, Scale, ShieldCheck, X } from "lucide-react";
import Image from "next/image";
import { Dialog } from "radix-ui";
import { useState } from "react";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { PlayerLogout, PlayerProfile } from "@/components/player-menu";
import { SidebarNav, type SidebarNavGroup } from "@/components/sidebar-nav";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

const legalIcons = {
  privacy: LockKeyhole,
  terms: Scale,
} as const;

type MobileNavigationProps = {
  avatarUrl?: string | null;
  brand: {
    logoAlt: string;
    name: string;
    subtitle: string;
  };
  groups: SidebarNavGroup[];
  isLoggedIn: boolean;
  labels: {
    closeMenu: string;
    description: string;
    login: string;
    openMenu: string;
    primary: string;
    rules: string;
    session: string;
    signup: string;
    title: string;
  };
  legalLinks: {
    href: string;
    icon: keyof typeof legalIcons;
    label: string;
  }[];
  username?: string;
};

export function MobileNavigation({
  avatarUrl,
  brand,
  groups,
  isLoggedIn,
  labels,
  legalLinks,
  username,
}: MobileNavigationProps) {
  const [open, setOpen] = useState(false);

  function closeDrawer() {
    setOpen(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <header className="mobile-topbar">
        <div className="flex min-w-0 items-center gap-1.5">
          <Dialog.Trigger asChild>
            <Button variant="ghost" size="icon" aria-label={labels.openMenu}>
              <Menu aria-hidden="true" className="size-5" />
            </Button>
          </Dialog.Trigger>

          <Link href="/" className="mobile-topbar-brand">
            <Image src="/icons/Gomoku.svg" alt={brand.logoAlt} width={36} height={36} priority />
            <span className="mobile-topbar-brand-name" translate="no">
              {brand.name}
            </span>
          </Link>
        </div>

        <div className="flex min-w-0 shrink-0 items-center gap-1">
          {isLoggedIn ? (
            <PlayerProfile
              username={username}
              avatarUrl={avatarUrl}
              className="max-w-24 sm:max-w-36"
            />
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">{labels.login}</Link>
            </Button>
          )}
          <LocaleSwitcher />
        </div>
      </header>

      <Dialog.Portal>
        <Dialog.Overlay className="mobile-nav-overlay" />
        <Dialog.Content className="mobile-nav-drawer">
          <div className="mobile-nav-drawer-header">
            <div>
              <p className="eyebrow mb-1">{brand.subtitle}</p>
              <Dialog.Title className="font-serif text-3xl leading-none font-black">
                {labels.title}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label={labels.closeMenu}>
                <X aria-hidden="true" className="size-5" />
              </Button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">{labels.description}</Dialog.Description>

          <SidebarNav groups={groups} ariaLabel={labels.primary} onNavigate={closeDrawer} />

          <div className="mt-auto grid gap-3 pt-5">
            <a
              href="https://en.wikipedia.org/wiki/Gomoku"
              className="sidebar-link sidebar-link-muted"
            >
              <BookOpen aria-hidden="true" className="size-4" />
              <span>{labels.rules}</span>
            </a>

            <nav className="grid gap-1" aria-label={labels.description}>
              {legalLinks.map(({ href, icon, label }) => {
                const Icon = legalIcons[icon];

                return (
                  <Link
                    key={href}
                    href={href}
                    className="sidebar-link sidebar-link-muted"
                    onClick={closeDrawer}
                  >
                    <Icon aria-hidden="true" className="size-4" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="sidebar-account">
              <div className="flex items-center justify-between gap-2 text-xs font-bold text-[var(--muted-strong)]">
                <div className="flex items-center gap-2">
                  <ShieldCheck aria-hidden="true" className="size-4 text-[var(--mint)]" />
                  <span>{labels.session}</span>
                </div>
                <LocaleSwitcher />
              </div>

              <div className="mt-3 flex w-full gap-2">
                {isLoggedIn ? (
                  <>
                    <PlayerProfile
                      username={username}
                      avatarUrl={avatarUrl}
                      className="flex-1 overflow-hidden"
                      onClick={closeDrawer}
                    />
                    <PlayerLogout iconOnly />
                  </>
                ) : (
                  <>
                    <Button asChild variant="ghost" size="sm" className="flex-1">
                      <Link href="/login" onClick={closeDrawer}>
                        {labels.login}
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="flex-1">
                      <Link href="/signup" onClick={closeDrawer}>
                        {labels.signup}
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
