'use client';
import { useParams } from 'next/navigation';

export default function Page() {
  const { id } = useParams();
  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      this is the post with id {id}
    </div>
  );
}
