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
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Term {
  id: string
  term: string
  startTime: string
  endTime: string
  weekNumber: number
  date: string
  isMeeting: boolean
  remarks: string | null
  createdAt: string
  updatedAt: string
}

export default function TermsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [terms, setTerms] = useState<Term[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTerm, setEditingTerm] = useState<Term | null>(null)
  const [formData, setFormData] = useState({
    term: "",
    startTime: "",
    endTime: "",
    weekNumber: "",
    date: "",
    isMeeting: true,
    remarks: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchTerms()
    }
  }, [status])

  const fetchTerms = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/terms")
      const data = await response.json()
      setTerms(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch terms",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingTerm(null)
    setFormData({
      term: "",
      startTime: new Date().toISOString().slice(0, 16),
      endTime: new Date().toISOString().slice(0, 16),
      weekNumber: "",
      date: new Date().toISOString().split("T")[0],
      isMeeting: true,
      remarks: "",
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (term: Term) => {
    setEditingTerm(term)
    setFormData({
      term: term.term,
      startTime: term.startTime.slice(0, 16),
      endTime: term.endTime.slice(0, 16),
      weekNumber: term.weekNumber.toString(),
      date: term.date.split("T")[0],
      isMeeting: term.isMeeting,
      remarks: term.remarks || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this term?")) return

    try {
      const response = await fetch(`/api/terms?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Term deleted successfully",
        })
        fetchTerms()
      } else {
        throw new Error("Failed to delete term")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete term",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingTerm ? "/api/terms" : "/api/terms"
      const method = editingTerm ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          editingTerm
            ? { ...formData, id: editingTerm.id, weekNumber: parseInt(formData.weekNumber) }
            : { ...formData, weekNumber: parseInt(formData.weekNumber) }
        ),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: editingTerm
            ? "Term updated successfully"
            : "Term created successfully",
        })
        setIsDialogOpen(false)
        fetchTerms()
      } else {
        throw new Error("Failed to save term")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save term",
      })
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
                Terms & Meetings
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your BNI terms and meeting schedule
              </p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Term
            </Button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Term</TableHead>
                      <TableHead>Week</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead>Meeting</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {terms.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No terms found
                        </TableCell>
                      </TableRow>
                    ) : (
                      terms.map((term) => (
                        <TableRow key={term.id}>
                          <TableCell className="font-medium">{term.term}</TableCell>
                          <TableCell>{term.weekNumber}</TableCell>
                          <TableCell>
                            {new Date(term.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {new Date(term.startTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell>
                            {new Date(term.endTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={term.isMeeting ? "default" : "secondary"}>
                              {term.isMeeting ? "Yes" : "No"}
                            </Badge>
                          </TableCell>
                          <TableCell>{term.remarks || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(term)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(term.id)}
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

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingTerm ? "Edit Term" : "Add New Term"}
                </DialogTitle>
                <DialogDescription>
                  {editingTerm
                    ? "Update term details below."
                    : "Fill in details to add a new term."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="term">Term Name</Label>
                    <Input
                      id="term"
                      value={formData.term}
                      onChange={(e) =>
                        setFormData({ ...formData, term: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="weekNumber">Week Number</Label>
                    <Input
                      id="weekNumber"
                      type="number"
                      min="1"
                      max="52"
                      value={formData.weekNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, weekNumber: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="datetime-local"
                        value={formData.startTime}
                        onChange={(e) =>
                          setFormData({ ...formData, startTime: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="datetime-local"
                        value={formData.endTime}
                        onChange={(e) =>
                          setFormData({ ...formData, endTime: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isMeeting"
                      checked={formData.isMeeting}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isMeeting: checked })
                      }
                    />
                    <Label htmlFor="isMeeting" className="cursor-pointer">
                      Is this a meeting?
                    </Label>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="remarks">Remarks (Optional)</Label>
                    <Input
                      id="remarks"
                      value={formData.remarks}
                      onChange={(e) =>
                        setFormData({ ...formData, remarks: e.target.value })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingTerm ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  )
}
