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

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
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
    if (e.target.files && e.target.files[0]) {
      setNewPost((prev) => ({ ...prev, thumbnail: e.target.files![0] }));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // if (e.target.files && e.target.files[0]) {
    //   const file = e.target.files[0];
    //   // Prepare form data for Cloudinary upload
    //   const formData = new FormData();
    //   formData.append('file', file);
    //   formData.append('upload_preset', 'your_upload_preset'); // Replace with your Cloudinary upload preset
    //   formData.append('cloud_name', 'your_cloud_name'); // Replace with your Cloudinary cloud name
    //   try {
    //     // Upload the image to Cloudinary
    //     const response = await fetch(`https://api.cloudinary.com/v1_1/your_cloud_name/image/upload`, {
    //       method: 'POST',
    //       body: formData,
    //     });
    //     if (!response.ok) {
    //       throw new Error('Failed to upload image to Cloudinary');
    //     }
    //     const data = await response.json();
    //     // Update the newPost state with the uploaded image URL
    //     setNewPost((prev) => ({ ...prev, thumbnail: data.secure_url })); // Cloudinary's secure URL
    //   } catch (error) {
    //     console.error('Error uploading image:', error);
    //   }
    // }
  };

  const addPost = async () => {
    const postData = {
      title: newPost.title,
      content: newPost.content,
      thumbnail: newPost.thumbnail,
    };

    try {
      const response = await fetch('http://localhost:8080/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          title: newPost.title,
          content: newPost.content,
          thumbnail: newPost.thumbnail,
          userId: localStorage.getItem('user_id'),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add post');
      }

      const addedPost = await response.json();
      setPosts((prev) => [...prev, addedPost]); // Update posts list
      setNewPost({ title: '', content: '', thumbnail: undefined }); // Reset form
    } catch (err) {
      console.error('Error adding post:', err);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Posts</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="default">Add New Post</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a New Post</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="heading">Heading</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Post title"
                  value={newPost.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Write your post content here..."
                  value={newPost.content}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="thumbnail">Thumbnail</Label>
                <Input id="thumbnail" type="file" onChange={handleFileChange} />
              </div>
              <Button className="mt-4" onClick={addPost}>
                Submit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
                  <p>{post.content}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
      </div>
    </div>
  );
}
