import { Inter, JetBrains_Mono, Vazirmatn } from "next/font/google";

const englishPrimaryFont = Inter({
  subsets: ["latin"],
  variable: "--font-en-primary",
  weight: ["100", "300", "400", "500", "700", "900"],
});

const englishMonoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-en-mono",
  weight: ["100", "300", "400", "500", "700"],
});

const persianPrimaryFont = Vazirmatn({
  subsets: ["latin"],
  variable: "--font-fa-primary",
  weight: ["100", "300", "400", "500", "700", "900"],
});

export { englishMonoFont, englishPrimaryFont, persianPrimaryFont };
