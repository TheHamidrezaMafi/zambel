import { SlideUpModalProvider } from '@/components/common/slide-up-modal';
import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { ThemeProvider } from 'next-themes';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>زمبیل</title>
      </Head>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SlideUpModalProvider>
          <Component {...pageProps} />
        </SlideUpModalProvider>
      </ThemeProvider>
    </>
  );
}
