'use client';
"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Trash2, Upload, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Member {
  id: string
  phoneId: string
  memberNumber: string
  name: string
  industry: string
  master: string | null
  joinDate: string
  status: "ACTIVE" | "INACTIVE"
  createdAt: string
  updatedAt: string
}

export default function MembersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [members, setMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [formData, setFormData] = useState({
    phoneId: "",
    memberNumber: "",
    name: "",
    industry: "",
    master: "",
    joinDate: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchMembers()
    }
  }, [status])

  useEffect(() => {
    if (searchQuery) {
      const filtered = members.filter(
        (member) =>
          member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.memberNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.industry.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredMembers(filtered)
    } else {
      setFilteredMembers(members)
    }
  }, [searchQuery, members])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/members")
      const data = await response.json()
      setMembers(data)
      setFilteredMembers(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch members",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingMember(null)
    setFormData({
      phoneId: "",
      memberNumber: "",
      name: "",
      industry: "",
      master: "",
      joinDate: new Date().toISOString().split("T")[0],
      status: "ACTIVE",
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (member: Member) => {
    setEditingMember(member)
    setFormData({
      phoneId: member.phoneId,
      memberNumber: member.memberNumber,
      name: member.name,
      industry: member.industry,
      master: member.master || "",
      joinDate: member.joinDate.split("T")[0],
      status: member.status,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this member?")) return

    try {
      const response = await fetch(`/api/members?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Member deleted successfully",
        })
        fetchMembers()
      } else {
        throw new Error("Failed to delete member")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete member",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingMember ? "/api/members" : "/api/members"
      const method = editingMember ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          editingMember
            ? { ...formData, id: editingMember.id }
            : formData
        ),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: editingMember
            ? "Member updated successfully"
            : "Member created successfully",
        })
        setIsDialogOpen(false)
        fetchMembers()
      } else {
        throw new Error("Failed to save member")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save member",
      })
    }
  }

  const handleUpload = async () => {
    if (!uploadFile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a file to upload",
      })
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append("file", uploadFile)

      const response = await fetch("/api/members/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: data.message,
        })
        setIsUploadDialogOpen(false)
        setUploadFile(null)
        fetchMembers()
      } else {
        throw new Error(data.error || "Failed to upload file")
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to upload file",
      })
    } finally {
      setUploading(false)
    }
  }

  const downloadTemplate = () => {
    // Create a sample Excel template using xlsx library
    const XLSX = require("xlsx")

    const template = [
      {
        Phone_ID: "1234567890",
        Member_Number: "M001",
        Name: "John Doe",
        Industry: "Technology",
        Master: "Jane Smith",
        Join_Date: "2024-01-01",
        Status: "ACTIVE",
      },
      {
        Phone_ID: "0987654321",
        Member_Number: "M002",
        Name: "Jane Smith",
        Industry: "Finance",
        Master: "",
        Join_Date: "2024-02-01",
        Status: "ACTIVE",
      },
    ]

    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Members")
    XLSX.writeFile(wb, "members_template.xlsx")

    toast({
      title: "Success",
      description: "Template downloaded successfully",
    })
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
                Members
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your BNI members
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Bulk Upload
              </Button>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member Number</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Master</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No members found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">{member.memberNumber}</TableCell>
                          <TableCell>{member.name}</TableCell>
                          <TableCell>{member.industry}</TableCell>
                          <TableCell>{member.master || "-"}</TableCell>
                          <TableCell>
                            {new Date(member.joinDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={member.status === "ACTIVE" ? "default" : "secondary"}
                            >
                              {member.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(member)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(member.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingMember ? "Edit Member" : "Add New Member"}
              </DialogTitle>
              <DialogDescription>
                {editingMember
                  ? "Update the member details below."
                  : "Fill in the details to add a new member."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="memberNumber">Member Number</Label>
                  <Input
                    id="memberNumber"
                    value={formData.memberNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, memberNumber: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phoneId">Phone ID</Label>
                  <Input
                    id="phoneId"
                    value={formData.phoneId}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneId: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) =>
                      setFormData({ ...formData, industry: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="master">Master (Optional)</Label>
                  <Input
                    id="master"
                    value={formData.master}
                    onChange={(e) =>
                      setFormData({ ...formData, master: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="joinDate">Join Date</Label>
                  <Input
                    id="joinDate"
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) =>
                      setFormData({ ...formData, joinDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "ACTIVE" | "INACTIVE") =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingMember ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Bulk Upload Members</DialogTitle>
              <DialogDescription>
                Upload an Excel file to add multiple members at once.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Excel Template</Label>
                <p className="text-sm text-muted-foreground">
                  Download the template, fill in your member data, and upload it back.
                </p>
                <Button variant="outline" onClick={downloadTemplate} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="file">Upload Excel File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
                {uploadFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {uploadFile.name}
                  </p>
                )}
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2">Required Columns:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Phone_ID (unique identifier)</li>
                  <li>• Member_Number</li>
                  <li>• Name</li>
                  <li>• Industry</li>
                  <li>• Master (optional)</li>
                  <li>• Join_Date (YYYY-MM-DD)</li>
                  <li>• Status (ACTIVE or INACTIVE)</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsUploadDialogOpen(false)
                  setUploadFile(null)
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={!uploadFile || uploading}>
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
