'use client';
"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Brain, TrendingUp, Lightbulb, Users, RefreshCw, Target } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AIInsight {
  id: string
  memberId: string
  insightType: "PERFORMANCE" | "OPPORTUNITY" | "RECOMMENDATION" | "PATTERN"
  title: string
  content: string
  recommendations: any
  createdAt: string
}

interface MemberMatch {
  member1: {
    id: string
    name: string
    industry: string
  }
  member2: {
    id: string
    name: string
    industry: string
  }
  matchScore: number
  reason: string
}

interface PerformanceAnalysis {
  memberId: string
  memberName: string
  industry: string
  overallScore: number
  referralScore: number
  tyfcbScore: number
  attendanceScore: number
  oneToOneScore: number
  trend: "UP" | "DOWN" | "STABLE"
}

export default function AIInsightsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [memberMatches, setMemberMatches] = useState<MemberMatch[]>([])
  const [performanceAnalysis, setPerformanceAnalysis] = useState<PerformanceAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchAIInsights()
    }
  }, [status])

  const fetchAIInsights = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/ai-insights")
      const data = await response.json()
      setInsights(data.insights || [])
      setMemberMatches(data.matches || [])
      setPerformanceAnalysis(data.performance || [])
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch AI insights",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateInsights = async () => {
    try {
      setGenerating(true)
      const response = await fetch("/api/ai-insights/generate", {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "AI insights generated successfully",
        })
        fetchAIInsights()
      } else {
        throw new Error("Failed to generate insights")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate AI insights",
      })
    } finally {
      setGenerating(false)
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "PERFORMANCE":
        return <TrendingUp className="h-5 w-5 text-blue-500" />
      case "OPPORTUNITY":
        return <Target className="h-5 w-5 text-green-500" />
      case "RECOMMENDATION":
        return <Lightbulb className="h-5 w-5 text-yellow-500" />
      case "PATTERN":
        return <Brain className="h-5 w-5 text-purple-500" />
      default:
        return <Brain className="h-5 w-5" />
    }
  }

  const getInsightBadgeColor = (type: string) => {
    switch (type) {
      case "PERFORMANCE":
        return "bg-blue-100 text-blue-800"
      case "OPPORTUNITY":
        return "bg-green-100 text-green-800"
      case "RECOMMENDATION":
        return "bg-yellow-100 text-yellow-800"
      case "PATTERN":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "UP":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "DOWN":
        return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
      default:
        return <div className="h-4 w-4 text-gray-500" />
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6 pt-20">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                AI Insights
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Performance analysis, recommendations, and member matching
              </p>
            </div>
            <Button onClick={generateInsights} disabled={generating}>
              <RefreshCw className={`mr-2 h-4 w-4 ${generating ? "animate-spin" : ""}`} />
              {generating ? "Generating..." : "Generate Insights"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Insights</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insights.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Member Matches</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{memberMatches.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance Scores</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceAnalysis.length}</div>
              </CardContent>
            </Card>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <Tabs defaultValue="insights" className="w-full">
              <TabsList>
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="matching">Member Matching</TabsTrigger>
              </TabsList>

              <TabsContent value="insights" className="space-y-4">
                {insights.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12 text-gray-500">
                      <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No AI insights available yet.</p>
                      <p className="text-sm mt-2">Click "Generate Insights" to create AI-powered insights.</p>
                    </CardContent>
                  </Card>
                ) : (
                  insights.map((insight) => (
                    <Card key={insight.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {getInsightIcon(insight.insightType)}
                            <div>
                              <CardTitle className="text-lg">{insight.title}</CardTitle>
                              <CardDescription>
                                {new Date(insight.createdAt).toLocaleDateString()}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge className={getInsightBadgeColor(insight.insightType)}>
                            {insight.insightType}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">{insight.content}</p>
                        {insight.recommendations && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <Lightbulb className="h-4 w-4" />
                              Recommendations
                            </h4>
                            <ul className="space-y-1 text-sm">
                              {Array.isArray(insight.recommendations) ? (
                                insight.recommendations.map((rec: string, index: number) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <span className="text-blue-500">•</span>
                                    <span>{rec}</span>
                                  </li>
                                ))
                              ) : (
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-500">•</span>
                                  <span>{String(insight.recommendations)}</span>
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                {performanceAnalysis.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12 text-gray-500">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No performance analysis available yet.</p>
                      <p className="text-sm mt-2">Click "Generate Insights" to analyze member performance.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Member Performance Analysis</CardTitle>
                      <CardDescription>AI-powered performance scores and trends</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {performanceAnalysis.map((member, index) => (
                          <div key={index} className="border-b pb-4 last:border-0">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-semibold">{member.memberName}</h4>
                                <p className="text-sm text-muted-foreground">{member.industry}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {getTrendIcon(member.trend)}
                                <span className="text-2xl font-bold">{member.overallScore}%</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Referrals</p>
                                <Progress value={member.referralScore} className="h-2" />
                                <p className="text-sm font-medium mt-1">{member.referralScore}%</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">TYFCB</p>
                                <Progress value={member.tyfcbScore} className="h-2" />
                                <p className="text-sm font-medium mt-1">{member.tyfcbScore}%</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Attendance</p>
                                <Progress value={member.attendanceScore} className="h-2" />
                                <p className="text-sm font-medium mt-1">{member.attendanceScore}%</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">One-to-Ones</p>
                                <Progress value={member.oneToOneScore} className="h-2" />
                                <p className="text-sm font-medium mt-1">{member.oneToOneScore}%</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="matching" className="space-y-4">
                {memberMatches.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No member matches available yet.</p>
                      <p className="text-sm mt-2">Click "Generate Insights" to find potential member matches.</p>
                    </CardContent>
                  </Card>
                ) : (
                  memberMatches.map((match, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Member Match #{index + 1}</span>
                          <Badge variant="secondary">{match.matchScore}% Match</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-center flex-1">
                            <p className="font-semibold">{match.member1.name}</p>
                            <p className="text-sm text-muted-foreground">{match.member1.industry}</p>
                          </div>
                          <div className="flex items-center gap-2 px-4">
                            <div className="h-0.5 w-8 bg-gray-300"></div>
                            <Users className="h-5 w-5 text-blue-500" />
                            <div className="h-0.5 w-8 bg-gray-300"></div>
                          </div>
                          <div className="text-center flex-1">
                            <p className="font-semibold">{match.member2.name}</p>
                            <p className="text-sm text-muted-foreground">{match.member2.industry}</p>
                          </div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4" />
                            Why This Match?
                          </h4>
                          <p className="text-sm">{match.reason}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </>
  )
}
