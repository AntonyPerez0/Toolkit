"use client"

import { useState, useEffect } from "react"

// Replace with your Jira domain
const JIRA_DOMAIN = "https://your-domain.atlassian.net"

// You should implement proper authentication. This is just a placeholder.
const headers = {
  Authorization: `Basic ${btoa("your-email@example.com:your-api-token")}`,
  "Content-Type": "application/json",
}

export async function fetchTicket(issueKey: string) {
  const response = await fetch(`${JIRA_DOMAIN}/rest/api/2/issue/${issueKey}`, { headers })
  if (!response.ok) throw new Error("Failed to fetch ticket")
  return response.json()
}

export async function fetchTickets() {
  const response = await fetch(`${JIRA_DOMAIN}/rest/api/2/search?jql=assignee=currentUser()`, { headers })
  if (!response.ok) throw new Error("Failed to fetch tickets")
  const data = await response.json()
  return data.issues
}

export async function addComment(issueKey: string, comment: string) {
  const response = await fetch(`${JIRA_DOMAIN}/rest/api/2/issue/${issueKey}/comment`, {
    method: "POST",
    headers,
    body: JSON.stringify({ body: comment }),
  })
  if (!response.ok) throw new Error("Failed to add comment")
  return response.json()
}

export async function transitionTicket(issueKey: string, transitionId: string) {
  const response = await fetch(`${JIRA_DOMAIN}/rest/api/2/issue/${issueKey}/transitions`, {
    method: "POST",
    headers,
    body: JSON.stringify({ transition: { id: transitionId } }),
  })
  if (!response.ok) throw new Error("Failed to transition ticket")
}

export async function updateTicket(issueKey: string, fields: any) {
  const response = await fetch(`${JIRA_DOMAIN}/rest/api/2/issue/${issueKey}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ fields }),
  })
  if (!response.ok) throw new Error("Failed to update ticket")
}

export async function searchTickets(searchTerm: string) {
  const jql = encodeURIComponent(`${searchTerm} ORDER BY updated DESC`)
  const response = await fetch(`${JIRA_DOMAIN}/rest/api/2/search?jql=${jql}&maxResults=10`, { headers })
  if (!response.ok) throw new Error("Failed to search tickets")
  const data = await response.json()
  return data.issues.map((issue) => ({
    key: issue.key,
    summary: issue.fields.summary,
    owner: issue.fields.assignee?.displayName || "Unassigned",
    group: issue.fields.project.name,
  }))
}

export function useJiraTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTickets()
      .then(setTickets)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  return { tickets, loading, error }
}

