import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=League+Spartan:wght@600;700&family=Figtree:wght@400;600;700&display=swap" rel="stylesheet" />
        <meta name="description" content="IDAGHA Secondary School Class of 2018 Alumni — reunions, elections, class awards, memories and transparent finances." />
        <meta name="theme-color" content="#0a0f0d" />
        <link rel="icon" href="/logo.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
