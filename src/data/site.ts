export const site = {
  name: 'tl y',
  tagline: '码成，梦成',
  hero: {
    title: '码成，梦成。',
    line: '用 Agent 把实践做成系统。',
  },
  description:
    'tl y 的中文个人站。深圳。公开写踩坑、工作流与小产品；用人机共生，把 AI 实践做成可复用系统。',
  location: '深圳',
  lang: 'zh-CN',
  github: {
    login: '1989tianlong',
    name: 'tianlong',
    url: 'https://github.com/1989tianlong',
    bio: '码成，梦成',
  },
  x: {
    username: 'ytlclaw',
    name: 'ytl · AI+观照',
    url: 'https://x.com/ytlclaw',
    bio: '行深智能波罗蜜多时，照见数据皆空… / Seeing that all computation is empty. AI surpasses the mind, not the Buddha.',
    pinnedUrl: 'https://x.com/i/status/2096178382174032125',
    pinned:
      '我用 Grok / Agent 把 AI 实践做成可复用系统。公开写：踩坑、工作流、小产品进展。',
  },
  hubs: {
    vitaminclaw: 'https://vitaminclaw.omniquest.fun',
    vitaminclawAlt: 'https://vitaminclaw.vercel.app',
  },
} as const;

export const nav = [
  { href: '/', label: '首页' },
  { href: '/now', label: '现在' },
  { href: '/projects', label: '项目' },
  { href: '/writing', label: '写作' },
  { href: '/about', label: '关于' },
] as const;

export function formatZhDate(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export function isCurrentPath(pathname: string, href: string): boolean {
  const current = pathname.replace(/\/$/, '') || '/';
  const target = href.replace(/\/$/, '') || '/';
  if (target === '/') return current === '/';
  return current === target || current.startsWith(`${target}/`);
}
