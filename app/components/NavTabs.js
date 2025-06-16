// app/components/NavTabs.js
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavTabs({ basePath, tabs }) {
  const pathname = usePathname();
  return (
    <div className="navigation m-b-3">
      {tabs.map(({ key, label }) => (
        <Link
          scroll={false}
          key={key}
          href={`${basePath}/${key}`}
        >
          <button
            type="button"
            className={pathname === `${basePath}/${key}` ? 'active' : ''}
          >
            {label}
          </button>
        </Link>
      ))}
    </div>
  );
}