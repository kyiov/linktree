import React from 'react';
import { LinkItem } from '../types/linktree';
import { LinkCard } from './LinkCard';

interface LinkListProps {
  links: LinkItem[];
}

export const LinkList: React.FC<LinkListProps> = ({ links }) => {
  return (
    <div className="w-full flex flex-col gap-4 my-2">
      {links.map((link, idx) => (
        <LinkCard key={link.id} link={link} index={idx} />
      ))}
    </div>
  );
};
