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
import jsPDF from 'jspdf';
import useAuth from '../hooks/useAuth.ts';

import { Post } from '@/../../apps/backend/src/app/posts/entities/post.entity';
import Link from 'next/link';
import {
  LucideCopyX,
  LucideFile,
  LucideFileUp,
  LucidePlusSquare,
  LucideSquare,
  LucideSquareX,
} from 'lucide-react';

export default function PostsPage() {
  const { isAdmin, loading } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [addPostDialogOpen, setAddPostDialogOpen] = useState(false);
  const [selectedPostIds, setSelectedPostIds] = useState<number[]>([]);

  const [containsCapitalCaseWords, setContainsCapitalCaseWords] =
    useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | undefined>(
    undefined
  );
  const [newPost, setNewPost] = useState<Partial<Post>>({
    title: '',
    content: '',
    thumbnail: undefined,
    attachments: [],
  });

  useEffect(() => {
    if (!loading) {
      // Fetch posts from the backend
      fetch('http://localhost:8080/api/posts', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      })
        .then((res) => res.json())
        .then((data) => setPosts(data))
        .catch((err) => console.error('Failed to fetch posts:', err));
    }
  }, [loading]);

  const handleEditPost = (post: Post) => {
    setNewPost(post); // Prepopulate the form with post data
    setAddPostDialogOpen(true);
  };

  const togglePostSelection = (postId: number) => {
    setSelectedPostIds(
      (prev) =>
        prev.includes(postId)
          ? prev.filter((id) => id !== postId) // Remove if exists
          : [...prev, postId] // Add if not exists
    );
  };

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

  const handleAttachmentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewPost((prev) => ({
        ...prev,
        attachments: [
          ...(prev.attachments || []),
          ...Array.from(e.target.files),
        ], // Merge new and existing attachments
      }));
    }
  };

  const deleteSelectedPosts = async (ids?: number[]) => {
    try {
      const postIds = ids ? ids : selectedPostIds;
      console.log('Deleting posts:', ids);
      const response = await fetch(
        'http://localhost:8080/api/posts/bulk-delete',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify({ ids: postIds }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error('Failed to delete posts: ' + error.message);
      }

      setPosts((prev) =>
        prev.filter((post) => {
          return ids
            ? !ids.includes(post.id)
            : !selectedPostIds.includes(post.id);
        })
      );
      alert('Selected posts deleted successfully');
      setSelectedPostIds([]); // Clear selected posts
    } catch (error) {
      console.error('Error deleting selected posts:', error);
      alert('Failed to delete selected posts: ' + error.message);
    }
  };

  const addPost = async () => {
    try {
      const method = newPost.id ? 'PATCH' : 'POST';
      const endpoint = newPost.id
        ? `http://localhost:8080/api/posts/${newPost.id}`
        : `http://localhost:8080/api/posts`;

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

      const attachmentsUrls: string[] = [];
      if (newPost.attachments) {
        for (const file of newPost.attachments || []) {
          const multipartFormData = new FormData();
          multipartFormData.append('file', file);

          const ssoResponse = await fetch('http://localhost:8080/api/upload', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            },
            body: multipartFormData,
          });
          const data = await ssoResponse.json();
          console.log('Data:', data);
          attachmentsUrls.push(data.url);
        }
      }

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          title: newPost.title,
          content: newPost.content,
          thumbnail: url ? url : newPost.thumbnail,
          attachments: newPost.id
            ? [
                ...(newPost.attachments || []).filter(
                  (a) => typeof a === 'string'
                ),
                ...attachmentsUrls.filter((a) => typeof a === 'string'),
              ]
            : attachmentsUrls,

          userId: localStorage.getItem('user_id'),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add post');
      }

      const addedPost = await response.json();
      !newPost.id && setPosts((prev) => [...prev, addedPost]); // Update posts list
      console.log('New post:', addedPost);
      newPost.id &&
        setPosts((prev) =>
          prev.map((p) => (p.id === newPost.id ? addedPost : p))
        );
      setNewPost({
        title: '',
        content: '',
        thumbnail: undefined,
        attachments: [],
      }); // Reset form
      alert('Post added successfully');
      url = '';
    } catch (err: any) {
      console.error('Error adding post:', err);
      alert('Failed to add post: ' + err.message);
    } finally {
      setAddPostDialogOpen(false);
    }
  };

  const exportPostsToPDF = (ids?: number[]) => {
    const postIds = ids ? ids : selectedPostIds;
    if (postIds.length === 0) {
      alert('No posts to export');
      return;
    }
    const filteredPosts = posts.filter((post) => postIds.includes(post.id));

    const doc = new jsPDF();

    filteredPosts.forEach((post, index) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(post.title, 10, 10 + index * 30);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      const lines = doc.splitTextToSize(post.content, 180);
      doc.text(lines, 10, 20 + index * 30);

      if (index !== filteredPosts.length - 1) {
        doc.addPage();
      }
    });

    doc.save('posts.pdf'); // Save as a PDF
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Posts</h1>
        <div className="mb-6 flex justify-between items-center">
          <Dialog open={addPostDialogOpen}>
            <Button
              variant="default"
              className="mr-2 bg-blue-500 text-white hover:bg-blue-600"
              onClick={() => exportPostsToPDF(posts.map((post) => post.id))}
            >
              <LucideFileUp className="mr-2" />
              Export posts to PDF
            </Button>
            {selectedPostIds.length > 0 && (
              <Button
                variant="default"
                className="mr-2 bg-orange-400 text-white hover:bg-orange-500"
                onClick={() => {
                  deleteSelectedPosts();
                }}
              >
                <LucideSquareX className="mr-2" />
                Delete selected
              </Button>
            )}
            <Button
              variant="destructive"
              className="mr-2"
              onClick={() => {
                deleteSelectedPosts(posts.map((post) => post.id));
              }}
            >
              <LucideCopyX className="mr-2" />
              Delete All Posts
            </Button>
            <DialogTrigger asChild>
              <Button
                variant="default"
                onClick={() => setAddPostDialogOpen(true)}
              >
                <LucidePlusSquare className="mr-2" />
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
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
                <div>
                  <Label htmlFor="attachments">Attachments</Label>
                  <Input
                    id="attachments"
                    type="file"
                    onChange={handleAttachmentsChange}
                    multiple
                    accept="*"
                  />
                  <div className="mt-2">
                    <ul className="list-disc pl-4">
                      {newPost.attachments?.map((file, index) => (
                        <li key={index} className="text-sm text-gray-600">
                          {file.name}
                        </li>
                      ))}
                    </ul>
                  </div>
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
          posts?.map((post) => (
            <div className="relative" key={post.id}>
              <input
                type="checkbox"
                className="absolute top-2 left-2 z-10"
                checked={selectedPostIds.includes(post.id)}
                onChange={(e) => {
                  e.stopPropagation(); // Prevent conflict with Link click
                  togglePostSelection(post.id);
                }}
              />

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
                  <CardContent className="flex justify-between flex-col items-">
                    <div className="flex justify-between items-center">
                      <CardTitle>{post.title}</CardTitle>
                      <Button
                        type="button"
                        variant="outline"
                        className="ml-2"
                        onClick={(e) => {
                          e.preventDefault();
                          handleEditPost(post);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                    {isAdmin && (
                      <p className="text-sm text-gray-500 mt-2 mb-0">
                        <hr className="my-2 border-gray-300 border-t" />
                        By: {post?.user?.firstName + ' ' + post?.user?.lastName}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
      </div>
    </div>
  );
}
