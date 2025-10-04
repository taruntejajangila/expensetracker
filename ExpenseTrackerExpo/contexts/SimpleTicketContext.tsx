import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import ApiClient from '../utils/ApiClient';

interface Message {
  id: string;
  message: string;
  is_admin_reply: boolean;
  user_name: string;
  created_at: string;
}

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  user_name: string;
  created_at: string;
  messages: Message[];
}

interface TicketContextType {
  activeTickets: Map<string, Ticket>;
  refreshTicket: (ticketId: string) => Promise<void>;
  subscribeToTicket: (ticketId: string) => void;
  unsubscribeFromTicket: (ticketId: string) => void;
  isPolling: boolean;
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export const useTicketContext = () => {
  const context = useContext(TicketContext);
  if (!context) {
    throw new Error('useTicketContext must be used within a TicketProvider');
  }
  return context;
};

interface TicketProviderProps {
  children: React.ReactNode;
}

export const SimpleTicketProvider: React.FC<TicketProviderProps> = ({ children }) => {
  const [activeTickets, setActiveTickets] = useState<Map<string, Ticket>>(new Map());
  const [subscribedTickets, setSubscribedTickets] = useState<Set<string>>(new Set());
  const [isPolling, setIsPolling] = useState(false);
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPollTime = useRef<Map<string, number>>(new Map());
  const POLL_INTERVAL = 5000; // 5 seconds for faster updates

  const fetchTicketDetails = async (ticketId: string): Promise<Ticket | null> => {
    try {
      const apiClient = ApiClient.getInstance();
      const response = await apiClient.get(`http://192.168.1.4:5000/api/support-tickets/${ticketId}`);
      
      if (response.success) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      return null;
    }
  };

  const refreshTicket = async (ticketId: string, force: boolean = false) => {
    const now = Date.now();
    const lastPoll = lastPollTime.current.get(ticketId) || 0;
    
    // Prevent polling too frequently (unless forced)
    if (!force && (now - lastPoll < POLL_INTERVAL)) {
      return;
    }
    
    lastPollTime.current.set(ticketId, now);
    
    try {
      const ticket = await fetchTicketDetails(ticketId);
      if (ticket) {
        setActiveTickets(prev => {
          const newMap = new Map(prev);
          newMap.set(ticketId, ticket);
          return newMap;
        });
      }
    } catch (error) {
      console.error(`Error refreshing ticket ${ticketId}:`, error);
    }
  };

  const subscribeToTicket = (ticketId: string) => {
    setSubscribedTickets(prev => new Set([...prev, ticketId]));
    
    // Fetch initial data immediately
    refreshTicket(ticketId);
  };

  const unsubscribeFromTicket = (ticketId: string) => {
    setSubscribedTickets(prev => {
      const newSet = new Set(prev);
      newSet.delete(ticketId);
      return newSet;
    });
    
    // Remove from active tickets
    setActiveTickets(prev => {
      const newMap = new Map(prev);
      newMap.delete(ticketId);
      return newMap;
    });
    
    // Clear last poll time
    lastPollTime.current.delete(ticketId);
  };

  // Simple polling effect - much more conservative
  useEffect(() => {
    if (subscribedTickets.size > 0) {
      setIsPolling(true);
      
      pollIntervalRef.current = setInterval(() => {
        // Only poll for tickets that are open or in_progress
        const ticketsToPoll = Array.from(subscribedTickets);
        
        ticketsToPoll.forEach(ticketId => {
          const ticket = activeTickets.get(ticketId);
          if (ticket && (ticket.status === 'open' || ticket.status === 'in_progress')) {
            refreshTicket(ticketId);
          }
        });
      }, POLL_INTERVAL);
    } else {
      setIsPolling(false);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setIsPolling(false);
    };
  }, [subscribedTickets.size]);

  const value: TicketContextType = {
    activeTickets,
    refreshTicket,
    subscribeToTicket,
    unsubscribeFromTicket,
    isPolling,
  };

  return (
    <TicketContext.Provider value={value}>
      {children}
    </TicketContext.Provider>
  );
};
