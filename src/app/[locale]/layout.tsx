import { NextIntlClientProvider } from "next-intl";
import { Suspense } from "react";

import { appLayoutViewport } from "@/constants/viewport";
import Providers from "@/providers";
import { englishMonoFont, englishPrimaryFont, persianPrimaryFont } from "@/utils/font";

import "../../../public/styles/globals.css";

import { getLocale, getMessages } from "next-intl/server";

import type { PropsWithChildren, ReactElement } from "react";

export const metadata = {
  description: "Felesh Documentation",
  icons: { icon: [{ href: "/favicon.ico", url: "/favicon.ico" }] },
  title: "Felesh Documentation"
};

export const viewport = appLayoutViewport;

export default async function RootLayout({ children }: PropsWithChildren): Promise<ReactElement> {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      className={`${persianPrimaryFont.variable} ${englishPrimaryFont.variable} ${englishMonoFont.variable}`}
      dir={locale === "fa" ? "rtl" : "ltr"}
      lang={locale}
      suppressHydrationWarning
    >
      <body className={locale === "fa" ? persianPrimaryFont.className : englishPrimaryFont.className}>
        <Suspense fallback={<div />}>
          <NextIntlClientProvider messages={messages}>
            <Providers>{children}</Providers>
          </NextIntlClientProvider>
        </Suspense>
      </body>
    </html>
  );
}
