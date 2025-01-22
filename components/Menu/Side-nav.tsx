'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SIDENAV_ITEMS } from '@/constants';
import { Icon } from '@iconify/react';
import { SideNavItem } from '@/type/types';
import { useAuth } from '@/app/context/AuthContext';

const SideNav = () => {
  const { user } = useAuth();
  const userRole = user?.rol;
  
  return (
    <aside className="lg:w-60 bg-white h-screen fixed border-r border-zinc-200 hidden lg:block">
      <div className="flex flex-col h-full">
        <Link
          href="/"
          className="flex flex-row space-x-3 items-center justify-center lg:justify-start lg:px-6 border-b border-zinc-200 h-12 w-full flex-shrink-0"
        >
          <img src="/Image/logo.png" width={50} height={50} alt="Illustration" />
        </Link>
        <nav className="flex-1 overflow-y-auto">
          <div className="flex flex-col space-y-2 lg:px-6 py-4">
            {SIDENAV_ITEMS.filter(item => userRole !== undefined && item.roles?.includes(userRole)).map((item, idx) => {
              return <MenuItem key={idx} item={item} />;
            })}
          </div>
        </nav>
      </div>
    </aside>
  );
};
export default SideNav;

const MenuItem = ({ item }: { item: SideNavItem }) => {
  const pathname = usePathname();
  const [subMenuOpen, setSubMenuOpen] = useState(false);
  const toggleSubMenu = () => setSubMenuOpen(!subMenuOpen);

  return (
    <div>
      {item.submenu ? (
        <>
          <button
            onClick={toggleSubMenu}
            className={`flex flex-row items-center p-2 rounded-lg hover-bg-zinc-100 w-full justify-between hover:bg-zinc-100 ${pathname.includes(item.path) ? 'bg-zinc-100' : ''}`}
          >
            <div className="flex flex-row space-x-4 items-center">
              {item.icon}
              <span className="font-semibold text-xl flex">{item.title}</span>
            </div>
            <div className={`${subMenuOpen ? 'rotate-180' : ''} flex`}>
              <Icon icon="lucide:chevron-down" width="24" height="24" />
            </div>
          </button>

          {subMenuOpen && (
            <div className="my-2 ml-12 flex flex-col space-y-4">
              {item.subMenuItems?.map((subItem, idx) => (
                <Link
                  key={idx}
                  href={subItem.path}
                  className={`${subItem.path === pathname ? 'font-bold' : ''}`}
                >
                  <span>{subItem.title}</span>
                </Link>
              ))}
            </div>
          )}
        </>
      ) : (
        <Link
          href={item.path}
          className={`flex flex-row space-x-4 items-center p-2 rounded-lg hover:bg-zinc-100 ${item.path === pathname ? 'bg-zinc-200' : ''}`}
        >
          {item.icon}
          <span className="font-semibold text-xl flex">{item.title}</span>
        </Link>
      )}
    </div>
  );
};
