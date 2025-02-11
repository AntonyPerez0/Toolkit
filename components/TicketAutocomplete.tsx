"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { searchTickets } from "../utils/jiraApi"

interface Ticket {
  key: string
  summary: string
  owner: string
  group: string
}

interface TicketAutocompleteProps {
  onSelectTicket: (ticketKey: string) => void
}

export default function TicketAutocomplete({ onSelectTicket }: TicketAutocompleteProps) {
  const [searchFields, setSearchFields] = useState({
    prefix: "",
    owner: "",
    group: "",
  })
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const { prefix, owner, group } = searchFields
      if (prefix || owner || group) {
        setLoading(true)
        setError(null)

        // Construct search term based on available fields
        const searchTerms = []
        if (prefix) searchTerms.push(`key ~ "${prefix.toUpperCase()}-*"`)
        if (owner) searchTerms.push(`assignee ~ "${owner}*"`)
        if (group) searchTerms.push(`project ~ "${group}*"`)

        const searchTerm = searchTerms.join(" AND ")

        searchTickets(searchTerm)
          .then((results) => {
            setTickets(results)
            setShowDropdown(true)
          })
          .catch((err) => {
            setError("Failed to search tickets")
            setTickets([])
          })
          .finally(() => setLoading(false))
      } else {
        setTickets([])
        setShowDropdown(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchFields])

  const handleSelectTicket = (ticketKey: string) => {
    onSelectTicket(ticketKey)
    setSearchFields({ prefix: "", owner: "", group: "" })
    setShowDropdown(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setSearchFields((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ticket-prefix">Ticket Prefix</Label>
          <Input
            id="ticket-prefix"
            placeholder="e.g., DS"
            value={searchFields.prefix}
            onChange={(e) => handleInputChange("prefix", e.target.value)}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ticket-owner">Owner</Label>
          <Input
            id="ticket-owner"
            placeholder="Ticket owner"
            value={searchFields.owner}
            onChange={(e) => handleInputChange("owner", e.target.value)}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ticket-group">Group</Label>
          <Input
            id="ticket-group"
            placeholder="Project/Group name"
            value={searchFields.group}
            onChange={(e) => handleInputChange("group", e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <div className="relative">
        {loading && (
          <div className="absolute right-2 -top-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        )}

        {showDropdown && tickets.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
          >
            {tickets.map((ticket) => (
              <Button
                key={ticket.key}
                variant="ghost"
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex flex-col items-start"
                onClick={() => handleSelectTicket(ticket.key)}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">{ticket.key}</span>
                  <span className="text-sm text-muted-foreground">
                    {ticket.owner} | {ticket.group}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground truncate w-full">{ticket.summary}</span>
              </Button>
            ))}
          </div>
        )}

        {error && <p className="text-destructive mt-1 text-sm">{error}</p>}
      </div>
    </div>
  )
}

