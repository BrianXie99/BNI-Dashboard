'use client';
"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, FileText, TrendingUp, Users, DollarSign, Calendar, FileDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface WeeklyReport {
  id: string
  weekNumber: number
  year: number
  startTime: string
  endTime: string
  totalMembers: number
  totalReferrals: number
  totalTYFCB: number
  totalOneToOneVisits: number
  totalVisitors: number
  totalCEU: number
  attendanceRate: number
  createdAt: string
}

interface MemberActivity {
  memberName: string
  memberNumber: string
  industry: string
  referrals: number
  tyfcb: number
  oneToOnes: number
  visitors: number
  attendance: string
}

interface IndustryReport {
  industry: string
  totalMembers: number
  totalReferrals: number
  totalTYFCB: number
  totalOneToOneVisits: number
  totalVisitors: number
  totalCEU: number
  attendanceCount: number
  attendanceRate: number
}

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([])
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [memberActivities, setMemberActivities] = useState<MemberActivity[]>([])
  const [industryReports, setIndustryReports] = useState<IndustryReport[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("weekly")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchWeeklyReports()
    }
  }, [status, selectedYear])

  useEffect(() => {
    if (selectedWeek !== null) {
      fetchMemberActivities()
    }
  }, [selectedWeek])

  useEffect(() => {
    if (status === "authenticated") {
      fetchIndustryReports()
    }
  }, [status, selectedYear, selectedWeek])

  const fetchWeeklyReports = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reports/weekly?year=${selectedYear}`)
      const data = await response.json()
      setWeeklyReports(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch weekly reports",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchMemberActivities = async () => {
    try {
      const response = await fetch(`/api/reports/activities?weekNumber=${selectedWeek}&year=${selectedYear}`)
      const data = await response.json()
      setMemberActivities(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch member activities",
      })
    }
  }

  const fetchIndustryReports = async () => {
    try {
      const params = new URLSearchParams({ year: selectedYear.toString() })
      if (selectedWeek !== null) {
        params.append('weekNumber', selectedWeek.toString())
      }
      const response = await fetch(`/api/reports/industry?${params.toString()}`)
      const data = await response.json()
      if (data.success) {
        setIndustryReports(data.data)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch industry reports",
      })
    }
  }

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No data to export",
      })
      return
    }

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((header) => {
          const value = row[header]
          return typeof value === "string" ? `"${value}"` : value
        }).join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Success",
      description: "Report exported successfully",
    })
  }

  const exportToPDF = (data: any[], filename: string, title: string) => {
    if (data.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No data to export",
      })
      return
    }

    try {
      const doc = new jsPDF()
      
      // Add title
      doc.setFontSize(18)
      doc.setFont("helvetica", "bold")
      doc.text(title, 14, 20)
      
      // Add timestamp
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30)
      
      // Add table
      const headers = Object.keys(data[0])
      const tableData = data.map((row) => headers.map((header) => row[header]))
      
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 40,
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
      })
      
      // Save PDF
      doc.save(`${filename}.pdf`)
      
      toast({
        title: "Success",
        description: "PDF exported successfully",
      })
    } catch (error) {
      console.error("PDF export error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to export PDF",
      })
    }
  }

  const exportWeeklyReport = () => {
    const report = weeklyReports.find((r) => r.weekNumber === selectedWeek)
    if (!report) return

    const exportData = [
      {
        "Week Number": report.weekNumber,
        Year: report.year,
        "Start Date": new Date(report.startTime).toLocaleDateString(),
        "End Date": new Date(report.endTime).toLocaleDateString(),
        "Total Members": report.totalMembers,
        "Total Referrals": report.totalReferrals,
        "Total TYFCB": report.totalTYFCB,
        "Total One-to-Ones": report.totalOneToOneVisits,
        "Total Visitors": report.totalVisitors,
        "Total CEU": report.totalCEU,
        "Attendance Rate": `${report.attendanceRate}%`,
      },
    ]

    exportToCSV(exportData, `weekly-report-week-${report.weekNumber}-${report.year}`)
  }

  const exportMemberActivities = () => {
    exportToCSV(
      memberActivities.map((m) => ({
        "Member Name": m.memberName,
        "Member Number": m.memberNumber,
        Industry: m.industry,
        Referrals: m.referrals,
        TYFCB: m.tyfcb,
        "One-to-Ones": m.oneToOnes,
        Visitors: m.visitors,
        Attendance: m.attendance,
      })),
      `member-activities-week-${selectedWeek}-${selectedYear}`
    )
  }

  const exportAllReports = () => {
    exportToCSV(
      weeklyReports.map((r) => ({
        "Week Number": r.weekNumber,
        Year: r.year,
        "Start Date": new Date(r.startTime).toLocaleDateString(),
        "End Date": new Date(r.endTime).toLocaleDateString(),
        "Total Members": r.totalMembers,
        "Total Referrals": r.totalReferrals,
        "Total TYFCB": r.totalTYFCB,
        "Total One-to-Ones": r.totalOneToOneVisits,
        "Total Visitors": r.totalVisitors,
        "Total CEU": r.totalCEU,
        "Attendance Rate": `${r.attendanceRate}%`,
      })),
      `all-reports-${selectedYear}`
    )
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const selectedReport = weeklyReports.find((r) => r.weekNumber === selectedWeek)

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6 pt-20">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Reports
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Weekly summaries and performance reports
              </p>
            </div>
            <Button onClick={exportAllReports}>
              <Download className="mr-2 h-4 w-4" />
              Export All Reports
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Weeks</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{weeklyReports.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {weeklyReports.reduce((sum, r) => sum + r.totalReferrals, 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total TYFCB</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${weeklyReports.reduce((sum, r) => sum + r.totalTYFCB, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Weekly Reports</CardTitle>
                  <CardDescription>Select a year and week to view detailed reports</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedWeek?.toString() || ""} onValueChange={(v) => setSelectedWeek(v ? parseInt(v) : null)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Select week" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Weeks</SelectItem>
                      {weeklyReports.map((report) => (
                        <SelectItem key={report.id} value={report.weekNumber.toString()}>
                          Week {report.weekNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : weeklyReports.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No reports found for {selectedYear}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Week</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Referrals</TableHead>
                        <TableHead>TYFCB</TableHead>
                        <TableHead>One-to-Ones</TableHead>
                        <TableHead>Visitors</TableHead>
                        <TableHead>CEU</TableHead>
                        <TableHead>Attendance</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {weeklyReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">Week {report.weekNumber}</TableCell>
                          <TableCell>
                            {new Date(report.startTime).toLocaleDateString()} -{" "}
                            {new Date(report.endTime).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{report.totalMembers}</TableCell>
                          <TableCell>{report.totalReferrals}</TableCell>
                          <TableCell>${report.totalTYFCB.toLocaleString()}</TableCell>
                          <TableCell>{report.totalOneToOneVisits}</TableCell>
                          <TableCell>{report.totalVisitors}</TableCell>
                          <TableCell>{report.totalCEU}</TableCell>
                          <TableCell>{report.attendanceRate.toFixed(1)}%</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedWeek(report.weekNumber)
                                exportToCSV(
                                  [{
                                    "Week Number": report.weekNumber,
                                    Year: report.year,
                                    "Start Date": new Date(report.startTime).toLocaleDateString(),
                                    "End Date": new Date(report.endTime).toLocaleDateString(),
                                    "Total Members": report.totalMembers,
                                    "Total Referrals": report.totalReferrals,
                                    "Total TYFCB": report.totalTYFCB,
                                    "Total One-to-Ones": report.totalOneToOneVisits,
                                    "Total Visitors": report.totalVisitors,
                                    "Total CEU": report.totalCEU,
                                    "Attendance Rate": `${report.attendanceRate}%`,
                                  }],
                                  `weekly-report-week-${report.weekNumber}-${report.year}`
                                )
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedReport && (
            <Tabs defaultValue="summary" className="w-full" value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="activities">Member Activities</TabsTrigger>
                <TabsTrigger value="industry">By Industry</TabsTrigger>
              </TabsList>
              <TabsContent value="summary" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Week {selectedReport.weekNumber} Summary</CardTitle>
                        <CardDescription>
                          {new Date(selectedReport.startTime).toLocaleDateString()} -{" "}
                          {new Date(selectedReport.endTime).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={exportWeeklyReport} variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          CSV
                        </Button>
                        <Button onClick={() => {
                          const exportData = [{
                            "Week Number": selectedReport.weekNumber,
                            Year: selectedReport.year,
                            "Start Date": new Date(selectedReport.startTime).toLocaleDateString(),
                            "End Date": new Date(selectedReport.endTime).toLocaleDateString(),
                            "Total Members": selectedReport.totalMembers,
                            "Total Referrals": selectedReport.totalReferrals,
                            "Total TYFCB": selectedReport.totalTYFCB,
                            "Total One-to-Ones": selectedReport.totalOneToOneVisits,
                            "Total Visitors": selectedReport.totalVisitors,
                            "Total CEU": selectedReport.totalCEU,
                            "Attendance Rate": `${selectedReport.attendanceRate}%`,
                          }]
                          exportToPDF(exportData, `weekly-report-week-${selectedReport.weekNumber}-${selectedReport.year}`, `Week ${selectedReport.weekNumber} Summary`)
                        }} variant="outline" size="sm">
                          <FileDown className="mr-2 h-4 w-4" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Members</p>
                        <p className="text-2xl font-bold">{selectedReport.totalMembers}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Referrals</p>
                        <p className="text-2xl font-bold">{selectedReport.totalReferrals}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total TYFCB</p>
                        <p className="text-2xl font-bold">${selectedReport.totalTYFCB.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Attendance Rate</p>
                        <p className="text-2xl font-bold">{selectedReport.attendanceRate.toFixed(1)}%</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">One-to-Ones</p>
                        <p className="text-2xl font-bold">{selectedReport.totalOneToOneVisits}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Visitors</p>
                        <p className="text-2xl font-bold">{selectedReport.totalVisitors}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total CEU</p>
                        <p className="text-2xl font-bold">{selectedReport.totalCEU}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="activities">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Member Activities</CardTitle>
                        <CardDescription>Detailed activity breakdown for week {selectedReport.weekNumber}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={exportMemberActivities} variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          CSV
                        </Button>
                        <Button onClick={() => {
                          const exportData = memberActivities.map((m) => ({
                            "Member Name": m.memberName,
                            "Member Number": m.memberNumber,
                            Industry: m.industry,
                            Referrals: m.referrals,
                            TYFCB: m.tyfcb,
                            "One-to-Ones": m.oneToOnes,
                            Visitors: m.visitors,
                            Attendance: m.attendance,
                          }))
                          exportToPDF(exportData, `member-activities-week-${selectedWeek}-${selectedYear}`, `Member Activities - Week ${selectedWeek}`)
                        }} variant="outline" size="sm">
                          <FileDown className="mr-2 h-4 w-4" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Member Name</TableHead>
                            <TableHead>Member Number</TableHead>
                            <TableHead>Industry</TableHead>
                            <TableHead>Referrals</TableHead>
                            <TableHead>TYFCB</TableHead>
                            <TableHead>One-to-Ones</TableHead>
                            <TableHead>Visitors</TableHead>
                            <TableHead>Attendance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {memberActivities.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                No activity data available
                              </TableCell>
                            </TableRow>
                          ) : (
                            memberActivities.map((activity, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{activity.memberName}</TableCell>
                                <TableCell>{activity.memberNumber}</TableCell>
                                <TableCell>{activity.industry}</TableCell>
                                <TableCell>{activity.referrals}</TableCell>
                                <TableCell>${activity.tyfcb.toLocaleString()}</TableCell>
                                <TableCell>{activity.oneToOnes}</TableCell>
                                <TableCell>{activity.visitors}</TableCell>
                                <TableCell>{activity.attendance}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="industry">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Industry Reports</CardTitle>
                        <CardDescription>Performance breakdown by industry</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => exportToCSV(industryReports, `industry-reports-${selectedYear}`)} variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          CSV
                        </Button>
                        <Button onClick={() => {
                          const exportData = industryReports.map((r) => ({
                            Industry: r.industry,
                            "Total Members": r.totalMembers,
                            "Total Referrals": r.totalReferrals,
                            "Total TYFCB": r.totalTYFCB,
                            "Total One-to-Ones": r.totalOneToOneVisits,
                            "Total Visitors": r.totalVisitors,
                            "Total CEU": r.totalCEU,
                            "Attendance Rate": `${r.attendanceRate.toFixed(1)}%`,
                          }))
                          exportToPDF(exportData, `industry-reports-${selectedYear}`, `Industry Reports - ${selectedYear}`)
                        }} variant="outline" size="sm">
                          <FileDown className="mr-2 h-4 w-4" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Industry</TableHead>
                            <TableHead>Members</TableHead>
                            <TableHead>Referrals</TableHead>
                            <TableHead>TYFCB</TableHead>
                            <TableHead>One-to-Ones</TableHead>
                            <TableHead>Visitors</TableHead>
                            <TableHead>CEU</TableHead>
                            <TableHead>Attendance Rate</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {industryReports.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                                No industry data available
                              </TableCell>
                            </TableRow>
                          ) : (
                            industryReports.map((report, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{report.industry}</TableCell>
                                <TableCell>{report.totalMembers}</TableCell>
                                <TableCell>{report.totalReferrals}</TableCell>
                                <TableCell>${report.totalTYFCB.toLocaleString()}</TableCell>
                                <TableCell>{report.totalOneToOneVisits}</TableCell>
                                <TableCell>{report.totalVisitors}</TableCell>
                                <TableCell>{report.totalCEU}</TableCell>
                                <TableCell>{report.attendanceRate.toFixed(1)}%</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </>
  )
}
