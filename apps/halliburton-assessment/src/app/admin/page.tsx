// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Post } from '@/../../apps/backend/src/app/posts/entities/post.entity';
import useAuth from '../hooks/useAuth';
import { GemIcon, TrendingUp } from 'lucide-react';
import { Label, Pie, PieChart } from 'recharts';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { RainbowButton } from '@/components/ui/rainbow-button';
import AnimatedBeamDemo from './PwGemini';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import Image from 'next/image';

export default function AdminDashboard() {
  const { isAdmin, loading } = useAuth(true);

  const [posts, setPosts] = useState<Post[]>([]);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [restrictedPosts, setRestrictedPosts] = useState<Post[]>([]);
  const [usersWithRestrictedPosts, setUsersWithRestrictedPosts] = useState<
    User[]
  >([]);

  useEffect(() => {
    if (!loading) {
      fetch('http://localhost:8080/api/posts', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setPosts(data);
          // Filter posts containing restricted words
          const restricted = data.filter(
            (post: Post) => post.containsRestricted === true
          );
          setRestrictedPosts(restricted);
        })
        .catch((err) => console.error('Failed to fetch posts:', err));
    }
  }, [loading]);

  const deleteRestrictedPosts = async () => {
    try {
      const restrictedIds = restrictedPosts.map((post) => post.id);
      const response = await fetch(
        'http://localhost:8080/api/posts/bulk-delete',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify({ ids: restrictedIds }),
        }
      );

      if (!response.ok) throw new Error('Failed to delete restricted posts');

      alert('Restricted posts deleted successfully');
      setPosts((prev) =>
        prev.filter((post) => !restrictedIds.includes(post.id))
      );
      setRestrictedPosts([]);
    } catch (error) {
      console.error('Error deleting restricted posts:', error);
      alert('Failed to delete restricted posts');
    }
  };

  const chartConfig = {
    count: {
      label: 'Posts',
    },
    Restricted: {
      label: 'Restricted',
      color: 'hsl(var(--chart-1))',
    },
    'Non-Restricted': {
      label: 'Non-Restricted',
      color: 'hsl(var(--chart-2))',
    },
  } satisfies ChartConfig;

  const restrictedPostsCount = restrictedPosts.length;
  const chartData = [
    {
      type: 'Restricted',
      count: restrictedPostsCount,
      fill: 'hsl(var(--chart-1))',
    },
    {
      type: 'Non-Restricted',
      count: posts.length - restrictedPostsCount,
      fill: 'hsl(var(--chart-2))',
    },
  ];
  const totalPosts = posts.length;

  const postCounts: { [date: string]: number } = {};

  posts.forEach((post) => {
    const date = new Date(post.createdAt).toISOString().split('T')[0];
    postCounts[date] = (postCounts[date] || 0) + 1;
  });

  const formattedData = Object.entries(postCounts)
    .sort(
      ([date1], [date2]) =>
        new Date(date1).getTime() - new Date(date2).getTime()
    )
    .map(([date, count]) => ({
      date,
      posts: count,
    }));

  const chart2Config = {
    posts: {
      label: 'Posts',
      color: 'hsl(var(--chart-1))',
    },
  } satisfies ChartConfig;

  useEffect(() => {
    let _usersWithRestrictedPosts = posts.reduce((acc, post) => {
      if (post.containsRestricted) {
        // check if user already exists in the list
        const userExists = acc.find((user) => user.id === post.user.id);
        if (!userExists && post.user.role === 'USER') {
          acc.push(post.user);
        }
      }
      return acc;
    }, [] as User[]);

    let blockedUsers = [] as User[];
    fetch('http://localhost:8080/api/users/blocked', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        blockedUsers = data;
        _usersWithRestrictedPosts = [
          ..._usersWithRestrictedPosts,
          ...blockedUsers,
        ];
        setUsersWithRestrictedPosts(_usersWithRestrictedPosts);
      })
      .catch((err) => console.error('Failed to fetch blocked users:', err));

    //merge the two arrays
  }, [posts]);
  console.log('Users with restricted posts:', usersWithRestrictedPosts);

  const blockUser = async (userId: number, block: boolean) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/users/${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify({ isBlocked: block }),
        }
      );

      if (!response.ok) throw new Error('Failed to update user status');

      // Update user block status locally
      setUsersWithRestrictedPosts((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, isBlocked: block } : user
        )
      );
      alert(`User ${block ? 'blocked' : 'unblocked'} successfully.`);
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status.');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      {/* Page Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600">
          Analyze and manage posts with restricted content.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <Card className="col-span-2">
          <CardHeader className="items-center pb-0">
            <CardTitle>Post Analysis</CardTitle>
            <CardDescription>
              Breakdown of Restricted vs. Non-Restricted Posts
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[300px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="type"
                  innerRadius={80}
                  strokeWidth={5}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-bold"
                            >
                              {totalPosts.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground"
                            >
                              Total Posts
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col gap-2 text-sm">
            <div className="leading-none text-muted-foreground">
              Insights on restricted content across all posts.
            </div>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Posts Additions Per Day</CardTitle>
            <CardDescription>
              Showing daily additions for all posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chart2Config}>
              <AreaChart
                accessibilityLayer
                data={formattedData}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  }
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Area
                  dataKey="posts"
                  type="natural"
                  fill="var(--color-posts)"
                  fillOpacity={0.4}
                  stroke="var(--color-posts)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
          <CardFooter>
            <div className="flex w-full items-start gap-2 text-sm">
              <div className="grid gap-2">
                <div className="flex items-center gap-2 font-medium leading-none">
                  Total posts: {totalPosts.toLocaleString()}{' '}
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 leading-none text-muted-foreground">
                  Showing daily trends
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
        {/* Restricted Posts Section */}
        <Card className="p-4 border border-black">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Restricted Posts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {restrictedPosts.length > 0 && (
              <Button
                variant="destructive"
                className="w-full"
                onClick={deleteRestrictedPosts}
              >
                Delete All Restricted Posts
              </Button>
            )}
            <div className="space-y-4 overflow-y-auto max-h-[400px]">
              {restrictedPosts.length > 0 ? (
                restrictedPosts.map((post) => (
                  <Card key={post.id} className="pt-2">
                    <CardContent>
                      <h3 className="font-bold text-sm truncate">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 text-sm truncate">
                        {post.content}
                      </p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-gray-500 text-sm">
                  No restricted posts found.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="border border-sky-600 border-4 shadow-xl">
          <CardHeader>
            <AnimatedBeamDemo />
            <br />
            <CardTitle>Analyze Posts with Gemini</CardTitle>
            <CardDescription>
              Send a custom prompt to analyze all posts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              id="gemini-prompt"
              rows={5}
              placeholder="Enter your prompt here..."
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              onChange={(e) => setPrompt(e.target.value)}
            ></textarea>
            <RainbowButton
              className="mt-4 w-full"
              onClick={async () => {
                try {
                  const allPostsText = posts
                    .map((post) => `${post.title}\n${post.content}`)
                    .join('\n\n');
                  const body = JSON.stringify({
                    prompt: `${allPostsText}\n\n${prompt}`,
                  });

                  const response = await fetch(
                    'http://localhost:8080/api/gemini',
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem(
                          'access_token'
                        )}`,
                      },
                      body,
                    }
                  );

                  if (!response.ok) throw new Error('Failed to analyze posts');

                  const data = await response.json();
                  console.log('Gemini response:', data);
                  setResponse(data.text); // Assuming `setResponse` updates the UI with the response
                } catch (error) {
                  console.error('Error sending prompt:', error);
                  alert('Failed to send the prompt.');
                }
              }}
            >
              <Image
                src="/google-gemini-icon.webp"
                alt="Gemini"
                className="h-5 w-5 mr-2"
                width={20}
                height={20}
              />
              Send Prompt
            </RainbowButton>
            {response && (
              <div className="mt-4 p-2 border border-gray-300 rounded-md text-sm bg-gray-50">
                <h3 className="font-bold">Response:</h3>
                <p>{response || 'No response available.'}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Users with Restricted Posts</CardTitle>
            <CardDescription>Manage user access.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {usersWithRestrictedPosts.length > 0 ? (
              usersWithRestrictedPosts.map((user) => (
                <Card key={user?.id} className="pt-2">
                  <CardContent className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-sm mt-2 ">
                        {user?.firstName + ' ' + user?.lastName}
                      </h3>
                      <h3 className="text-gray-600 text-xs mb-2">
                        {user?.email}
                      </h3>
                      <p className="text-gray-600 text-xs">
                        {user?.isBlocked ? 'Blocked' : 'Active'}
                      </p>
                    </div>
                    <Button
                      variant={user?.isBlocked ? 'default' : 'destructive'}
                      size="sm"
                      onClick={() => blockUser(user.id, !user.isBlocked)}
                    >
                      {user?.isBlocked ? 'Unblock' : 'Block'}
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-gray-500 text-sm">
                No users with role USER with restricted posts found.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
