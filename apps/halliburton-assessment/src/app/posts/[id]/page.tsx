'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { FileIcon, defaultStyles } from 'react-file-icon';
import ShinyButton from '@/components/ui/shiny-button';
import { LucideDownload } from 'lucide-react';
import ShineBorder from '@/components/ui/shine-border';

interface Post {
  id: number;
  title: string;
  content: string;
  thumbnail: string;
  attachments: string[];
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
        <Card className="mt-6 h-full w-3/4 self-center">
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
            <div className="mt-6">
              <Label className="text-lg font-semibold">Attachments:</Label>
              {post.attachments?.length > 0 ? (
                <div className="mt-2 pl-5 space-y-6">
                  {post.attachments?.map((attachment, index) => (
                    <span key={index} className="mt-4">
                      <div className="flex items-center">
                        <span className="inline-block mr-2 w-10">
                          <FileIcon
                            extension={attachment.split('.').pop()}
                            {...defaultStyles[attachment.split('.').pop()]}
                          />
                        </span>{' '}
                        <a
                          href={attachment}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 underline"
                        >
                          <ShinyButton className="inline-block">
                            <span className=" inline-block flex items-center">
                              <LucideDownload className="mr-2" />
                              {`Attachment ${index + 1}`}
                            </span>
                          </ShinyButton>
                        </a>
                      </div>
                      <br />
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No attachments available.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
