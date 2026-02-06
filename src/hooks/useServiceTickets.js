import { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const STARTING_TICKET_NUMBER = 25001;
const STORAGE_KEY = 'recomputeit_tickets';

const readTicketsFromStorage = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error parsing ticket storage:', e);
    return [];
  }
};

const writeTicketsToStorage = (tickets) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
};

export const useServiceTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { session, user, loading: authLoading } = useSupabaseAuth();
  const { toast } = useToast();

  const getNextTicketNumber = useCallback(async () => {
    const existingTickets = readTicketsFromStorage();
    const maxTicketNumber = existingTickets.reduce(
      (max, ticket) => Math.max(max, Number(ticket.ticket_number) || 0),
      0
    );
    return maxTicketNumber > 0 ? maxTicketNumber + 1 : STARTING_TICKET_NUMBER;
  }, [toast]);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const storedTickets = readTicketsFromStorage();
      if (!session) {
        setTickets([]);
      } else {
        const sortedTickets = [...storedTickets].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setTickets(sortedTickets);
      }
    } catch (error) {
      console.error("Failed to load service tickets:", error);
      toast({
        title: "Kunde inte hämta ärenden",
        description: "Ett fel uppstod vid hämtning av data från databasen.",
        variant: "destructive",
      });
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [session, toast]);

  useEffect(() => {
    if (!authLoading) {
      loadTickets();
    }
  }, [authLoading, loadTickets]);

  const addTicket = useCallback(async (ticketData) => {
    const nextTicketNumber = await getNextTicketNumber();

    const newTicketPayload = {
      ticket_number: nextTicketNumber,
      customer_name: `${ticketData.firstName} ${ticketData.lastName}`,
      customer_email: ticketData.email,
      customer_phone: ticketData.phone,
      device_type: ticketData.deviceType,
      device_model: ticketData.deviceModel,
      issue_description: ticketData.problemDescription,
      additional_notes: ticketData.additionalNotes,
      disclaimer_language: ticketData.disclaimerLanguage,
      status: 'Nytt',
      user_id: user ? user.id : null,
      cost_proposal_approved: false,
      internal_notes: '',
      work_done_summary: '',
      final_cost: '',
      diagnosis: '',
      is_hidden: false,
      id: `ticket-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      created_at: new Date().toISOString(),
    };

    try {
      const existingTickets = readTicketsFromStorage();
      const updatedTickets = [newTicketPayload, ...existingTickets];
      writeTicketsToStorage(updatedTickets);
      if (session) {
        loadTickets();
      }
      return newTicketPayload;
    } catch (error) {
      console.error("Error adding ticket:", error);
      toast({
        title: "Kunde inte skapa ärende",
        description: "Ett fel uppstod. Försök igen.",
        variant: "destructive",
      });
      return null;
    }
  }, [user, session, getNextTicketNumber, loadTickets, toast]);
  
  const updateTicket = useCallback(async (ticketId, updates) => {
    try {
      const existingTickets = readTicketsFromStorage();
      const updatedTickets = existingTickets.map(ticket =>
        ticket.id === ticketId ? { ...ticket, ...updates } : ticket
      );
      writeTicketsToStorage(updatedTickets);

      const updatedTicket = updatedTickets.find(ticket => ticket.id === ticketId) || null;
      setTickets(prevTickets =>
        prevTickets.map(ticket => (ticket.id === ticketId ? updatedTicket : ticket))
      );

      return updatedTicket;
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast({
        title: "Kunde inte uppdatera ärende",
        description: "Ett fel uppstod. Försök igen.",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);
  
  return { tickets, addTicket, loading: loading || authLoading, refreshTickets: loadTickets, updateTicket };
};
