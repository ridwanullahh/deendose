"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CheckCircle, XCircle, Edit, Calendar, ChevronDown, ChevronUp } from "lucide-react"
import type { QueuedContent } from "@/lib/services/content-pipeline"

export default function ContentReviewQueue() {
  const [queue, setQueue] = useState<QueuedContent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContent, setSelectedContent] = useState<QueuedContent | null>(null)

  useEffect(() => {
    loadQueue()
  }, [])

  const loadQueue = async () => {
    try {
      const response = await fetch('/api/admin/content-queue')
      const data = await response.json()
      setQueue(data)
    } catch (error) {
      console.error('Failed to load queue:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (contentId: string) => {
    try {
      const response = await fetch(`/api/admin/content/${contentId}/approve`, {
        method: 'POST'
      })

      if (response.ok) {
        await loadQueue()
        setSelectedContent(null)
      }
    } catch (error) {
      console.error('Failed to approve content:', error)
    }
  }

  const handleReject = async (contentId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/content/${contentId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })

      if (response.ok) {
        await loadQueue()
        setSelectedContent(null)
      }
    } catch (error) {
      console.error('Failed to reject content:', error)
    }
  }

  const pendingContent = queue.filter(c => c.status === 'pending_review')
  const approvedContent = queue.filter(c => c.status === 'approved')

  if (loading) {
    return <div>Loading queue...</div>
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Review ({pendingContent.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedContent.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingContent.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No content pending review
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingContent.map((content) => (
                <ContentCard
                  key={content.id}
                  content={content}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onSelect={setSelectedContent}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedContent.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No approved content in queue
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {approvedContent.map((content) => (
                <ContentCard
                  key={content.id}
                  content={content}
                  onSelect={setSelectedContent}
                  readonly
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ContentCard({
  content,
  onApprove,
  onReject,
  onSelect,
  readonly = false
}: {
  content: QueuedContent
  onApprove?: (id: string) => void
  onReject?: (id: string, reason: string) => void
  onSelect: (content: QueuedContent) => void
  readonly?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [showRejectForm, setShowRejectForm] = useState(false)

  const scheduledDate = new Date(content.scheduledFor)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {content.verse.surah.englishName} {content.verse.surah.number}:{content.verse.numberInSurah}
            </CardTitle>
            <CardDescription>
              Scheduled for: {scheduledDate.toLocaleDateString()} at {scheduledDate.toLocaleTimeString()}
            </CardDescription>
          </div>
          <Badge variant={content.status === 'approved' ? 'success' : 'secondary'}>
            {content.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Arabic Text */}
        <div className="text-right text-2xl font-arabic leading-loose">
          {content.verse.text}
        </div>

        {/* Translation */}
        <div className="text-base italic border-l-4 border-green-600 pl-4">
          {content.verse.translation}
        </div>

        {/* Tafseer Summary */}
        <div className="space-y-2">
          <h4 className="font-semibold">Tafseer Summary:</h4>
          <p className="text-sm text-muted-foreground">
            {content.tafseer.summary.substring(0, 200)}...
          </p>
        </div>

        {/* Expand/Collapse */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4 mr-2" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-2" />
              Show Full Content
            </>
          )}
        </Button>

        {expanded && (
          <div className="space-y-4 pt-4 border-t">
            {/* Full Tafseer */}
            <div className="space-y-2">
              <h4 className="font-semibold">Full Summary:</h4>
              <p className="text-sm">{content.tafseer.summary}</p>
            </div>

            {/* Key Points */}
            <div className="space-y-2">
              <h4 className="font-semibold">Key Points:</h4>
              <ul className="list-disc list-inside space-y-1">
                {content.tafseer.keyPoints.map((point, i) => (
                  <li key={i} className="text-sm">{point}</li>
                ))}
              </ul>
            </div>

            {/* Practical Applications */}
            <div className="space-y-2">
              <h4 className="font-semibold">Practical Applications:</h4>
              <ul className="list-disc list-inside space-y-1">
                {content.tafseer.practicalApplications.map((app, i) => (
                  <li key={i} className="text-sm">{app}</li>
                ))}
              </ul>
            </div>

            {/* Sources */}
            <div className="space-y-2">
              <h4 className="font-semibold">Sources:</h4>
              <div className="flex flex-wrap gap-2">
                {content.tafseer.sources.map((source, i) => (
                  <Badge key={i} variant="outline">{source}</Badge>
                ))}
              </div>
            </div>

            {/* Hadith if available */}
            {content.hadith && (
              <div className="space-y-2 border-t pt-4">
                <h4 className="font-semibold">Related Hadith:</h4>
                <p className="text-sm italic">{content.hadith.translation}</p>
                <p className="text-xs text-muted-foreground">
                  {content.hadith.reference} - Narrator: {content.hadith.narrator}
                </p>
              </div>
            )}

            {/* AI Validation Chain */}
            <div className="space-y-2 border-t pt-4">
              <h4 className="font-semibold">AI Validation Chain:</h4>
              <Accordion type="single" collapsible>
                {content.validationLog.map((log, i) => (
                  <AccordionItem key={i} value={`agent-${i}`}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        {log.approved ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className="text-sm">{log.agent}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">{log.feedback}</p>
                      {log.sources && log.sources.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold">Sources checked:</p>
                          <ul className="text-xs list-disc list-inside">
                            {log.sources.map((src, j) => (
                              <li key={j}>{src}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!readonly && onApprove && onReject && (
          <div className="flex gap-2 pt-4 border-t">
            {!showRejectForm ? (
              <>
                <Button
                  onClick={() => onApprove(content.id)}
                  className="flex-1"
                  variant="default"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={() => setShowRejectForm(true)}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </>
            ) : (
              <div className="w-full space-y-2">
                <input
                  type="text"
                  placeholder="Rejection reason..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      onReject(content.id, rejectReason)
                      setShowRejectForm(false)
                      setRejectReason("")
                    }}
                    variant="destructive"
                    className="flex-1"
                    disabled={!rejectReason}
                  >
                    Confirm Reject
                  </Button>
                  <Button
                    onClick={() => {
                      setShowRejectForm(false)
                      setRejectReason("")
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
