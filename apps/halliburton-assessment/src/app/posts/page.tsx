'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Post } from '@/../../apps/backend/src/app/posts/entities/post.entity';

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    // Fetch posts from the backend
    fetch('http://localhost:8080/api/posts', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setPosts(data))
      .catch((err) => console.error('Failed to fetch posts:', err));
  }, []);

  const openDialog = (post: Post) => {
    setSelectedPost(post);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setSelectedPost(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Posts</h1>
        <Button variant="default">Add New Post</Button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {posts.length > 0 &&
          posts.map((post) => (
            <Card
              key={post.id}
              className="cursor-pointer"
              onClick={() => openDialog(post)}
            >
              <CardHeader>
                <img
                  src={post.thumbnail}
                  alt={post.title}
                  className="h-32 w-full object-cover rounded-md"
                />
              </CardHeader>
              <CardContent>
                <CardTitle>{post.title}</CardTitle>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Post Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedPost?.title}</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p>{selectedPost?.content}</p>
          </div>
          <div className="flex justify-end space-x-2 p-4">
            <Button variant="outline" onClick={closeDialog}>
              Close
            </Button>
            <Button variant="destructive">Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
