import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lexiwise · IELTS 词汇专家档案',
  description:
    '将 IELTS 练习词表转换为可用于阅读、写作和口语的深度词汇学习档案。',
  openGraph: {
    title: 'Lexiwise · IELTS 词汇专家档案',
    description:
      '将 IELTS 练习 JSON 词表转为可信度明确、可用于阅读、写作和口语的专家学习档案。',
    siteName: 'Lexiwise IELTS Vocab Lab',
    type: 'website',
    images: [
      {
        url: '/og.png',
        width: 1730,
        height: 909,
        alt: 'Lexiwise IELTS Vocab Lab',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lexiwise · IELTS 词汇专家档案',
    description: '从词汇列表到真实输出。',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
