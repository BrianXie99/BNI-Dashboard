'use client';
"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileSpreadsheet, Calendar, CheckCircle2, AlertCircle, Map } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ColumnMappingDialog } from "@/components/activities/column-mapping-dialog"

export default function ActivitiesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [activityDate, setActivityDate] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string; details?: any } | null>(null)
  
  // Column mapping state
  const [showMappingDialog, setShowMappingDialog] = useState(false)
  const [excelColumns, setExcelColumns] = useState<any[]>([])
  const [sampleData, setSampleData] = useState<any[]>([])
  const [parsedFile, setParsedFile] = useState<File | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ]
      if (!validTypes.includes(selectedFile.type)) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload an Excel file (.xlsx or .xls)",
        })
        setFile(null)
        return
      }
      setFile(selectedFile)
      setParsedFile(selectedFile)
      setUploadResult(null)
    }
  }

  const handleParseAndMap = async () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select an Excel file to upload",
      })
      return
    }

    if (!activityDate) {
      toast({
        variant: "destructive",
        title: "Activity date required",
        description: "Please enter activity date",
      })
      return
    }

    // Validate date format (YYYYMMDD)
    const dateRegex = /^\d{4}\d{2}\d{2}$/
    if (!dateRegex.test(activityDate)) {
      toast({
        variant: "destructive",
        title: "Invalid date format",
        description: "Please use YYYYMMDD format (e.g., 20260205)",
      })
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/activities/upload/weekly/parse", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setExcelColumns(result.columns)
        setSampleData(result.sampleData)
        setShowMappingDialog(true)
      } else {
        toast({
          variant: "destructive",
          title: "Parse failed",
          description: result.error || "Failed to parse Excel file",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to parse Excel file",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleMappingConfirm = async (mapping: Record<string, string>) => {
    if (!parsedFile) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", parsedFile)
      formData.append("activityDate", activityDate)
      formData.append("uploadedBy", session?.user?.email || "admin")
      formData.append("mapping", JSON.stringify(mapping))

      const response = await fetch("/api/activities/upload/weekly/with-mapping", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setUploadResult({
          success: true,
          message: "Weekly activities uploaded successfully!",
          details: result,
        })
        toast({
          title: "Success",
          description: `${result.uploaded} activities uploaded for Week ${result.weekNumber}`,
        })
        setFile(null)
        setParsedFile(null)
        setActivityDate("")
      } else {
        setUploadResult({
          success: false,
          message: result.error || "Failed to upload activities",
        })
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: result.error || "Something went wrong",
        })
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message: "Network error. Please try again.",
      })
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload activities",
      })
    } finally {
      setUploading(false)
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
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Upload Weekly Activities
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Upload your weekly BNI activity data from Excel
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Upload Form */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Upload Excel File
                </CardTitle>
                <CardDescription>
                  Upload weekly activity data in Excel format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* File Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="file">Excel File</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="file"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        disabled={uploading}
                        className="flex-1"
                      />
                      {file && (
                        <div className="text-sm text-green-600 font-medium">
                          {file.name}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Activity Date */}
                  <div className="space-y-2">
                    <Label htmlFor="activityDate">
                      Activity Date (YYYYMMDD)
                    </Label>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <Input
                        id="activityDate"
                        placeholder="20260205"
                        value={activityDate}
                        onChange={(e) => setActivityDate(e.target.value)}
                        disabled={uploading}
                        maxLength={8}
                        pattern="\d{8}"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Enter date in YYYYMMDD format (e.g., 20260205 for Feb 5, 2026)
                    </p>
                  </div>

                  {/* Upload Button */}
                  <Button
                    type="button"
                    className="w-full"
                    onClick={handleParseAndMap}
                    disabled={uploading || !file || !activityDate}
                  >
                    <Map className="mr-2 h-4 w-4" />
                    {uploading ? "Parsing..." : "Map & Upload"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Upload Result */}
            {uploadResult && (
              <Card className={`shadow-lg ${uploadResult.success ? "border-green-200" : "border-red-200"}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {uploadResult.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    {uploadResult.success ? "Upload Successful" : "Upload Failed"}
                  </CardTitle>
                  <CardDescription>
                    {uploadResult.message}
                  </CardDescription>
                </CardHeader>
                {uploadResult.success && uploadResult.details && (
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Activities Uploaded:</span>
                        <span className="font-medium">
                          {uploadResult.details.uploaded}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Week Number:</span>
                        <span className="font-medium">
                          {uploadResult.details.weekNumber}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Year:</span>
                        <span className="font-medium">
                          {uploadResult.details.year}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Instructions Card */}
            <Card className="md:col-span-2 shadow-lg">
              <CardHeader>
                <CardTitle>Excel File Format</CardTitle>
                <CardDescription>
                  Your Excel file should contain the following columns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-2 text-sm">Required Columns:</h3>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• 名称 (Name)</li>
                      <li>• 出席情况 (Attendance)</li>
                      <li>• 提供内部引荐 (Provide Inside Referrals)</li>
                      <li>• 提供外部引荐 (Provide Outside Referrals)</li>
                      <li>• 收到内部引荐 (Receive Inside Referrals)</li>
                      <li>• 收到外部引荐 (Receive Outside Referrals)</li>
                      <li>• 来宾 (Visitors)</li>
                      <li>• 一对一会面 (One-to-One Meetings)</li>
                      <li>• 交易价值 (TYFCB)</li>
                      <li>• CEU</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-sm">Optional Columns:</h3>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• 身份 (Identity)</li>
                    </ul>
                    <h3 className="font-semibold mb-2 mt-4 text-sm">Notes:</h3>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Use the "Map & Upload" button to map columns</li>
                      <li>• Column mapping templates can be saved for reuse</li>
                      <li>• Members are matched by Name</li>
                      <li>• Duplicate entries are skipped</li>
                      <li>• Weekly report is auto-generated</li>
                      <li>• Date format: YYYYMMDD</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Column Mapping Dialog */}
      <ColumnMappingDialog
        open={showMappingDialog}
        onOpenChange={setShowMappingDialog}
        columns={excelColumns}
        sampleData={sampleData}
        onConfirm={handleMappingConfirm}
        onCancel={() => setShowMappingDialog(false)}
      />
    </>
  )
}
