'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import {
  Users,
  ArrowUpRight,
  DollarSign,
  Handshake,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  totalMembers: number;
  totalInsideReferrals: number;
  totalOutsideReferrals: number;
  totalReferrals: number;
  totalTYFCB: number;
  totalOneToOneVisits: number;
  totalVisitors: number;
  totalCEU: number;
  attendanceRate: number;
  totalActivities: number;
}

interface TopPerformer {
  memberId: string;
  memberName?: string;
  referrals?: number;
  tyfcb?: number;
  oneToOnes?: number;
}

interface DashboardData {
  summary: DashboardStats;
  topPerformers: {
    referrers: TopPerformer[];
    tyfcb: TopPerformer[];
    oneToOnes: TopPerformer[];
  };
  trends: any[];
  period: { weekNumber?: number; year: number };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedWeek]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const url = selectedWeek
        ? `/api/dashboard/summary?weekNumber=${selectedWeek}`
        : '/api/dashboard/summary';
      const response = await fetch(url);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = data?.summary;
  const topReferrers = data?.topPerformers?.referrers || [];
  const topTYFCB = data?.topPerformers?.tyfcb || [];
  const topOneToOnes = data?.topPerformers?.oneToOnes || [];

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6 pt-20">
        <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            BNI Dashboard
          </h1>
          <div className="flex items-center gap-2">
            <select
              value={selectedWeek || ''}
              onChange={(e) => setSelectedWeek(e.target.value ? parseInt(e.target.value) : null)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="">All Time</option>
              {data?.trends?.map((t: any) => (
                <option key={t.weekNumber} value={t.weekNumber}>
                  Week {t.weekNumber}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Total Members"
                value={stats?.totalMembers || 0}
                icon={<Users className="h-6 w-6 text-blue-600" />}
                trend={null}
              />
              <KPICard
                title="Total Referrals"
                value={stats?.totalReferrals || 0}
                icon={<Handshake className="h-6 w-6 text-green-600" />}
                trend={
                  stats?.totalReferrals && stats.totalReferrals > 0 ? '+12%' : null
                }
              />
              <KPICard
                title="Total TYFCB"
                value={`¥${(stats?.totalTYFCB || 0).toLocaleString()}`}
                icon={<DollarSign className="h-6 w-6 text-purple-600" />}
                trend={
                  stats?.totalTYFCB && stats.totalTYFCB > 0 ? '+8%' : null
                }
              />
              <KPICard
                title="One-to-One Visits"
                value={stats?.totalOneToOneVisits || 0}
                icon={<Calendar className="h-6 w-6 text-orange-600" />}
                trend={
                  stats?.totalOneToOneVisits && stats.totalOneToOneVisits > 0 ? '+5%' : null
                }
              />
              <KPICard
                title="Visitors"
                value={stats?.totalVisitors || 0}
                icon={<Users className="h-6 w-6 text-pink-600" />}
                trend={null}
              />
              <KPICard
                title="Attendance Rate"
                value={`${stats?.attendanceRate || 0}%`}
                icon={<TrendingUp className="h-6 w-6 text-cyan-600" />}
                trend={
                  stats?.attendanceRate && stats.attendanceRate > 80 ? '+2%' : null
                }
              />
              <KPICard
                title="CEU Points"
                value={stats?.totalCEU || 0}
                icon={<ArrowUpRight className="h-6 w-6 text-indigo-600" />}
                trend={null}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Referral Trends */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Referral Trends
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data?.trends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="weekNumber" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="totalReferrals" stroke="#2563eb" strokeWidth={2} />
                    <Line type="monotone" dataKey="totalTYFCB" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Activity Breakdown */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Activity Breakdown
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Inside Referrals', value: stats?.totalInsideReferrals || 0, fill: '#2563eb' },
                        { name: 'Outside Referrals', value: stats?.totalOutsideReferrals || 0, fill: '#8b5cf6' },
                        { name: 'One-to-Ones', value: stats?.totalOneToOneVisits || 0, fill: '#f97316' },
                        { name: 'Visitors', value: stats?.totalVisitors || 0, fill: '#ec4899' },
                      ]}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                      {['#2563eb', '#8b5cf6', '#f97316', '#ec4899'].map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Weekly Attendance Rate */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Weekly Attendance Rate
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data?.trends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="weekNumber" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="attendanceRate" fill="#10b981" name="Attendance Rate (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* CEU Trends */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  CEU Trends
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data?.trends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="weekNumber" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="totalCEU" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Referrers */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Top Referrers
                </h2>
                <div className="space-y-3">
                  {topReferrers.slice(0, 5).map((performer, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {performer.memberName || `Member ${performer.memberId}`}
                          </p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-green-600">
                        {performer.referrals}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top TYFCB */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Top TYFCB
                </h2>
                <div className="space-y-3">
                  {topTYFCB.slice(0, 5).map((performer, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {performer.memberName || `Member ${performer.memberId}`}
                          </p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-purple-600">
                        ¥{(performer.tyfcb || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top One-to-Ones */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Top One-to-Ones
                </h2>
                <div className="space-y-3">
                  {topOneToOnes.slice(0, 5).map((performer, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {performer.memberName || `Member ${performer.memberId}`}
                          </p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-orange-600">
                        {performer.oneToOnes}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      </div>
    </>
  );
}

function KPICard({ title, value, icon, trend }: { title: string; value: string | number; icon: React.ReactNode; trend: string | null }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {icon}
          {trend && (
            <span className="text-sm font-medium text-green-600 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
