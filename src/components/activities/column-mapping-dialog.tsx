"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Save, Trash2, CheckCircle2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ExcelColumn {
  name: string
  index: number
}

interface ColumnMapping {
  excelColumn: string
  databaseField: string
}

interface ColumnMappingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: ExcelColumn[]
  sampleData: any[]
  onConfirm: (mapping: Record<string, string>) => void
  onCancel: () => void
}

// Required database fields for weekly activity
const DATABASE_FIELDS = [
  { key: "memberName", label: "Member Name (名称)", required: true },
  { key: "identity", label: "Identity (身份)", required: false },
  { key: "attendance", label: "Attendance (出席情况)", required: true },
  { key: "provideInsideRef", label: "Provide Inside Referrals (提供内部引荐)", required: true },
  { key: "provideOutsideRef", label: "Provide Outside Referrals (提供外部引荐)", required: true },
  { key: "receivedInsideRef", label: "Receive Inside Referrals (收到内部引荐)", required: true },
  { key: "receivedOutsideRef", label: "Receive Outside Referrals (收到外部引荐)", required: true },
  { key: "visitors", label: "Visitors (来宾)", required: true },
  { key: "oneToOneVisit", label: "One-to-One Meetings (一对一会面)", required: true },
  { key: "tyfcb", label: "TYFCB (交易价值)", required: true },
  { key: "ceu", label: "CEU", required: true },
]

export function ColumnMappingDialog({
  open,
  onOpenChange,
  columns,
  sampleData,
  onConfirm,
  onCancel,
}: ColumnMappingDialogProps) {
  const { toast } = useToast()
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [saveTemplateName, setSaveTemplateName] = useState("")
  const [saveAsDefault, setSaveAsDefault] = useState(false)
  const [savedTemplates, setSavedTemplates] = useState<any[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  // Auto-map columns based on column names
  useEffect(() => {
    if (columns.length > 0) {
      const autoMapping: Record<string, string> = {}
      
      // Chinese column names mapping
      const chineseMapping: Record<string, string> = {
        "名称": "memberName",
        "身份": "identity",
        "出席情况": "attendance",
        "提供内部引荐": "provideInsideRef",
        "提供外部引荐": "provideOutsideRef",
        "收到内部引荐": "receivedInsideRef",
        "收到外部引荐": "receivedOutsideRef",
        "来宾": "visitors",
        "一对一会面": "oneToOneVisit",
        "交易价值": "tyfcb",
        "CEU": "ceu",
      }
      
      columns.forEach((col) => {
        const mappedField = chineseMapping[col.name]
        if (mappedField) {
          autoMapping[mappedField] = col.name
        }
      })
      
      setMapping(autoMapping)
    }
  }, [columns])

  // Fetch saved templates when dialog opens
  useEffect(() => {
    if (open) {
      fetchSavedTemplates()
    }
  }, [open])

  const fetchSavedTemplates = async () => {
    try {
      setLoadingTemplates(true)
      const response = await fetch("/api/activities/upload/weekly/mappings?uploadType=weekly")
      const data = await response.json()
      if (data.success) {
        setSavedTemplates(data.templates)
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error)
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleMappingChange = (dbField: string, excelColumn: string) => {
    setMapping((prev) => ({
      ...prev,
      [dbField]: excelColumn,
    }))
  }

  const handleLoadTemplate = async (templateId: string) => {
    try {
      const template = savedTemplates.find((t) => t.id === templateId)
      if (template) {
        setMapping(template.mapping as Record<string, string>)
        toast({
          title: "Template loaded",
          description: `Loaded template "${template.name}"`,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load template",
      })
    }
  }

  const handleSaveTemplate = async () => {
    if (!saveTemplateName.trim()) {
      toast({
        variant: "destructive",
        title: "Template name required",
        description: "Please enter a name for the template",
      })
      return
    }

    try {
      const response = await fetch("/api/activities/upload/weekly/save-mapping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: saveTemplateName,
          mapping,
          isDefault: saveAsDefault,
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Template saved",
          description: `Template "${saveTemplateName}" saved successfully`,
        })
        setSaveTemplateName("")
        setSaveAsDefault(false)
        fetchSavedTemplates()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to save template",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save template",
      })
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    // Note: We'd need to implement a delete endpoint
    toast({
      title: "Not implemented",
      description: "Delete template feature coming soon",
    })
  }

  const handleConfirm = () => {
    // Validate required fields are mapped
    const requiredFields = DATABASE_FIELDS.filter((f) => f.required)
    const missingFields = requiredFields.filter((f) => !mapping[f.key])

    if (missingFields.length > 0) {
      toast({
        variant: "destructive",
        title: "Missing required mappings",
        description: `Please map: ${missingFields.map((f) => f.label).join(", ")}`,
      })
      return
    }

    onConfirm(mapping)
    onOpenChange(false)
  }

  const getSampleValue = (columnName: string) => {
    if (sampleData.length > 0 && sampleData[0][columnName] !== undefined) {
      return String(sampleData[0][columnName]).substring(0, 30)
    }
    return ""
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Map Excel Columns to Database Fields</DialogTitle>
          <DialogDescription>
            Match your Excel column names to the database fields. Required fields must be mapped.
          </DialogDescription>
        </DialogHeader>

        {/* Saved Templates */}
        <div className="space-y-2">
          <Label>Saved Templates</Label>
          <div className="flex gap-2">
            <Select onValueChange={handleLoadTemplate} disabled={loadingTemplates}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Load a template..." />
              </SelectTrigger>
              <SelectContent>
                {savedTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} {template.isDefault && "(Default)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchSavedTemplates} disabled={loadingTemplates}>
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Column Mapping Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">Database Field</TableHead>
                <TableHead className="w-1/3">Excel Column</TableHead>
                <TableHead className="w-1/3">Sample Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DATABASE_FIELDS.map((field) => (
                <TableRow key={field.key}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {field.required && <AlertCircle className="h-4 w-4 text-red-500" />}
                      <span className={field.required ? "font-medium" : ""}>{field.label}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={mapping[field.key] || ""}
                      onValueChange={(value) => handleMappingChange(field.key, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">-- None --</SelectItem>
                        {columns.map((col) => (
                          <SelectItem key={col.index} value={col.name}>
                            {col.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {getSampleValue(mapping[field.key])}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Save Template Section */}
        <div className="border-t pt-4 space-y-3">
          <Label>Save as Template</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Template name (e.g., Weekly Activity Template)"
              value={saveTemplateName}
              onChange={(e) => setSaveTemplateName(e.target.value)}
            />
            <Button onClick={handleSaveTemplate} variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="default"
              checked={saveAsDefault}
              onCheckedChange={(checked: boolean) => setSaveAsDefault(checked)}
            />
            <Label htmlFor="default" className="text-sm">
              Set as default template
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Confirm & Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
