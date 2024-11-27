'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { Post } from '@/../../apps/backend/src/app/posts/entities/post.entity';
import { title } from 'process';
import Link from 'next/link';
import Image from 'next/image';
import { url } from 'inspector';

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [addPostDialogOpen, setAddPostDialogOpen] = useState(false);
  const [containsCapitalCaseWords, setContainsCapitalCaseWords] =
    useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | undefined>(
    undefined
  );
  const [newPost, setNewPost] = useState<Partial<Post>>({
    title: '',
    content: '',
    thumbnail: undefined,
  });

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;

    setNewPost((prev) => ({ ...prev, [id]: value }));

    const capitalCaseRegex = /\b[A-Z][a-zA-Z]*[A-Z]\b/;
    const isCapitalCase =
      (id === 'title' && capitalCaseRegex.test(value)) ||
      (id === 'content' && capitalCaseRegex.test(value)) ||
      capitalCaseRegex.test(
        id === 'title' ? newPost.content || '' : newPost.title || ''
      );

    setContainsCapitalCaseWords(isCapitalCase);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setThumbnailFile(file);
  };

  const addPost = async () => {
    try {
      if (!newPost.title || !newPost.content) {
        alert('Please fill in all the fields: title and content');
        return;
      }
      let url;
      if (thumbnailFile) {
        const multipartFormData = new FormData();
        multipartFormData.append('file', thumbnailFile as Blob);

        const ssoResponse = await fetch('http://localhost:8080/api/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: multipartFormData,
        });
        const data = await ssoResponse.json();
        url = data.url;
      }

      console.log('New post:', {
        title: newPost.title,
        content: newPost.content,
        thumbnail: url ? url : newPost.thumbnail,
        userId: localStorage.getItem('user_id'),
      });
      const response = await fetch('http://localhost:8080/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          title: newPost.title,
          content: newPost.content,
          thumbnail: url ? url : newPost.thumbnail,
          userId: localStorage.getItem('user_id'),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add post');
      }

      const addedPost = await response.json();
      setPosts((prev) => [...prev, addedPost]); // Update posts list
      setNewPost({ title: '', content: '', thumbnail: undefined }); // Reset form
      alert('Post added successfully');
      url = '';
    } catch (err: any) {
      console.error('Error adding post:', err);
      alert('Failed to add post: ' + err.message);
    } finally {
      setAddPostDialogOpen(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Posts</h1>
        <div className="mb-6 flex justify-between items-center">
          <Dialog open={addPostDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="default"
                onClick={() => setAddPostDialogOpen(true)}
              >
                Add New Post
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a New Post</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Post title"
                    value={newPost.title}
                    onChange={handleInputChange}
                    required={true}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Write your post content here..."
                    value={newPost.content}
                    onChange={handleInputChange}
                    required={true}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="thumbnail">Thumbnail</Label>
                  <Input
                    id="thumbnail"
                    type="file"
                    onChange={handleFileChange}
                  />
                </div>
                {containsCapitalCaseWords && (
                  <div className="text-red-500 text-sm">
                    Warning: This post contains words starting and ending with
                    capital letters.
                  </div>
                )}
                <Button className="mt-4" onClick={addPost}>
                  Submit
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4 ">
        {posts.length === 0 && <div>No posts available.</div>}
        {posts.length !== 0 &&
          posts.map((post) => (
            <Link key={post.id} href={`/posts/${post.id}`}>
              <Card
                key={post.id}
                className="transition-all duration-300 hover:shadow-md hover:bg-slate-100"
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
            </Link>
          ))}
      </div>
    </div>
  );
}
