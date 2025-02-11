"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { fetchTicket, addComment, transitionTicket, updateTicket, useJiraTickets } from "../utils/jiraApi"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import TicketAutocomplete from "./TicketAutocomplete"

export default function JiraTicketInterface() {
  const [currentTicket, setCurrentTicket] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { register, handleSubmit, reset } = useForm()
  const { tickets, loading: ticketsLoading, error: ticketsError } = useJiraTickets()

  const onSubmit = async (data) => {
    setLoading(true)
    setError(null)
    try {
      const ticket = await fetchTicket(data.issueKey)
      setCurrentTicket(ticket)
      reset()
    } catch (err) {
      setError("Failed to fetch ticket")
    }
    setLoading(false)
  }

  const handleComment = async (data) => {
    setLoading(true)
    setError(null)
    try {
      await addComment(currentTicket.key, data.comment)
      const updatedTicket = await fetchTicket(currentTicket.key)
      setCurrentTicket(updatedTicket)
      reset()
    } catch (err) {
      setError("Failed to add comment")
    }
    setLoading(false)
  }

  const handleTransition = async (transitionId) => {
    setLoading(true)
    setError(null)
    try {
      await transitionTicket(currentTicket.key, transitionId)
      const updatedTicket = await fetchTicket(currentTicket.key)
      setCurrentTicket(updatedTicket)
    } catch (err) {
      setError("Failed to transition ticket")
    }
    setLoading(false)
  }

  const handleFieldUpdate = async (field, value) => {
    setLoading(true)
    setError(null)
    try {
      await updateTicket(currentTicket.key, { [field]: value })
      const updatedTicket = await fetchTicket(currentTicket.key)
      setCurrentTicket(updatedTicket)
    } catch (err) {
      setError(`Failed to update ${field}`)
    }
    setLoading(false)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Jira Ticket Interface</CardTitle>
        <CardDescription>Search and interact with your Jira tickets</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Search Tickets</h3>
          <TicketAutocomplete onSelectTicket={(ticketKey) => onSubmit({ issueKey: ticketKey })} />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {currentTicket && (
          <div className="space-y-6 pt-4 border-t">
            <h3 className="text-xl font-semibold">
              {currentTicket.key}: {currentTicket.fields.summary}
            </h3>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="summary">Summary</Label>
                <Input
                  id="summary"
                  defaultValue={currentTicket.fields.summary}
                  onBlur={(e) => handleFieldUpdate("summary", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  defaultValue={currentTicket.fields.priority.id}
                  onValueChange={(value) => handleFieldUpdate("priority", { id: value })}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Highest</SelectItem>
                    <SelectItem value="2">High</SelectItem>
                    <SelectItem value="3">Medium</SelectItem>
                    <SelectItem value="4">Low</SelectItem>
                    <SelectItem value="5">Lowest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Add a comment</Label>
              <Textarea id="comment" {...register("comment")} />
              <Button onClick={handleSubmit(handleComment)} disabled={loading} className="mt-2">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Comment...
                  </>
                ) : (
                  "Add Comment"
                )}
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Actions</Label>
              <div className="flex flex-wrap gap-2">
                {currentTicket.transitions.map((transition) => (
                  <Button
                    key={transition.id}
                    onClick={() => handleTransition(transition.id)}
                    disabled={loading}
                    variant="secondary"
                  >
                    {transition.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

