'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
interface Post {
  id: number;
  title: string;
  content: string;
  thumbnail: string;
}

export default function PostDetails() {
  const params = useParams();
  const router = useRouter();

  const id = params?.id as string;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    // Fetch post details from the backend
    const fetchPost = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/posts/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch post');
        }
        const data = await response.json();
        setPost(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!post) {
    return <div>No post found.</div>;
  }

  return (
    <div className="p-6">
      <Button variant="outline" onClick={() => router.back()}>
        Go Back
      </Button>
      <div className="flex justify-center">
        <Card className="mt-6 h-screen w-3/4 self-center">
          <CardHeader>
            <img
              src={post.thumbnail}
              alt={post.title}
              className="h-64 w-full object-cover rounded-lg border-2 border-gray-300"
            />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl font-bold">{post.title}</CardTitle>
            <p className="mt-4">{post.content}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
