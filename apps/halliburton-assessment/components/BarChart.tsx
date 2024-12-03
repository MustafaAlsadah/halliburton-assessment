'use client';
import { TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

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
import { useEffect, useState } from 'react';

interface ApiChartFormat {
  id: number;
  user_fname: string;
  user_lname: string;
  n_restricted: number;
  n_non_restricted: number;
}

const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: 'hsl(var(--chart-1))',
  },
  mobile: {
    label: 'Mobile',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export default function Component() {
  const [chartData, setChartData] = useState<ApiChartFormat[]>([]);

  useEffect(() => {
    async function fetchData() {
      const apiData: ApiChartFormat[] = await (
        await fetch('http://localhost:8080/api/posts/chart-data', {
          headers: {
            Authorization: 'Bearer ' + localStorage.getItem('access_token'),
          },
        })
      ).json();
      apiData.forEach((data) => {
        data.user_fname = `${data.user_fname}\n${data.user_lname}`;
      });
      setChartData(apiData);
    }
    fetchData();
  }, []);

  // const chartData = [
  //   { month: 'January', desktop: 186, mobile: 80 },
  //   { month: 'February', desktop: 305, mobile: 200 },
  //   { month: 'March', desktop: 237, mobile: 120 },
  //   { month: 'April', desktop: 73, mobile: 190 },
  //   { month: 'May', desktop: 209, mobile: 130 },
  //   { month: 'June', desktop: 214, mobile: 140 },
  // ];

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>User/Post Analysis</CardTitle>
        <CardDescription>Showing posts counts</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData} barCategoryGap="20%">
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="user_fname"
              tickLine={true}
              tickMargin={10}
              //   angle={-45}
              amplitude={10}
              axisLine={false}
              // tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar
              dataKey="n_restricted"
              fill="var(--color-desktop)"
              radius={4}
            />
            <Bar
              dataKey="n_non_restricted"
              fill="var(--color-mobile)"
              radius={4}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
